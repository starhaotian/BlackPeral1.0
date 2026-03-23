import { useState } from 'react'
import { CopyIcon, CheckIcon } from './Icons'

function MessageBubble({ content, role }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div 
      className={`relative group rounded-xl px-4 py-2.5 max-w-full ${
        role === 'user' 
          ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/30' 
          : 'bg-[#1a1a25] border border-[#2d2d3d]'
      }`}
    >
      <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
        {content}
      </p>

      <button
        onClick={handleCopy}
        className={`absolute -top-2 ${
          role === 'user' ? '-left-8' : '-right-8'
        } p-1.5 rounded-md bg-[#1a1a25] border border-[#2d2d3d] opacity-0 group-hover:opacity-100 transition-opacity`}
        title="复制"
      >
        {copied ? (
          <CheckIcon className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <CopyIcon className="w-3.5 h-3.5 text-[#64748b]" />
        )}
      </button>
    </div>
  )
}

export default MessageBubble
