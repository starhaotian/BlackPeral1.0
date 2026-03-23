import { useState, useCallback, useRef } from 'react';
import { agentBayService } from '../services/agentbay';

/**
 * AgentBay Hook
 * 用于在 React 组件中调用 AgentBay API
 */
export function useAgentBay() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);

  /**
   * 执行用户指令
   */
  const executeCommand = useCallback(async (command) => {
    setIsLoading(true);
    setError(null);

    try {
      // 检查 API 配置
      if (!agentBayService.isConfigured()) {
        return {
          type: 'error',
          result: 'AgentBay API Key 未配置。请在项目根目录创建 .env 文件并添加：\nVITE_AGENTBAY_API_KEY=your_api_key',
        };
      }

      const result = await agentBayService.executeCommand(command);
      
      // 更新会话引用
      if (agentBayService.session) {
        sessionRef.current = agentBayService.session;
        setSession(agentBayService.session);
      }

      return result;
    } catch (err) {
      setError(err.message);
      return {
        type: 'error',
        result: `执行失败: ${err.message}`,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 创建新会话
   */
  const createSession = useCallback(async (options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!agentBayService.isConfigured()) {
        throw new Error('API Key 未配置');
      }

      const result = await agentBayService.createSession(options);
      sessionRef.current = result.session;
      setSession(result.session);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 删除当前会话
   */
  const deleteSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await agentBayService.deleteSession();
      sessionRef.current = null;
      setSession(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 执行代码
   */
  const executeCode = useCallback(async (code, language = 'python') => {
    setIsLoading(true);
    setError(null);

    try {
      if (!agentBayService.isConfigured()) {
        throw new Error('API Key 未配置');
      }

      const result = await agentBayService.executeCode(code, language);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取会话状态
   */
  const getSessionStatus = useCallback(async () => {
    try {
      const status = await agentBayService.getSessionStatus();
      return status;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    session,
    isConfigured: agentBayService.isConfigured(),
    executeCommand,
    createSession,
    deleteSession,
    executeCode,
    getSessionStatus,
  };
}

export default useAgentBay;
