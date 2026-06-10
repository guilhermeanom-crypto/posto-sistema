import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import { PresencaToggle } from '../presenca-toggle'

interface Props {
  params: Promise<{ id: string }>
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasParaVencer(iso: string | null | undefined) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

interface TreinamentoDetalhe {
  id: string
  dataRealizacao: string
  dataVencimento: string | null
  status: string
  instrutor: string | null
  local: string | null
  cargaHorariaRealizada: number | null
  observacoes: string | null
  empreendimento: { id: string; nome: string; nomeFantasia: string | null }
  tipo: {
    nome: string; normativa: string; cargaHoraria: number
    periodicidadeMeses: number; obrigatorioParaCargos: string[]
    conteudoProgramatico: string[]
  }
  participantes: Array<{
    id: string; presenca: boolean; aprovado: boolean
    funcionario: { id: string; nome: string; cargo: string; setor: string | null }
  }>
}

interface Funcionario {
  id: string; nome: string; cargo: string; empreendimento: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Treinamento — ${(await params).id.slice(0, 8)}` }
}

export default async function TreinamentoDetalhe({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let treinamento: TreinamentoDetalhe | null = null
  let funcionariosDisponiveis: Funcionario[] = []

  try {
    const [resT] = await Promise.allSettled([
      api.get<{ data: TreinamentoDetalhe }>(`/sst/treinamentos/${id}`, token),
    ])
    if (resT.status === 'fulfilled') treinamento = resT.value.data
    else notFound()
  } catch {
    notFound()
  }

  if (!treinamento) notFound()
  const t = treinamento

  // Load funcionários do mesmo empreendimento para poder adicionar
  try {
    const resFuncs = await api.get<PaginatedResponse<Funcionario>>(
      `/sst/funcionarios?empreendimentoId=${t.empreendimento.id}&ativo=true&limit=100`,
      token,
    )
    const jaInscritos = new Set(t.participantes.map((p) => p.funcionario.id))
    funcionariosDisponiveis = resFuncs.data.filter((f) => !jaInscritos.has(f.id))
  } catch {
    // silently ignore
  }

  const dias = diasParaVencer(t.dataVencimento)
  const vencido = dias !== null && dias < 0
  const vencendo = dias !== null && dias >= 0 && dias <= 30

  const presentes = t.participantes.filter((p) => p.presenca).length
  const aprovados = t.participantes.filter((p) => p.presenca && p.aprovado).length

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/sst" className="hover:underline">SST</Link>
        <span>/</span>
        <Link href="/sst/treinamentos" className="hover:underline">Treinamentos</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{t.tipo.normativa} — {t.tipo.nome}</span>
      </div>

      {/* Header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-orange-100 text-orange-800">
                {t.tipo.normativa}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                vencido ? 'bg-red-100 text-red-800' : vencendo ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {vencido ? 'Vencido' : vencendo ? `Vence em ${dias}d` : 'Vigente'}
              </span>
            </div>
            <h1 className="text-xl font-bold">{t.tipo.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {t.empreendimento.nomeFantasia ?? t.empreendimento.nome}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Data de realização', value: formatDate(t.dataRealizacao) },
            { label: 'Vencimento', value: formatDate(t.dataVencimento) },
            { label: 'Instrutor', value: t.instrutor ?? '—' },
            { label: 'Local', value: t.local ?? '—' },
            { label: 'Carga horária', value: t.cargaHorariaRealizada ? `${t.cargaHorariaRealizada}h` : `${t.tipo.cargaHoraria}h (padrão)` },
            { label: 'Periodicidade', value: `${t.tipo.periodicidadeMeses} meses` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Conteúdo programático */}
        {t.tipo.conteudoProgramatico.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Conteúdo programático</p>
            <div className="flex flex-wrap gap-1.5">
              {t.tipo.conteudoProgramatico.map((c) => (
                <span key={c} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{c}</span>
              ))}
            </div>
          </div>
        )}

        {t.observacoes && (
          <div className="mt-4 rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Observações</p>
            <p className="text-sm mt-0.5">{t.observacoes}</p>
          </div>
        )}
      </div>

      {/* ── KPIs de presença ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Inscritos', value: t.participantes.length, cls: 'border-l-4 border-l-gray-300' },
          { label: 'Presentes', value: presentes, cls: 'border-l-4 border-l-blue-500' },
          { label: 'Aprovados', value: aprovados, cls: 'border-l-4 border-l-green-500' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-lg border bg-card p-4 ${cls}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Lista de Presença ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lista de Presença</h2>
          <p className="text-xs text-muted-foreground">Clique para marcar presença / aprovação</p>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          {t.participantes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum participante registrado.
            </div>
          ) : (
            <div className="divide-y">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto] items-center px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Participante</span>
                <span>Presença / Aprovação</span>
              </div>

              {t.participantes.map((p) => (
                <PresencaToggle
                  key={p.id}
                  execucaoId={t.id}
                  funcionarioId={p.funcionario.id}
                  funcionarioNome={p.funcionario.nome}
                  cargo={`${p.funcionario.cargo}${p.funcionario.setor ? ` · ${p.funcionario.setor}` : ''}`}
                  presenca={p.presenca}
                  aprovado={p.aprovado}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Adicionar participante ── */}
      {funcionariosDisponiveis.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-muted-foreground">Adicionar participante</h2>
          <form action={`/api/sst/treinamentos/${t.id}/participante`} method="POST" className="flex items-center gap-3">
            <select name="funcionarioId"
              className="rounded-md border bg-background px-3 py-2 text-sm flex-1 max-w-xs">
              <option value="">Selecionar funcionário...</option>
              {funcionariosDisponiveis.map((f) => (
                <option key={f.id} value={f.id}>{f.nome} — {f.cargo}</option>
              ))}
            </select>
            <button type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Adicionar
            </button>
          </form>
          <p className="text-xs text-muted-foreground">
            Funcionários ativos de {t.empreendimento.nomeFantasia ?? t.empreendimento.nome} não inscritos neste treinamento.
          </p>
        </section>
      )}
    </div>
  )
}
