'use client'

// Store global simples baseado em event emitter para evitar prop drilling
type Variant = 'default' | 'success' | 'destructive'

interface ToastOptions {
  title: string
  description?: string
  variant?: Variant
}

type Listener = (opts: ToastOptions & { id: string }) => void

const listeners: Set<Listener> = new Set()

export function toast(opts: ToastOptions) {
  const id = Math.random().toString(36).slice(2)
  listeners.forEach((fn) => fn({ ...opts, id }))
}

export function subscribeToast(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
