import { useState, useCallback } from 'react';
import { agentBayChat } from '../services/agentbayChat';

/**
 * AgentBay Chat Hook
 * 用于流式对话，支持打字机效果
 */
export function useAgentBayChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 发送消息并获取流式响应
   * @param {string} message - 用户消息
   * @param {Function} onStream - 流式数据回调 (chunk, fullText)
   * @returns {Promise<string>} 完整响应
   */
  const sendMessage = useCallback(async (message, onStream) => {
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      let fullText = '';
      
      await agentBayChat.chat(
        message,
        // onMessage - 收到每个 chunk
        (delta, full) => {
          fullText = full;
          onStream?.(delta, full);
        },
        // onComplete - 完成
        (final) => {
          setIsStreaming(false);
          setIsLoading(false);
        },
        // onError - 错误
        (errMsg) => {
          setError(errMsg);
          setIsStreaming(false);
          setIsLoading(false);
        }
      );

      return fullText;
    } catch (err) {
      setError(err.message);
      setIsStreaming(false);
      setIsLoading(false);
      throw err;
    }
  }, []);

  /**
   * 重置会话
   */
  const resetSession = useCallback(() => {
    agentBayChat.reset();
    setError(null);
  }, []);

  return {
    isLoading,
    isStreaming,
    error,
    isConfigured: true, // 不需要外部配置
    sendMessage,
    resetSession,
  };
}

export default useAgentBayChat;
