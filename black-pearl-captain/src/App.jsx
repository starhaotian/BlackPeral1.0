import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import { useAgentBayChat } from './hooks/useAgentBayChat'
import './index.css'

const generateId = () => Math.random().toString(36).substr(2, 9)

function App() {
  const [sessions, setSessions] = useState([
    { id: '1', title: '欢迎使用黑珍珠船长', timestamp: Date.now() },
  ])
  const [currentSessionId, setCurrentSessionId] = useState('1')
  const [messagesBySession, setMessagesBySession] = useState({
    '1': [
      { id: '1', role: 'ai', content: '你好！我是黑珍珠船长，你的AI助手。有什么我可以帮你的吗？', timestamp: Date.now() }
    ]
  })
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // AgentBay Chat Hook - 使用新的 Chat API
  const { sendMessage: sendChatMessage, isStreaming, isConfigured } = useAgentBayChat()

  const currentMessages = messagesBySession[currentSessionId] || []

  const createNewSession = useCallback(() => {
    const newSession = {
      id: generateId(),
      title: '新对话',
      timestamp: Date.now()
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setMessagesBySession(prev => ({
      ...prev,
      [newSession.id]: [
        { id: generateId(), role: 'ai', content: '你好！我是黑珍珠船长，你的AI助手。有什么我可以帮你的吗？', timestamp: Date.now() }
      ]
    }))
  }, [])

  const switchSession = useCallback((sessionId) => {
    setCurrentSessionId(sessionId)
  }, [])

  const deleteSession = useCallback((sessionId, e) => {
    e.stopPropagation()
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    setMessagesBySession(prev => {
      const newMessages = { ...prev }
      delete newMessages[sessionId]
      return newMessages
    })
    if (currentSessionId === sessionId && sessions.length > 1) {
      const remaining = sessions.filter(s => s.id !== sessionId)
      setCurrentSessionId(remaining[0]?.id || null)
    }
  }, [sessions, currentSessionId])

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isTyping) return

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now()
    }

    // 添加用户消息
    setMessagesBySession(prev => ({
      ...prev,
      [currentSessionId]: [...(prev[currentSessionId] || []), userMessage]
    }))

    // 更新会话标题
    const sessionMessages = messagesBySession[currentSessionId] || []
    if (sessionMessages.length === 1) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, title: inputText.trim().slice(0, 20) + (inputText.trim().length > 20 ? '...' : '') }
          : s
      ))
    }

    setInputText('')
    setIsTyping(true)

    // 创建 AI 消息占位
    const aiMessageId = generateId()
    setMessagesBySession(prev => ({
      ...prev,
      [currentSessionId]: [...(prev[currentSessionId] || []), {
        id: aiMessageId,
        role: 'ai',
        content: '',
        timestamp: Date.now()
      }]
    }))

    try {
      if (isConfigured) {
        // 使用 AgentBay Chat API
        await sendChatMessage(inputText.trim(), (delta, fullText) => {
          // 流式更新 AI 消息
          setMessagesBySession(prev => ({
            ...prev,
            [currentSessionId]: prev[currentSessionId].map(msg =>
              msg.id === aiMessageId
                ? { ...msg, content: fullText }
                : msg
            )
          }))
        })
      } else {
        // API 未配置，返回提示信息
        setMessagesBySession(prev => ({
          ...prev,
          [currentSessionId]: prev[currentSessionId].map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: '⚠️ AgentBay API Key 未配置。请在项目根目录创建 .env 文件并添加：\n\nVITE_AGENTBAY_API_KEY=your_api_key_here' }
              : msg
          )
        }))
      }
    } catch (error) {
      // 显示错误信息
      setMessagesBySession(prev => ({
        ...prev,
        [currentSessionId]: prev[currentSessionId].map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: `❌ 请求失败: ${error.message}` }
            : msg
        )
      }))
    } finally {
      setIsTyping(false)
    }
  }, [inputText, isTyping, currentSessionId, messagesBySession, sendChatMessage, isConfigured])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0f] overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewSession={createNewSession}
        onSwitchSession={switchSession}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <MainContent
        messages={currentMessages}
        inputText={inputText}
        setInputText={setInputText}
        onSendMessage={sendMessage}
        onKeyPress={handleKeyPress}
        isTyping={isTyping || isStreaming}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isAgentBayConfigured={isConfigured}
      />
    </div>
  )
}

export default App
