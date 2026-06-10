import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import Link from 'next/link'
import { RecursoForm } from './recurso-form'
import { DefesaPanel } from './defesa-panel'
import { StatusSelect } from './status-select'
import { RecursoResultForm } from './recurso-result-form'

export const metadata: Metadata = { title: 'Detalhe do Auto de Infração' }

interface RecursoAdministrativo {
  id: string
  instancia: string
  dataProtocolo: string
  prazoResposta: string | null
  numeroProtocolo: string | null
  resultado: string | null
  dataJulgamento: string | null
  observacoes: string | null
  criadoEm: string
}

interface AutoInfracao {
  id: string
  orgao: string
  numeroAuto: string
  dataLavratura: string
  dataRecebimento: string | null
  artigo: string | null
  descricao: string
  valorMulta: number | null
  prazoDefesa: string
  status: string
  observacoes: string | null
  empreendimento: { id: string; nome: string; cidade: string; estado: string }
  recursos: RecursoAdministrativo[]
}

interface DefesaTecnica {
  id: string
  rascunhoIA: string
  revisaoHumana: string | null
  status: string
  geradoEm: string
}

const statusColor: Record<string, string> = {
  RECEBIDO: 'bg-blue-100 text-blue-800',
  EM_DEFESA: 'bg-yellow-100 text-yellow-800',
  AGUARDANDO_JULGAMENTO: 'bg-orange-100 text-orange-800',
  JULGADO_FAVORAVEL: 'bg-green-100 text-green-800',
  JULGADO_DESFAVORAVEL: 'bg-red-100 text-red-800',
  EM_RECURSO: 'bg-purple-100 text-purple-800',
  ENCERRADO: 'bg-gray-100 text-gray-800',
  PAGO: 'bg-gray-100 text-gray-600',
}

const statusLabel: Record<string, string> = {
  RECEBIDO: 'Recebido',
  EM_DEFESA: 'Em Defesa',
  AGUARDANDO_JULGAMENTO: 'Ag. Julgamento',
  JULGADO_FAVORAVEL: 'Julgado Favorável',
  JULGADO_DESFAVORAVEL: 'Julgado Desfavorável',
  EM_RECURSO: 'Em Recurso',
  ENCERRADO: 'Encerrado',
  PAGO: 'Pago',
}

const instanciaLabel: Record<string, string> = {
  PRIMEIRA: '1ª Instância',
  SEGUNDA: '2ª Instância',
  TERCEIRA: '3ª Instância',
  JUDICIAL: 'Judicial',
}

const resultadoColor: Record<string, string> = {
  PENDENTE: 'bg-gray-100 text-gray-700',
  FAVORAVEL: 'bg-green-100 text-green-800',
  DESFAVORAVEL: 'bg-red-100 text-red-800',
  PARCIALMENTE_FAVORAVEL: 'bg-yellow-100 text-yellow-800',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatarValor(v: number | string | null | undefined) {
  const n = v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function FiscalizacaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return notFound()

  let auto: AutoInfracao
  let defesas: DefesaTecnica[] = []
  try {
    auto = await api.get<AutoInfracao>(`/fiscalizacoes/${id}`, token)
    const defesasRes = await api.get<{ data: DefesaTecnica[] }>(`/ia/autos/${id}/defesas`, token)
    defesas = defesasRes.data
  } catch {
    return notFound()
  }

  const podeCriarRecurso = !['ENCERRADO', 'PAGO', 'JULGADO_FAVORAVEL'].includes(auto.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/fiscalizacoes" className="text-sm text-muted-foreground hover:text-foreground">← Fiscalizações</Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{auto.numeroAuto}</h1>
          <p className="text-muted-foreground text-sm">{auto.orgao} · {auto.empreendimento.nome}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor[auto.status] ?? 'bg-gray-100'}`}>
            {statusLabel[auto.status] ?? auto.status}
          </span>
          <StatusSelect autoId={auto.id} currentStatus={auto.status} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Lavratura</p>
          <p className="text-sm font-semibold mt-1">{formatDate(auto.dataLavratura)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Prazo de Defesa</p>
          <p className="text-sm font-semibold mt-1">{formatDate(auto.prazoDefesa)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Valor da Multa</p>
          <p className="text-sm font-semibold mt-1">{auto.valorMulta ? formatarValor(auto.valorMulta) : '—'}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recursos</p>
          <p className="text-sm font-semibold mt-1">{auto.recursos.length}</p>
        </div>
      </div>

      {/* Detalhes */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm">Detalhes</h2>
        {auto.artigo && (
          <div>
            <p className="text-xs text-muted-foreground">Artigo Infringido</p>
            <p className="text-sm">{auto.artigo}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Descrição da Infração</p>
          <p className="text-sm">{auto.descricao}</p>
        </div>
        {auto.dataRecebimento && (
          <div>
            <p className="text-xs text-muted-foreground">Data de Recebimento</p>
            <p className="text-sm">{formatDate(auto.dataRecebimento)}</p>
          </div>
        )}
        {auto.observacoes && (
          <div>
            <p className="text-xs text-muted-foreground">Observações</p>
            <p className="text-sm">{auto.observacoes}</p>
          </div>
        )}
      </div>

      {/* Recursos */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Recursos Administrativos</h2>
          {podeCriarRecurso && <RecursoForm autoId={auto.id} />}
        </div>

        {auto.recursos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum recurso interposto.</div>
        ) : (
          <div className="divide-y">
            {auto.recursos.map((r) => (
              <div key={r.id} className="px-4 py-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{instanciaLabel[r.instancia] ?? r.instancia}</span>
                    {r.numeroProtocolo && (
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{r.numeroProtocolo}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.resultado && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${resultadoColor[r.resultado] ?? 'bg-gray-100'}`}>
                        {r.resultado.replace(/_/g, ' ')}
                      </span>
                    )}
                    {(!r.resultado || r.resultado === 'PENDENTE') && (
                      <RecursoResultForm autoId={auto.id} recursoId={r.id} resultadoAtual={r.resultado} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Protocolo: {formatDate(r.dataProtocolo)}</span>
                  {r.prazoResposta && <span>Prazo: {formatDate(r.prazoResposta)}</span>}
                  {r.dataJulgamento && <span>Julgado: {formatDate(r.dataJulgamento)}</span>}
                </div>
                {r.observacoes && <p className="text-xs text-muted-foreground">{r.observacoes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Defesa Técnica IA */}
      <DefesaPanel autoId={auto.id} defesas={defesas} />
    </div>
  )
}
