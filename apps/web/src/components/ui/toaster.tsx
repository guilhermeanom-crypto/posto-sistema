'use client'

import { useEffect, useState } from 'react'
import { subscribeToast } from '@/hooks/use-toast'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from './toast'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
  open: boolean
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToast((opts) => {
      setToasts((prev) => [...prev, { ...opts, open: true }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== opts.id))
      }, 4000)
    })
    return () => { unsubscribe() }
  }, [])

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast key={id} open={open} variant={variant}>
          <div className="flex-1 min-w-0">
            <ToastTitle>{title}</ToastTitle>
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
