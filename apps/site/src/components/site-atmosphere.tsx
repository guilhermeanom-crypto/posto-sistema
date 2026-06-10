import { ContextualSideImages } from './contextual-side-images'
import type { ContextSceneKey } from '@/lib/context-images'

interface SiteAtmosphereProps {
  /** Quando informado, renderiza imagens contextuais nas bordas do viewport
   *  (fixed) com fade suave. Se a imagem não existir, o fallback gradiente
   *  cobre a borda sem quebrar a tela. */
  scene?: ContextSceneKey
}

export function SiteAtmosphere({ scene }: SiteAtmosphereProps = {}) {
  return (
    <div aria-hidden className="site-atmosphere">
      <div className="site-atmosphere-noise" />
      <div className="site-atmosphere-glow site-atmosphere-glow-top" />
      <div className="site-atmosphere-glow site-atmosphere-glow-bottom" />
      {scene ? <ContextualSideImages scene={scene} position="fixed" intensity="soft" /> : null}
    </div>
  )
}
