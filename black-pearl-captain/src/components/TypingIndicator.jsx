function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#1a1a25] border border-[#2d2d3d]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-typing" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-typing" style={{ animationDelay: '0.15s' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-typing" style={{ animationDelay: '0.3s' }} />
    </div>
  )
}

export default TypingIndicator
