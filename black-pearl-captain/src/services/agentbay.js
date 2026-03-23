// AgentBay API Service
// 封装 AgentBay SDK 的调用，支持通过对话驱动 Agent 执行

const API_BASE_URL = import.meta.env.VITE_AGENTBAY_API_URL || 'https://agentbay.aliyuncs.com';
const API_KEY = import.meta.env.VITE_AGENTBAY_API_KEY;

/**
 * AgentBay 服务类
 * 用于管理会话、执行代码、浏览器自动化等操作
 */
class AgentBayService {
  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = API_BASE_URL;
    this.session = null;
  }

  /**
   * 检查 API 配置是否有效
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * 创建新会话
   * @param {Object} options - 会话配置选项
   * @param {string} options.imageId - 镜像ID (如: 'code_latest', 'browser_latest')
   * @returns {Promise<Object>} 会话信息
   */
  async createSession(options = {}) {
    if (!this.isConfigured()) {
      throw new Error('AgentBay API Key 未配置，请设置 VITE_AGENTBAY_API_KEY 环境变量');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          image_id: options.imageId || 'code_latest',
          ...options,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '创建会话失败');
      }

      const result = await response.json();
      this.session = result.session;
      return result;
    } catch (error) {
      console.error('创建 AgentBay 会话失败:', error);
      throw error;
    }
  }

  /**
   * 执行代码
   * @param {string} code - 要执行的代码
   * @param {string} language - 编程语言 (python, javascript, etc.)
   * @returns {Promise<Object>} 执行结果
   */
  async executeCode(code, language = 'python') {
    if (!this.session) {
      // 自动创建会话
      await this.createSession({ imageId: 'code_latest' });
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/sessions/${this.session.id}/code/execute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            code,
            language,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '代码执行失败');
      }

      return await response.json();
    } catch (error) {
      console.error('代码执行失败:', error);
      throw error;
    }
  }

  /**
   * 初始化浏览器
   * @param {Object} options - 浏览器配置选项
   * @returns {Promise<Object>} 浏览器端点信息
   */
  async initBrowser(options = {}) {
    if (!this.session) {
      await this.createSession({ imageId: 'browser_latest' });
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/sessions/${this.session.id}/browser/init`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(options),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '浏览器初始化失败');
      }

      return await response.json();
    } catch (error) {
      console.error('浏览器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取浏览器端点 URL
   * @returns {Promise<string>} CDP 端点 URL
   */
  async getBrowserEndpoint() {
    if (!this.session) {
      throw new Error('没有活动的会话');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/sessions/${this.session.id}/browser/endpoint`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '获取浏览器端点失败');
      }

      const result = await response.json();
      return result.endpoint_url;
    } catch (error) {
      console.error('获取浏览器端点失败:', error);
      throw error;
    }
  }

  /**
   * 在浏览器中执行操作
   * @param {Object} action - 浏览器操作
   * @param {string} action.type - 操作类型 (navigate, click, type, screenshot, etc.)
   * @param {Object} action.params - 操作参数
   * @returns {Promise<Object>} 操作结果
   */
  async executeBrowserAction(action) {
    if (!this.session) {
      throw new Error('没有活动的会话');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/sessions/${this.session.id}/browser/action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(action),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '浏览器操作失败');
      }

      return await response.json();
    } catch (error) {
      console.error('浏览器操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话状态
   * @returns {Promise<Object>} 会话状态
   */
  async getSessionStatus() {
    if (!this.session) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/sessions/${this.session.id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '获取会话状态失败');
      }

      return await response.json();
    } catch (error) {
      console.error('获取会话状态失败:', error);
      throw error;
    }
  }

  /**
   * 删除会话
   * @returns {Promise<boolean>} 是否成功
   */
  async deleteSession() {
    if (!this.session) {
      return true;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/sessions/${this.session.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '删除会话失败');
      }

      this.session = null;
      return true;
    } catch (error) {
      console.error('删除会话失败:', error);
      throw error;
    }
  }

  /**
   * 解析用户指令并执行相应操作
   * @param {string} command - 用户指令
   * @returns {Promise<Object>} 执行结果
   */
  async executeCommand(command) {
    const lowerCommand = command.toLowerCase();

    // 代码执行指令
    if (lowerCommand.includes('执行代码') || lowerCommand.includes('运行代码') || lowerCommand.includes('run code')) {
      const codeMatch = command.match(/```[\s\S]*?```|`[^`]+`/);
      if (codeMatch) {
        const code = codeMatch[0].replace(/```[\w]*\n?/g, '').replace(/`/g, '').trim();
        const language = command.includes('javascript') || command.includes('js') ? 'javascript' : 'python';
        
        const result = await this.executeCode(code, language);
        return {
          type: 'code_execution',
          result: result.result || result.output || '代码执行完成',
          error: result.error,
        };
      }
    }

    // 浏览器操作指令
    if (lowerCommand.includes('打开浏览器') || lowerCommand.includes('访问网站') || lowerCommand.includes('browser')) {
      const urlMatch = command.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        await this.initBrowser();
        const result = await this.executeBrowserAction({
          type: 'navigate',
          params: { url: urlMatch[0] },
        });
        return {
          type: 'browser_action',
          result: `已打开 ${urlMatch[0]}`,
          endpoint: await this.getBrowserEndpoint(),
        };
      }
    }

    // 创建会话指令
    if (lowerCommand.includes('创建会话') || lowerCommand.includes('新建会话')) {
      const imageType = lowerCommand.includes('浏览器') ? 'browser_latest' : 'code_latest';
      const result = await this.createSession({ imageId: imageType });
      return {
        type: 'session_created',
        result: `会话创建成功，ID: ${result.session.id}`,
        session: result.session,
      };
    }

    // 删除会话指令
    if (lowerCommand.includes('删除会话') || lowerCommand.includes('关闭会话')) {
      await this.deleteSession();
      return {
        type: 'session_deleted',
        result: '会话已删除',
      };
    }

    // 默认：返回帮助信息
    return {
      type: 'help',
      result: `我可以帮您执行以下操作：
1. 执行代码：发送 "执行代码 \`\`\`python\nprint('hello')\n\`\`\`"
2. 打开浏览器：发送 "访问网站 https://example.com"
3. 创建会话：发送 "创建会话"
4. 删除会话：发送 "删除会话"

注意：使用这些功能需要配置 AgentBay API Key。`,
    };
  }
}

// 导出单例实例
export const agentBayService = new AgentBayService();
export default AgentBayService;
