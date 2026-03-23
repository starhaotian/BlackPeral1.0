import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import './index.css'

const generateId = () => Math.random().toString(36).substr(2, 9)

const mockResponses = [
  "我是黑珍珠船长，你的AI助手。我可以帮助你解答问题、创作内容、编写代码，或者只是聊聊天。",
  "这是一个很有趣的问题！让我为你详细分析一下...",
  "我理解你的需求。根据我的分析，这里有几个建议供你参考：",
  "作为黑珍珠船长，我在茫茫数据海洋中为你寻找答案。",
  "你的问题很有深度！这涉及到多个层面的考量...",
]

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

    setMessagesBySession(prev => ({
      ...prev,
      [currentSessionId]: [...(prev[currentSessionId] || []), userMessage]
    }))

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

    setTimeout(() => {
      const aiMessage = {
        id: generateId(),
        role: 'ai',
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        timestamp: Date.now()
      }
      setMessagesBySession(prev => ({
        ...prev,
        [currentSessionId]: [...(prev[currentSessionId] || []), aiMessage]
      }))
      setIsTyping(false)
    }, 1200)
  }, [inputText, isTyping, currentSessionId, messagesBySession])

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
        isTyping={isTyping}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  )
}

export default App
