'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, MapPin, X } from 'lucide-react'
import { adicionarEvidenciaAction } from './actions'

interface OsOption {
  id: string
  numero: string
}

const SETORES = ['SASC', 'SAO', 'Resíduos', 'Pista', 'Bombeiros', 'Tanques', 'Outro']

export function AdicionarEvidencia({ osOptions }: { osOptions: OsOption[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function capturarLocal() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Não foi possível obter a localização.'),
    )
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    if (geo) {
      fd.set('latitude', String(geo.lat))
      fd.set('longitude', String(geo.lng))
    }
    startTransition(async () => {
      const res = await adicionarEvidenciaAction(fd)
      if (res?.error) {
        setError(res.error)
        return
      }
      formRef.current?.reset()
      setGeo(null)
      setAberto(false)
      router.refresh()
    })
  }

  if (osOptions.length === 0) {
    return (
      <span className="text-[11px] text-muted-foreground">Sem OS atribuída para registrar evidência.</span>
    )
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(234,88,12,0.18)]"
      >
        <Camera className="h-3.5 w-3.5" /> Adicionar evidência
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="w-full rounded-xl border bg-card p-4 space-y-3 sm:max-w-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Nova evidência</h3>
        <button type="button" onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {error ? <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div> : null}

      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ordem de serviço</label>
        <select name="ordemServicoId" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
          {osOptions.map((os) => (
            <option key={os.id} value={os.id}>{os.numero}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Setor</label>
        <select name="setor" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
          {SETORES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nota / achado</label>
        <textarea name="nota" required rows={2} placeholder="Descreva o que foi observado..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Foto (opcional)</label>
        <input name="foto" type="file" accept="image/*" capture="environment"
          className="w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs" />
      </div>

      <button type="button" onClick={capturarLocal}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80">
        <MapPin className="h-3 w-3" /> {geo ? `Local capturado (${geo.lat.toFixed(3)}, ${geo.lng.toFixed(3)})` : 'Capturar localização'}
      </button>

      <button type="submit" disabled={pending}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-semibold disabled:opacity-60">
        <Camera className="h-3.5 w-3.5" /> {pending ? 'Registrando...' : 'Registrar evidência'}
      </button>
    </form>
  )
}
