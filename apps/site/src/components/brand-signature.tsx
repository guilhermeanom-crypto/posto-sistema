import { cn } from '@/lib/cn'
import { HabilisWordmark } from './habilis-wordmark'

type BrandSignatureProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  compact?: boolean
  tagline?: string
}

const SIZE_MAP = {
  sm: {
    wordmark: '',
    tagline: 'text-[0.72rem]',
    gap: 'gap-2',
  },
  md: {
    wordmark: '',
    tagline: 'text-sm',
    gap: 'gap-3',
  },
  lg: {
    wordmark: '',
    tagline: 'text-base',
    gap: 'gap-4',
  },
} as const

export function BrandSignature({
  className,
  size = 'md',
  showTagline = false,
  compact = false,
  tagline = 'Consultoria ambiental, territorial e patrimonial com sistema próprio e leitura executiva para empreendimentos de perfis distintos.',
}: BrandSignatureProps) {
  const tone = SIZE_MAP[size]

  return (
    <div className={cn('inline-flex flex-col', tone.gap, className)}>
      <HabilisWordmark
        compact={compact}
        className={tone.wordmark}
      />

      {!compact ? (
        <span className="brand-signature-rule w-28" />
      ) : null}

      {showTagline ? (
        <span className={cn('block max-w-xl leading-relaxed text-muted-foreground', tone.tagline)}>
          {tagline}
        </span>
      ) : null}
    </div>
  )
}
