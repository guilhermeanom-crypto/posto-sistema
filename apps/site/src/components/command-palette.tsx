'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Lock } from 'lucide-react'
import {
  NAV,
  SITE_PUBLICO_URL,
  SISTEMA_CAMPO_URL,
  SISTEMA_EQUIPE_URL,
  SISTEMA_PORTAL_URL,
  SISTEMA_URL,
} from '@/lib/content'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const items = useMemo(() => {
    const all = [
      ...NAV.map((n) => ({ label: n.label, href: n.href, kind: 'page' as const })),
      { label: 'Site Público · Hábilis', href: SITE_PUBLICO_URL, kind: 'page' as const },
      { label: 'Área de Campo · Equipe Hábilis', href: SISTEMA_CAMPO_URL, kind: 'cta' as const },
      { label: 'Sistema Interno · Hábilis', href: SISTEMA_EQUIPE_URL, kind: 'cta' as const },
      { label: 'Portal do Cliente · Sistema Hábilis', href: SISTEMA_PORTAL_URL, kind: 'cta' as const },
      { label: 'Sistema Hábilis · Entradas', href: SISTEMA_URL, kind: 'page' as const },
    ]
    if (!query) return all
    const q = query.toLowerCase()
    return all.filter((i) => i.label.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelected(0)
  }, [query])

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[selected]
      if (item) {
        router.push(item.href)
        setOpen(false)
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-input bg-background/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        aria-label="Abrir busca"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar páginas</span>
        <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-[12vh] w-full max-w-lg overflow-hidden rounded-xl border bg-card shadow-2xl animate-panel-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Buscar páginas, serviços, contato..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>

            <ul className="max-h-80 overflow-y-auto p-2">
              {items.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nada encontrado.</li>
              ) : (
                items.map((item, i) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setSelected(i)}
                      className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors ${
                        selected === i ? 'bg-primary/10 text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {item.kind === 'cta' ? (
                          <Lock className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <span
                            className={`h-1.5 w-1.5 flex-none rounded-full ${
                              selected === i ? 'bg-primary' : 'bg-border'
                            }`}
                          />
                        )}
                        <span className="font-medium">{item.label}</span>
                      </span>
                      <ArrowRight
                        className={`h-3.5 w-3.5 transition-opacity ${
                          selected === i ? 'opacity-100 text-primary' : 'opacity-0'
                        }`}
                      />
                    </Link>
                  </li>
                ))
              )}
            </ul>

            <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
              <span>
                <kbd className="rounded bg-card px-1 py-0.5 font-mono">↑↓</kbd> navegar
              </span>
              <span>
                <kbd className="rounded bg-card px-1 py-0.5 font-mono">↵</kbd> abrir
              </span>
              <span>
                <kbd className="rounded bg-card px-1 py-0.5 font-mono">esc</kbd> fechar
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
