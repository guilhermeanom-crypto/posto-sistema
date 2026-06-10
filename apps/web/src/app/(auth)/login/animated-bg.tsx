'use client'

export function AnimatedLoginBg() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#f4f6f9]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_68%,rgba(234,88,12,0.13),transparent_32%),radial-gradient(circle_at_76%_24%,rgba(21,128,61,0.10),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.65),rgba(244,246,249,0.95))]" />
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(#d9dee7_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute left-[8%] top-[20%] h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute bottom-[12%] right-[10%] h-64 w-64 rounded-full bg-green-600/10 blur-3xl" />
    </div>
  )
}
