import { PlusIcon, MessageSquareIcon, TrashIcon, MenuIcon, XIcon, AnchorIcon } from './Icons'

function Sidebar({ 
  sessions, 
  currentSessionId, 
  onNewSession, 
  onSwitchSession, 
  onDeleteSession,
  isOpen,
  onToggle
}) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1a1a25] border border-[#2d2d3d] lg:hidden ${
          isOpen ? 'hidden' : 'block'
        }`}
      >
        <MenuIcon className="w-5 h-5 text-[#94a3b8]" />
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[260px] bg-[#0f0f14] border-r border-[#1e1e2e] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-4 border-b border-[#1e1e2e]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                <AnchorIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-white truncate">黑珍珠船长</h1>
                <p className="text-xs text-[#64748b]">Black Pearl Captain</p>
              </div>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-[#1e1e2e] lg:hidden"
              >
                <XIcon className="w-4 h-4 text-[#94a3b8]" />
              </button>
            </div>
            
            <button
              onClick={onNewSession}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white text-sm font-medium flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-shadow"
            >
              <PlusIcon className="w-4 h-4" />
              <span>新对话</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-xs font-medium text-[#64748b] mb-2 px-2">
              历史会话
            </div>
            
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSwitchSession(session.id)}
                  className={`group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                    currentSessionId === session.id 
                      ? 'bg-[#8b5cf6]/15 border-l-2 border-[#8b5cf6]' 
                      : 'hover:bg-[#1a1a25]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    currentSessionId === session.id 
                      ? 'bg-[#8b5cf6]/20' 
                      : 'bg-[#1e1e2e]'
                  }`}>
                    <MessageSquareIcon className={`w-3.5 h-3.5 ${
                      currentSessionId === session.id 
                        ? 'text-[#8b5cf6]' 
                        : 'text-[#64748b]'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${
                      currentSessionId === session.id 
                        ? 'text-white' 
                        : 'text-[#94a3b8]'
                    }`}>
                      {session.title}
                    </p>
                    <p className="text-[11px] text-[#64748b]">
                      {formatTime(session.timestamp)}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/20 transition-all"
                  >
                    <TrashIcon className="w-3.5 h-3.5 text-[#64748b] hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* User Profile */}
          <div className="p-3 border-t border-[#1e1e2e]">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1a1a25]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center">
                <span className="text-white text-xs font-bold">用</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">用户</p>
                <p className="text-xs text-[#64748b] truncate">user@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  )
}

export default Sidebar
