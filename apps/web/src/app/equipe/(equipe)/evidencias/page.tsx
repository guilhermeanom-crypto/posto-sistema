import { Camera, ImagePlus, MapPin } from 'lucide-react'

export const metadata = { title: 'Evidências coletadas' }

const EVIDS = [
  { id: 'ev-001', setor: 'SASC',     hora: '09:18', os: 'OS-2026-0184', nota: 'Bocal tanque 2, sem indício de vazamento.' },
  { id: 'ev-002', setor: 'SAO',      hora: '09:34', os: 'OS-2026-0184', nota: 'Caixa separadora antes da limpeza.' },
  { id: 'ev-003', setor: 'Resíduos', hora: '09:52', os: 'OS-2026-0184', nota: 'Abrigo de resíduos sem cobertura adequada.' },
  { id: 'ev-004', setor: 'Pista',    hora: '10:05', os: 'OS-2026-0184', nota: 'Manchas leves próximas à bomba 03.' },
  { id: 'ev-005', setor: 'Bombeiros',hora: '10:21', os: 'OS-2026-0184', nota: 'Extintor PQS-6 com lacre violado.' },
  { id: 'ev-006', setor: 'Tanques',  hora: '10:38', os: 'OS-2026-0184', nota: 'Respiro tanque 1 dentro do padrão.' },
]

export default function EvidenciasPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            OS-2026-0184 · Posto BR-153 km 312
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Evidências coletadas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fotos e arquivos vinculados a serviço, setor e achado. Geotag e horário gravados.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(234,88,12,0.18)]">
          <Camera className="h-3.5 w-3.5" /> Adicionar evidência
        </button>
      </div>

      <article className="rounded-xl border bg-card">
        <header className="flex items-center gap-2 border-b px-5 py-3">
          <ImagePlus className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Galeria do dia</h2>
          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
            {EVIDS.length} arquivos · 23 a validar
          </span>
        </header>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {EVIDS.map((e) => (
            <div key={e.id} className="rounded-lg border bg-white p-3 shadow-sm">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.45),transparent_55%)]" />
                <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  <Camera className="h-2.5 w-2.5" />
                  {e.id.toUpperCase()}
                </span>
                <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-foreground shadow-sm">
                  {e.setor}
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">{e.os}</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">{e.hora}</p>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{e.nota}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" /> -16.674, -49.265
              </p>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
