import Image from 'next/image'
import { cn } from '@/lib/utils'

export function HabilisWordmark({
  className,
  subtitle,
  compact = false,
}: {
  className?: string
  subtitle?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex shrink-0',
        compact ? 'items-center gap-3' : 'flex-col items-center gap-2',
        className,
      )}
    >
      <Image
        src="/logo-habilis.svg"
        alt="Hábilis Consultoria"
        width={134}
        height={129}
        className={cn('w-auto object-contain', compact ? 'h-9' : 'h-14 sm:h-16')}
      />
      {subtitle ? (
        <span className="rounded-full border border-border bg-white/82 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground whitespace-nowrap">
          {subtitle}
        </span>
      ) : null}
    </div>
  )
}
