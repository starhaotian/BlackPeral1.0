# 黑珍珠船长 (Black Pearl Captain)

一个优雅的 AI 对话界面，基于阿里云 [无影 AgentBay](https://www.aliyun.com/product/wuying/agentbay) 打造，支持实时流式对话。

![Black Pearl Captain](https://img.shields.io/badge/Black%20Pearl%20Captain-AI%20Chat-purple)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-646CFF)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC)

## 功能特性

- **实时 AI 对话** — 基于 SSE 流式传输，打字机效果逐字呈现
- **会话管理** — 创建、切换、删除多轮对话
- **科技感界面** — 黑紫配色 + 玻璃态效果 + 渐变光晕动画
- **响应式布局** — 桌面端 / 移动端自适应

## 前置要求

| 工具 | 版本 |
|------|------|
| **Node.js** | >= 18 |
| **Python** | >= 3.8 |
| **npm** | >= 9 |

你还需要一对阿里云 AccessKey（用于调用 AgentBay API）：
> 获取方式：[阿里云 RAM 控制台 → AccessKey 管理](https://ram.console.aliyun.com/manage/ak)

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/starhaotian/BlackPeral1.0.git
cd BlackPeral1.0/black-pearl-captain
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的阿里云 AccessKey：

```env
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
```

### 3. 安装前端依赖

```bash
npm install
```

### 4. 安装后端依赖

```bash
cd server
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 5. 启动服务

需要开 **两个终端**，分别启动后端和前端：

**终端 1 — 启动后端代理服务（端口 3001）：**

```bash
cd server
source venv/bin/activate   # Windows: venv\Scripts\activate
python app.py
```

**终端 2 — 启动前端开发服务器（端口 5173）：**

```bash
npm run dev
```

### 6. 打开浏览器

访问 **http://localhost:5173** 即可开始对话 🎉

## 架构说明

```
浏览器 (React)          Vite 代理             Flask 后端             阿里云 API
  ┌──────────┐       ┌──────────┐        ┌──────────┐        ┌──────────────┐
  │ localhost │──/api──▶ localhost │───────▶│ localhost │──签名──▶│ AgentBay     │
  │   :5173   │◀─SSE──│   :5173   │◀──SSE──│   :3001   │◀─SSE──│ wuyingai.cn  │
  └──────────┘       └──────────┘        └──────────┘        └──────────────┘
```

- **前端** 发送请求到 `/api/*`，由 Vite 开发代理转发到后端
- **后端** 使用 POP V1 签名获取 ChatToken，然后调用 AgentBay Chat API
- **SSE 流** 从阿里云 → 后端 → 前端，实现实时流式对话

## 项目结构

```
black-pearl-captain/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # 侧边栏 — 会话列表
│   │   ├── MainContent.jsx      # 主内容区容器
│   │   ├── ChatArea.jsx         # 聊天区域 — 消息展示
│   │   ├── MessageBubble.jsx    # 消息气泡（支持 Markdown）
│   │   ├── InputArea.jsx        # 输入框
│   │   ├── TypingIndicator.jsx  # 打字中动画
│   │   └── Icons.jsx            # SVG 图标组件
│   ├── hooks/
│   │   └── useAgentBayChat.js   # Chat Hook — 管理流式状态
│   ├── services/
│   │   └── agentbayChat.js      # Chat Service — SSE 解析与去重
│   ├── App.jsx                  # 应用主组件
│   ├── index.css                # 全局样式 + Tailwind
│   └── main.jsx                 # 入口文件
├── server/
│   ├── app.py                   # Flask 后端 — POP V1 签名代理
│   └── requirements.txt         # Python 依赖
├── .env.example                 # 环境变量模板
├── package.json                 # 前端依赖 & 脚本
├── vite.config.js               # Vite 配置（含 API 代理）
└── tailwind.config.js           # Tailwind 配置
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器（热更新） |
| `npm run build` | 构建生产版本到 `dist/` |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 代码检查 |
| `python server/app.py` | 启动后端代理服务 |

## 常见问题

**Q: 后端启动报 `AK/SK 未配置`？**
A: 确认 `.env` 文件在 `black-pearl-captain/` 目录下，且 `ALIBABA_CLOUD_ACCESS_KEY_ID` 和 `ALIBABA_CLOUD_ACCESS_KEY_SECRET` 已正确填写。

**Q: 前端请求 `/api/chat` 返回 502？**
A: 确认后端已在端口 3001 启动。Vite 开发代理会将 `/api` 请求转发到 `localhost:3001`。

**Q: 对话没有响应或超时？**
A: 检查后端终端日志，确认 ChatToken 获取成功。如果出现签名错误，请核实 AccessKey 是否有 AgentBay 服务的访问权限。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS 3 |
| 后端 | Python Flask |
| AI 服务 | 阿里云无影 AgentBay |
| 通信协议 | SSE (Server-Sent Events) |

## 许可证

MIT License
