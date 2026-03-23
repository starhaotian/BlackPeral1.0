import { MenuIcon, AnchorIcon } from './Icons'
import ChatArea from './ChatArea'
import InputArea from './InputArea'

function MainContent({ 
  messages, 
  inputText, 
  setInputText, 
  onSendMessage, 
  onKeyPress,
  isTyping,
  sidebarOpen,
  onToggleSidebar,
  isAgentBayConfigured
}) {
  return (
    <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0f]">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#1e1e2e] bg-[#0a0a0f]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 rounded-lg hover:bg-[#1a1a25] transition-colors"
          >
            <MenuIcon className="w-5 h-5 text-[#94a3b8]" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center">
              <AnchorIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">黑珍珠船长</h2>
              <p className="text-[10px] text-[#64748b]">AI 助手</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAgentBayConfigured ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse"></span>
              <span className="text-xs text-[#8b5cf6]">AgentBay 已连接</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-[#64748b]">在线</span>
            </>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatArea messages={messages} isTyping={isTyping} />
      </div>

      {/* Input Area */}
      <InputArea 
        inputText={inputText}
        setInputText={setInputText}
        onSendMessage={onSendMessage}
        onKeyPress={onKeyPress}
        isTyping={isTyping}
      />
    </main>
  )
}

export default MainContent
