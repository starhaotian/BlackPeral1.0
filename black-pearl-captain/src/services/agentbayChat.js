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
      const processedSeqNums = new Set(); // 基于 SequenceNumber 去重
      let completed = false; // 标记是否已通过 response.completed 完成
      let currentMessageId = null; // 跟踪当前消息 ID，防止多条消息内容重复累加

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[AgentBay] SSE 流结束');
          // onComplete 由 response.completed 事件触发，避免重复调用
          // 如果流结束但未收到 completed 事件，兜底调用
          if (!completed) {
            onComplete?.(fullText);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          console.log('[AgentBay] SSE line:', line); // 调试日志
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
              console.log('[AgentBay] 解析数据:', data); // 调试日志

              // 基于 SequenceNumber 去重，跳过已处理的事件
              const seqNum = data.SequenceNumber || data.sequenceNumber;
              if (seqNum !== undefined) {
                if (processedSeqNums.has(seqNum)) {
                  console.log('[AgentBay] 跳过重复事件, SequenceNumber:', seqNum);
                  continue;
                }
                processedSeqNums.add(seqNum);
              }

              // 根据 Object 类型处理不同事件
              const objectType = data.Object || data.object;
              const status = data.Status || data.status;
              const type = data.Type || data.type;
              const text = data.Text || data.text;
              const messageId = data.MessageId || data.messageId;

              switch (objectType) {
                case 'content':
                  // 处理文本内容
                  if (type === 'text' && text) {
                    // 检测到新消息时重置 fullText，防止多条消息内容重复拼接
                    if (messageId && currentMessageId && messageId !== currentMessageId) {
                      console.log('[AgentBay] 新消息开始，重置 fullText. 旧:', currentMessageId, '新:', messageId);
                      fullText = '';
                    }
                    if (messageId) {
                      currentMessageId = messageId;
                    }
                    // 文本级去重：如果 text 已经是 fullText 的尾部，跳过追加
                    if (fullText.length > 0 && fullText.endsWith(text)) {
                      console.log('[AgentBay] 跳过重复文本片段:', text.slice(0, 30));
                    } else {
                      fullText += text;
                      onMessage?.(text, fullText);
                    }
                    console.log('[AgentBay] 收到文本 (msgId:', messageId, '):', text.slice(0, 50));
                  }
                  break;

                case 'response':
                  // 只有 response 对象的 completed 表示整个对话结束
                  if (status === 'completed') {
                    console.log('[AgentBay] 对话完成');
                    completed = true;
                    onComplete?.(fullText);
                    return;
                  }
                  break;

                case 'message': {
                  // message 对象的 completed 只表示当前消息完成，不结束循环
                  const msgId = data.MessageId || data.messageId || data.Id || data.id;
                  if (status === 'in_progress' && msgId) {
                    // 新消息开始
                    if (currentMessageId && msgId !== currentMessageId) {
                      console.log('[AgentBay] 新 message 开始，重置 fullText. 旧:', currentMessageId, '新:', msgId);
                      fullText = '';
                    }
                    currentMessageId = msgId;
                  }
                  if (status === 'failed') {
                    throw new Error('对话生成失败');
                  }
                  console.log('[AgentBay] 消息状态:', status, 'msgId:', msgId);
                  break;
                }

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
