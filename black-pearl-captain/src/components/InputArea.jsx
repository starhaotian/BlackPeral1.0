import { useRef, useEffect } from 'react'
import { SendIcon, PaperclipIcon, MicIcon } from './Icons'

function InputArea({ 
  inputText, 
  setInputText, 
  onSendMessage, 
  onKeyPress,
  isTyping 
}) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputText])

  return (
    <div className="p-3 border-t border-[#1e1e2e] bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 p-2 rounded-xl bg-[#12121a] border border-[#2d2d3d] focus-within:border-[#8b5cf6]/50 transition-colors">
          <button 
            className="p-2 rounded-lg hover:bg-[#1a1a25] text-[#64748b] transition-colors"
            title="上传文件"
          >
            <PaperclipIcon className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder={isTyping ? "黑珍珠船长正在思考..." : "输入消息，按 Enter 发送..."}
            disabled={isTyping}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-[#64748b] resize-none py-2.5 outline-none text-sm leading-relaxed disabled:opacity-50"
            style={{ minHeight: '20px', maxHeight: '120px' }}
          />

          <button 
            className="p-2 rounded-lg hover:bg-[#1a1a25] text-[#64748b] transition-colors"
            title="语音输入"
          >
            <MicIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={onSendMessage}
            disabled={!inputText.trim() || isTyping}
            className={`p-2.5 rounded-lg transition-all ${
              inputText.trim() && !isTyping
                ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                : 'bg-[#1a1a25] text-[#64748b] cursor-not-allowed'
            }`}
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-center text-[10px] text-[#64748b] mt-2">
          黑珍珠船长可能会产生不准确的信息，请核实重要信息
        </p>
      </div>
    </div>
  )
}

export default InputArea
