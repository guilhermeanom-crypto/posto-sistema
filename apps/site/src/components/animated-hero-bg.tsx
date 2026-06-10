'use client'

import { useEffect, useRef } from 'react'

/**
 * Canvas animado do hero — espelhado do login do apps/web.
 * Ribbons laranja + verde + partículas conectadas, sobre fundo claro.
 */
export function AnimatedHeroBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let W = 0,
      H = 0
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      W = parent.offsetWidth
      H = parent.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener('resize', resize)

    const NA = 22
    const SPREAD_A = 140
    const NB = 14
    const SPREAD_B = 80

    const briA = (i: number) => Math.pow(Math.sin((i / (NA - 1)) * Math.PI), 1.5)
    const briB = (i: number) => Math.pow(Math.sin((i / (NB - 1)) * Math.PI), 1.5)

    const syA = (i: number, x: number, time: number) => {
      const norm = i / (NA - 1)
      const cy =
        H * 0.62 +
        95 * Math.sin((x / W) * Math.PI * 1.8 + time * 0.26) +
        38 * Math.cos((x / W) * Math.PI * 3.4 + time * 0.14 + 0.9)
      const offset = (norm - 0.5) * SPREAD_A
      const twist = 46 * Math.sin((x / 500) * Math.PI * 2 + time * 0.36 + norm * Math.PI * 2.8)
      return cy + offset + twist
    }

    const syB = (i: number, x: number, time: number) => {
      const norm = i / (NB - 1)
      const cy =
        H * 0.32 +
        44 * Math.sin((x / W) * Math.PI * 2.2 + time * 0.30 + 1.6) +
        18 * Math.cos((x / W) * Math.PI * 4.2 + time * 0.18)
      const offset = (norm - 0.5) * SPREAD_B
      const twist = 24 * Math.sin((x / 400) * Math.PI * 2 + time * 0.42 + norm * Math.PI * 2.2)
      return cy + offset + twist
    }

    interface P { x: number; y: number; r: number; op: number; vx: number; vy: number; g: 'a' | 'b' }
    const pts: P[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      r: Math.random() * 1.4 + 0.4,
      op: Math.random() * 0.5 + 0.18,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      g: Math.random() > 0.45 ? 'a' : 'b',
    }))

    const X_STEP = 38
    let t = 0

    const drawRibbon = (
      n: number,
      bri: (i: number) => number,
      sy: (i: number, x: number, time: number) => number,
      r: number,
      g: number,
      b: number,
      baseAlpha: number,
    ) => {
      for (let i = 0; i < n; i++) {
        const br = bri(i)
        const alpha = baseAlpha * (0.14 + br * 0.86)
        const lw = 0.4 + br * 2.2

        ctx.beginPath()
        for (let x = 0; x <= W; x += 2) {
          const y = sy(i, x, t)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }

        ctx.save()
        ctx.shadowColor = `rgba(${r},${g},${b},0.85)`
        ctx.shadowBlur = br > 0.7 ? 20 : 8
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.45})`
        ctx.lineWidth = lw * 4
        ctx.stroke()
        ctx.restore()

        ctx.save()
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.lineWidth = lw
        ctx.stroke()
        ctx.restore()
      }

      for (let x = X_STEP; x < W; x += X_STEP) {
        const ys = Array.from({ length: n }, (_, i) => sy(i, x, t))
        ctx.beginPath()
        ys.forEach((y, i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
        ctx.strokeStyle = `rgba(${r},${g},${b},0.20)`
        ctx.lineWidth = 0.7
        ctx.stroke()
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#f4f6f9'
      ctx.fillRect(0, 0, W, H)

      t += 0.006

      const ga = ctx.createRadialGradient(W * 0.25, H * 0.65, 0, W * 0.25, H * 0.65, W * 0.45)
      ga.addColorStop(0, 'rgba(234,88,12,0.09)')
      ga.addColorStop(1, 'rgba(234,88,12,0)')
      ctx.fillStyle = ga
      ctx.fillRect(0, 0, W, H)

      const gb = ctx.createRadialGradient(W * 0.65, H * 0.30, 0, W * 0.65, H * 0.30, W * 0.38)
      gb.addColorStop(0, 'rgba(21,128,61,0.07)')
      gb.addColorStop(1, 'rgba(21,128,61,0)')
      ctx.fillStyle = gb
      ctx.fillRect(0, 0, W, H)

      drawRibbon(NB, briB, syB, 21, 128, 61, 0.72)
      drawRibbon(NA, briA, syA, 234, 88, 12, 0.82)

      for (const p of pts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        const [r, g, b] = p.g === 'a' ? ([234, 88, 12] as const) : ([21, 128, 61] as const)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${p.op * 0.14})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${p.op})`
        ctx.fill()
      }

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]!
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j]!
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 100) {
            const [r, g, b] = p.g === 'a' ? ([234, 88, 12] as const) : ([21, 128, 61] as const)
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / 100) * 0.14})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9)
      vg.addColorStop(0, 'rgba(244,246,249,0)')
      vg.addColorStop(1, 'rgba(226,230,238,0.50)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, display: 'block' }}
    />
  )
}
