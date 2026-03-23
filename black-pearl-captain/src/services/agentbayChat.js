// AgentBay Crew Chat API Service
// 通过本地代理服务器调用 AgentBay API

const PROXY_URL = ''; // 使用相对路径，通过 Vite 代理

class AgentBayChatService {
  constructor() {
    this.externalUserId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    this.sessionId = null;
  }

  /**
   * 获取 ChatToken（通过代理）
   */
  async getChatToken() {
    const url = `${PROXY_URL}/api/token`;
    
    console.log('[AgentBay] 获取 ChatToken...');
    console.log('[AgentBay] ExternalUserId:', this.externalUserId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalUserId: this.externalUserId,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`GetChatToken 失败: ${result.error}`);
    }

    console.log('[AgentBay] ChatToken 获取成功');
    return result.token;
  }

  /**
   * Chat - 流式对话（通过代理）
   */
  async chat(message, onMessage, onComplete, onError) {
    try {
      // 生成 SessionId
      if (!this.sessionId) {
        this.sessionId = `session-${Date.now()}`;
      }

      // 构建 Input 参数
      const inputArray = [{
        Role: 'user',
        Content: [{
          Type: 'text',
          Text: message,
        }],
      }];
      const inputString = JSON.stringify(inputArray);

      const url = `${PROXY_URL}/api/chat`;

      console.log('[AgentBay] 发起对话...');
      console.log('[AgentBay] SessionId:', this.sessionId);
      console.log('[AgentBay] Message:', message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ExternalUserId: this.externalUserId,
          SessionId: this.sessionId,
          Input: inputString,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat 失败: HTTP ${response.status} - ${errorText}`);
      }

      // 处理 SSE 流
      console.log('[AgentBay] 接收 SSE 流...');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[AgentBay] SSE 流结束');
          onComplete?.(fullText);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          // 同时支持 "data:" 和 "data: " 两种格式
          if (line.startsWith('data:')) {
            // 移除 "data:" 前缀，并去除可能的前导空格
            let dataStr = line.slice(5);
            if (dataStr.startsWith(' ')) {
              dataStr = dataStr.slice(1);
            }
            dataStr = dataStr.trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);

              // 根据 Object 类型处理不同事件
              // 注意：API 可能返回 "response", "message", "content" 等不同类型
              const objectType = data.Object || data.object;
              const status = data.Status || data.status;
              const type = data.Type || data.type;
              const text = data.Text || data.text;

              switch (objectType) {
                case 'content':
                  if (type === 'text' && text) {
                    fullText += text;
                    onMessage?.(text, fullText);
                    console.log('[AgentBay] 收到文本:', text);
                  }
                  break;

                case 'message':
                case 'response': // API 也可能返回 response 类型
                  if (status === 'completed') {
                    console.log('[AgentBay] 对话完成');
                    onComplete?.(fullText);
                    return;
                  } else if (status === 'failed') {
                    throw new Error('对话生成失败');
                  } else if (status === 'in_progress') {
                    // 进行中，继续接收
                    console.log('[AgentBay] 生成中...');
                  }
                  break;

                case 'error':
                  throw new Error(data.Message || data.message || '对话发生错误');

                default:
                  // 未知类型，记录日志但继续处理
                  console.log('[AgentBay] 未知事件类型:', objectType, data);
              }
            } catch (e) {
              if (e.message.includes('对话')) throw e;
            }
          }
        }
      }
    } catch (error) {
      console.error('[AgentBay] Chat 失败:', error);
      onError?.(error.message);
      throw error;
    }
  }

  reset() {
    this.sessionId = null;
  }

  isConfigured() {
    return true;
  }
}

export const agentBayChat = new AgentBayChatService();
export default AgentBayChatService;
