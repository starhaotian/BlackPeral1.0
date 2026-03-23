// AgentBay Chat API Service
// 实现 GetChatToken -> Chat -> SSE 流式响应的完整流程

const API_BASE_URL = import.meta.env.VITE_AGENTBAY_API_URL || 'https://agentbay.aliyuncs.com';
const API_KEY = import.meta.env.VITE_AGENTBAY_API_KEY;

class AgentBayChatService {
  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = API_BASE_URL;
    this.accessToken = null;
    this.sessionId = null;
  }

  /**
   * 检查 API 配置是否有效
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * 步骤 1: 获取 Chat 访问令牌 (AccessToken)
   * @param {string} sessionId - 可选的会话ID
   * @returns {Promise<string>} AccessToken
   */
  async getChatToken(sessionId = null) {
    if (!this.isConfigured()) {
      throw new Error('AgentBay API Key 未配置');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/chat/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          // 可选：指定镜像类型
          image_id: 'code_latest',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '获取 Chat Token 失败');
      }

      const result = await response.json();
      this.accessToken = result.access_token;
      this.sessionId = result.session_id || sessionId;
      
      return this.accessToken;
    } catch (error) {
      console.error('获取 Chat Token 失败:', error);
      throw error;
    }
  }

  /**
   * 步骤 2 & 3: 调用 Chat 接口并接收 SSE 流式响应
   * @param {string} message - 用户消息
   * @param {Function} onMessage - 收到消息时的回调 (delta, fullText)
   * @param {Function} onComplete - 对话完成时的回调 (fullText)
   * @param {Function} onError - 错误回调
   * @returns {Promise<void>}
   */
  async chat(message, onMessage, onComplete, onError) {
    try {
      // 确保有 AccessToken
      if (!this.accessToken) {
        await this.getChatToken(this.sessionId);
      }

      // 建立 SSE 连接
      const response = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          message: message,
          session_id: this.sessionId,
          stream: true, // 启用流式响应
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Chat 请求失败');
      }

      // 处理 SSE 流
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete?.(fullText);
          break;
        }

        // 解码并处理 SSE 数据
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // 移除 'data: ' 前缀
            
            if (data === '[DONE]') {
              onComplete?.(fullText);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              
              if (delta) {
                fullText += delta;
                onMessage?.(delta, fullText);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat 请求失败:', error);
      onError?.(error.message);
      throw error;
    }
  }

  /**
   * 发送消息并获取完整响应（非流式）
   * @param {string} message - 用户消息
   * @returns {Promise<string>} 完整响应文本
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      let fullText = '';
      
      this.chat(
        message,
        (delta, full) => {
          fullText = full;
        },
        (final) => {
          resolve(final || fullText);
        },
        (error) => {
          reject(new Error(error));
        }
      );
    });
  }

  /**
   * 重置会话
   */
  reset() {
    this.accessToken = null;
    this.sessionId = null;
  }

  /**
   * 获取当前会话ID
   */
  getSessionId() {
    return this.sessionId;
  }
}

// 导出单例实例
export const agentBayChat = new AgentBayChatService();
export default AgentBayChatService;
