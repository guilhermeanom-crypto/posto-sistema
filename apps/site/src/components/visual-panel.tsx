import Image from 'next/image'
import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type VisualPanelProps = {
  image: string
  imageAlt: string
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
  className?: string
  imageClassName?: string
  priority?: boolean
}

export function VisualPanel({
  image,
  imageAlt,
  eyebrow,
  title,
  description,
  children,
  className,
  imageClassName,
  priority = false,
}: VisualPanelProps) {
  return (
    <article className={cn('trace-panel overflow-hidden', className)}>
      <div className={cn('relative h-64 overflow-hidden border-b border-border/70', imageClassName)}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,22,30,0.02),rgba(18,22,30,0.55))]" />
      </div>
      <div className="relative p-6 sm:p-7">
        {eyebrow ? <p className="eyebrow text-primary">{eyebrow}</p> : null}
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{title}</h3>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </article>
  )
}
