import { useEffect, useRef } from 'react'
import { UserIcon, AnchorIcon } from './Icons'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

function ChatArea({ messages, isTyping }) {
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto p-4 space-y-4"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(139,92,246,0.4)]">
            <AnchorIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">欢迎 aboard 黑珍珠号</h2>
          <p className="text-sm text-[#94a3b8] max-w-sm mb-6">
            我是你的AI船长，随时准备为你导航知识的海洋
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 max-w-md">
            {['帮我写代码', '解释量子计算', '创作诗歌', '创业建议'].map((suggestion, index) => (
              <button
                key={index}
                className="px-3 py-1.5 rounded-lg bg-[#1a1a25] border border-[#2d2d3d] text-xs text-[#94a3b8] hover:border-[#8b5cf6]/50 hover:text-white transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div 
              key={message.id}
              className={`flex gap-3 animate-fade-in ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-[#8b5cf6]/20' 
                  : 'bg-gradient-to-br from-[#8b5cf6] to-[#c084fc]'
              }`}>
                {message.role === 'user' ? (
                  <UserIcon className="w-4 h-4 text-[#8b5cf6]" />
                ) : (
                  <AnchorIcon className="w-4 h-4 text-white" />
                )}
              </div>

              <div className={`flex flex-col max-w-[75%] ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${
                    message.role === 'user' ? 'text-[#8b5cf6]' : 'text-[#a78bfa]'
                  }`}>
                    {message.role === 'user' ? '你' : '黑珍珠船长'}
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    {formatTime(message.timestamp)}
                  </span>
                </div>

                <MessageBubble content={message.content} role={message.role} />
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center">
                <AnchorIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#a78bfa]">黑珍珠船长</span>
                  <span className="text-[10px] text-[#64748b]">正在输入...</span>
                </div>
                <TypingIndicator />
              </div>
            </div>
          )}
        </>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}

export default ChatArea
