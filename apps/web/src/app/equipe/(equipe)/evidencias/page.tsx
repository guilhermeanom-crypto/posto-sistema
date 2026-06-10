import { Camera, ImagePlus, MapPin } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/date'

export const metadata = { title: 'Evidências coletadas' }

type StatusValidacao = 'PENDENTE' | 'VALIDADA' | 'REJEITADA'

interface Evidencia {
  id: string
  setor: string
  nota: string
  chaveS3: string | null
  capturadoEm: string
  statusValidacao: StatusValidacao
  // Prisma Decimal é serializado como string no JSON — tratar como string|number
  latitude: number | string | null
  longitude: number | string | null
  ordemServico?: { numero: string } | null
}

const VAL_LABEL: Record<StatusValidacao, string> = { PENDENTE: 'A validar', VALIDADA: 'Validada', REJEITADA: 'Rejeitada' }
const VAL_TONE: Record<StatusValidacao, string> = {
  PENDENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  VALIDADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJEITADA: 'bg-red-50 text-red-700 border-red-200',
}

export default async function EvidenciasPage() {
  const token = await getAccessToken()
  let itens: Evidencia[] = []
  let erro: string | null = null

  if (token) {
    try {
      const res = await api.get<{ data: Evidencia[] }>('/evidencias?limit=60', token)
      itens = res.data
    } catch {
      erro = 'Não foi possível carregar as evidências no momento.'
    }
  }

  const aValidar = itens.filter((e) => e.statusValidacao === 'PENDENTE').length

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Operação de campo</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Evidências coletadas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fotos e arquivos vinculados a serviço, setor e achado. Geotag e horário gravados.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(234,88,12,0.18)]">
          <Camera className="h-3.5 w-3.5" /> Adicionar evidência
        </button>
      </div>

      {erro ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</div>
      ) : null}

      <article className="rounded-xl border bg-card">
        <header className="flex items-center gap-2 border-b px-5 py-3">
          <ImagePlus className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Galeria</h2>
          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
            {itens.length} registro{itens.length === 1 ? '' : 's'} · {aValidar} a validar
          </span>
        </header>
        {itens.length === 0 && !erro ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhuma evidência registrada.</p>
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {itens.map((e) => (
              <div key={e.id} className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md border bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.45),transparent_55%)]" />
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    <Camera className="h-2.5 w-2.5" />
                    {e.chaveS3 ? 'foto' : 'sem foto'}
                  </span>
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-foreground shadow-sm">
                    {e.setor}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">{e.ordemServico?.numero ?? '—'}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${VAL_TONE[e.statusValidacao]}`}>
                    {VAL_LABEL[e.statusValidacao]}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{e.nota}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  {e.latitude != null && e.longitude != null ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" /> {Number(e.latitude).toFixed(3)}, {Number(e.longitude).toFixed(3)}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="tabular-nums">{formatDate(e.capturadoEm)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
