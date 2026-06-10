import { cn } from '@/lib/cn'

type HabilisTraceProps = {
  className?: string
  mirrored?: boolean
}

export function HabilisTrace({ className, mirrored = false }: HabilisTraceProps) {
  return (
    <svg
      viewBox="0 0 420 140"
      fill="none"
      aria-hidden
      className={cn('pointer-events-none', mirrored && '-scale-x-100', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 102C74 62 139 48 212 61C282 74 334 61 406 18"
        stroke="rgba(243,146,0,0.55)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M28 126C96 82 168 74 239 86C300 97 346 88 392 58"
        stroke="rgba(0,158,60,0.42)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M94 14C127 40 144 68 148 124"
        stroke="rgba(243,146,0,0.24)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2 9"
      />
      <path
        d="M236 18C260 38 277 66 286 118"
        stroke="rgba(0,158,60,0.2)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2 10"
      />
      <circle cx="144" cy="59" r="5" fill="rgba(243,146,0,0.88)" />
      <circle cx="272" cy="83" r="4" fill="rgba(0,158,60,0.82)" />
      <circle cx="330" cy="55" r="2.5" fill="rgba(243,146,0,0.7)" />
    </svg>
  )
}
