'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import {
  CONTEXT_SCENES,
  moodFallback,
  type ContextSceneKey,
  type ContextScene,
} from '@/lib/context-images'

interface ContextualSideImagesProps {
  scene: ContextSceneKey
  /** Posiciona absolute (default) ou fixed (para fundo de viewport). */
  position?: 'absolute' | 'fixed'
  /** Intensidade da imagem nas bordas. */
  intensity?: 'soft' | 'medium'
  className?: string
}

/**
 * Renderiza imagens contextuais discretas nas bordas esquerda e direita com
 * fade suave para o fundo. O efeito é ambiental: o conteúdo central nunca
 * pode ficar prejudicado. Se a imagem não estiver disponível, o fallback
 * gradiente (mood) cobre a borda sem quebrar a tela.
 */
export function ContextualSideImages({
  scene,
  position = 'absolute',
  intensity = 'soft',
  className,
}: ContextualSideImagesProps) {
  const config: ContextScene = CONTEXT_SCENES[scene]
  const fallback = moodFallback(config.mood)
  const opacity = intensity === 'soft' ? 0.72 : 0.88

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none inset-0 z-0 select-none overflow-hidden',
        position === 'fixed' ? 'fixed' : 'absolute',
        className,
      )}
    >
      <SideSlot src={config.left} side="left" opacity={opacity} fallback={fallback} />
      <SideSlot src={config.right} side="right" opacity={opacity} fallback={fallback} />
    </div>
  )
}

function SideSlot({
  src,
  side,
  opacity,
  fallback,
}: {
  src?: string
  side: 'left' | 'right'
  opacity: number
  fallback: string
}) {
  const [errored, setErrored] = useState(false)
  const showImage = Boolean(src) && !errored

  return (
    <div
      className={cn(
        'edge-image absolute top-0 hidden h-full w-[36vw] max-w-[540px] lg:block',
        side === 'left' ? 'left-0 edge-image-left' : 'right-0 edge-image-right',
      )}
      style={{ opacity }}
    >
      {showImage ? (
        <Image
          src={src!}
          alt=""
          fill
          sizes="(max-width: 1024px) 0px, 36vw"
          className="object-cover"
          onError={() => setErrored(true)}
          priority={false}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: fallback }} />
      )}
      {/* Scrim mínimo: deixa a foto viva. */}
      <div className="pointer-events-none absolute inset-0 bg-[rgba(255,251,243,0.08)]" />
    </div>
  )
}
