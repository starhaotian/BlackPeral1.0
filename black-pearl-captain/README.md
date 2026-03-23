# 黑珍珠船长 (Black Pearl Captain)

一个优雅、具有科技感的 AI 对话界面，采用黑色和紫色主题设计。

![黑珍珠船长](https://img.shields.io/badge/Black%20Pearl%20Captain-AI%20Chat-purple)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC)

## 功能特性

- **历史会话管理**：创建、切换、删除对话记录
- **实时 AI 对话**：流畅的聊天交互体验
- **优雅界面设计**：
  - 黑色 + 紫色科技主题
  - 玻璃态效果 (Glassmorphism)
  - 紫色渐变光晕
  - 流畅的动画过渡
- **响应式布局**：支持桌面端和移动端
- **消息操作**：复制消息内容

## 技术栈

- **前端框架**：React 18
- **构建工具**：Vite
- **样式框架**：Tailwind CSS 3
- **图标库**：Lucide React

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
black-pearl-captain/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # 侧边栏组件
│   │   ├── MainContent.jsx      # 主内容区组件
│   │   ├── ChatArea.jsx         # 聊天区域组件
│   │   ├── MessageBubble.jsx    # 消息气泡组件
│   │   ├── InputArea.jsx        # 输入框组件
│   │   └── TypingIndicator.jsx  # 输入中指示器
│   ├── App.jsx                  # 应用主组件
│   ├── index.css                # 全局样式
│   └── main.jsx                 # 入口文件
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 界面预览

### 配色方案

| 颜色 | 色值 | 用途 |
|------|------|------|
| 主背景 | `#0a0a0f` | 页面背景 |
| 次背景 | `#12121a` | 卡片/面板 |
| 紫色主色 | `#8b5cf6` | 按钮、强调 |
| 紫色次色 | `#a78bfa` | 渐变、悬停 |
| 紫色强调 | `#c084fc` | 光晕效果 |
| 文字主色 | `#ffffff` | 主要文字 |
| 文字次色 | `#94a3b8` | 次要文字 |

### 核心功能

1. **会话管理**
   - 点击"新对话"创建会话
   - 点击历史会话切换
   - 悬停显示删除按钮

2. **消息交互**
   - 输入消息按 Enter 发送
   - 支持多行文本（Shift+Enter 换行）
   - 悬停消息显示复制按钮

3. **响应式设计**
   - 桌面端：显示完整侧边栏
   - 移动端：侧边栏可折叠

## 开发计划

- [ ] 接入真实 AI API
- [ ] 消息持久化存储
- [ ] 代码高亮显示
- [ ] 文件上传功能
- [ ] 主题切换

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

Made with by 黑珍珠船长团队
