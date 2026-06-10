import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'

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

interface Empreendimento { id: string; nome: string; nomeFantasia: string | null }
interface ASO {
  id: string; tipo: string; dataExame: string; dataVencimento: string | null
  aptidao: string; medicoResponsavel: string | null; observacoes: string | null
  empreendimento: { nome: string }
}
interface TreinamentoParticipante {
  id: string; presenca: boolean; aprovado: boolean
  execucao: {
    id: string; dataRealizacao: string; dataVencimento: string | null; status: string
    tipo: { nome: string; normativa: string; cargaHoraria: number }
    empreendimento: { nome: string }
    instrutor: string | null; local: string | null
  }
}
interface EntregaEPI {
  id: string; tipoEPI: string; ca: string | null; quantidade: number
  dataEntrega: string; dataVencimento: string | null; status: string; observacoes: string | null
}

interface FuncionarioDetalhe {
  id: string; nome: string; cpf: string | null; rg: string | null
  dataNascimento: string | null; cargo: string; setor: string | null; vinculo: string
  email: string | null; telefone: string | null; dataAdmissao: string
  dataDemissao: string | null; motivoDemissao: string | null; observacoes: string | null; ativo: boolean
  empreendimento: Empreendimento
  asos: ASO[]
  treinamentosParticipados: TreinamentoParticipante[]
  entregasEPI: EntregaEPI[]
}

const aptidaoConfig: Record<string, { label: string; cls: string }> = {
  APTO:           { label: 'Apto',              cls: 'bg-green-100 text-green-800' },
  INAPTO:         { label: 'Inapto',            cls: 'bg-red-100 text-red-800' },
  APTO_RESTRICOES:{ label: 'Apto c/ Restrições', cls: 'bg-yellow-100 text-yellow-800' },
}

const epiStatusCls: Record<string, string> = {
  VIGENTE:   'bg-green-100 text-green-800',
  VENCIDO:   'bg-red-100 text-red-800',
  DEVOLVIDO: 'bg-gray-100 text-gray-600',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Ficha do Funcionário — ${id.slice(0, 8)}` }
}

export default async function FuncionarioFichaPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let funcionario: FuncionarioDetalhe | null = null
  try {
    const res = await api.get<{ data: FuncionarioDetalhe }>(`/sst/funcionarios/${id}`, token)
    funcionario = res.data
  } catch {
    notFound()
  }
  if (!funcionario) notFound()

  const f = funcionario
  const ultimoASO = f.asos[0]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/funcionarios" className="hover:underline">Funcionários</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{f.nome}</span>
      </div>

      {/* Header card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {f.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold">{f.nome}</h1>
                <p className="text-sm text-muted-foreground">{f.cargo}{f.setor ? ` · ${f.setor}` : ''}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              f.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {f.ativo ? 'Ativo' : 'Desligado'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
              {f.vinculo}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Empreendimento', value: f.empreendimento.nomeFantasia ?? f.empreendimento.nome },
            { label: 'Admissão', value: formatDate(f.dataAdmissao) },
            { label: 'CPF', value: f.cpf ?? '—' },
            { label: 'RG', value: f.rg ?? '—' },
            { label: 'Nascimento', value: formatDate(f.dataNascimento) },
            { label: 'E-mail', value: f.email ?? '—' },
            { label: 'Telefone', value: f.telefone ?? '—' },
            ...(f.dataDemissao ? [{ label: 'Demissão', value: formatDate(f.dataDemissao) }] : []),
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium mt-0.5 break-all">{value}</p>
            </div>
          ))}
        </div>

        {f.motivoDemissao && (
          <div className="mt-4 rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Motivo do desligamento</p>
            <p className="text-sm mt-0.5">{f.motivoDemissao}</p>
          </div>
        )}
        {f.observacoes && (
          <div className="mt-3 rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Observações</p>
            <p className="text-sm mt-0.5">{f.observacoes}</p>
          </div>
        )}
      </div>

      {/* ── ASOs ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">ASOs — Atestados de Saúde Ocupacional</h2>
          <Link
            href={`/sst?funcionarioId=${f.id}`}
            className="text-sm text-primary hover:underline"
          >
            + Novo ASO
          </Link>
        </div>

        {f.asos.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum ASO cadastrado.
          </div>
        ) : (
          <div className="rounded-lg border bg-card divide-y">
            {f.asos.map((aso, idx) => {
              const dias = diasParaVencer(aso.dataVencimento)
              const apCfg = aptidaoConfig[aso.aptidao] ?? { label: aso.aptidao, cls: 'bg-gray-100 text-gray-600' }
              return (
                <div key={aso.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {idx === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase">
                        Último
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{aso.tipo.replace(/_/g, ' ')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${apCfg.cls}`}>
                          {apCfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {aso.empreendimento.nome}
                        {aso.medicoResponsavel && ` · Dr(a). ${aso.medicoResponsavel}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Exame: {formatDate(aso.dataExame)}</p>
                    {aso.dataVencimento && (
                      <p className="text-sm font-medium">Vence: {formatDate(aso.dataVencimento)}</p>
                    )}
                    {dias !== null && dias < 0 && (
                      <p className="text-xs text-red-600 font-semibold">Vencido há {Math.abs(dias)}d</p>
                    )}
                    {dias !== null && dias >= 0 && dias <= 60 && (
                      <p className={`text-xs font-semibold ${dias <= 15 ? 'text-red-600' : 'text-yellow-600'}`}>
                        Vence em {dias}d
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Treinamentos ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Treinamentos SST</h2>
          <Link href="/sst/treinamentos" className="text-sm text-primary hover:underline">
            Ver todos →
          </Link>
        </div>

        {f.treinamentosParticipados.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum treinamento registrado.
          </div>
        ) : (
          <div className="rounded-lg border bg-card divide-y">
            {f.treinamentosParticipados.map((tp) => {
              const dias = diasParaVencer(tp.execucao.dataVencimento)
              const vencido = dias !== null && dias < 0
              const vencendo = dias !== null && dias >= 0 && dias <= 30
              return (
                <div key={tp.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tp.execucao.tipo.nome}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">
                        {tp.execucao.tipo.normativa}
                      </span>
                      {!tp.presenca && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          Ausente
                        </span>
                      )}
                      {tp.presenca && !tp.aprovado && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          Reprovado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {tp.execucao.empreendimento.nome}
                      {tp.execucao.instrutor && ` · ${tp.execucao.instrutor}`}
                      {tp.execucao.local && ` · ${tp.execucao.local}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Realizado: {formatDate(tp.execucao.dataRealizacao)}
                    </p>
                    {tp.execucao.dataVencimento && (
                      <p className={`text-sm font-medium ${vencido ? 'text-red-600' : vencendo ? 'text-yellow-600' : ''}`}>
                        Vence: {formatDate(tp.execucao.dataVencimento)}
                      </p>
                    )}
                    {vencido && <p className="text-xs text-red-600 font-semibold">Vencido há {Math.abs(dias!)}d</p>}
                    {vencendo && <p className="text-xs text-yellow-600 font-semibold">Vence em {dias}d</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── EPI ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">EPI — Equipamentos de Proteção Individual</h2>
        </div>

        {f.entregasEPI.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhuma entrega de EPI registrada.
          </div>
        ) : (
          <div className="rounded-lg border bg-card divide-y">
            {f.entregasEPI.map((epi) => {
              const dias = diasParaVencer(epi.dataVencimento)
              const epiCls = epiStatusCls[epi.status] ?? 'bg-gray-100 text-gray-600'
              return (
                <div key={epi.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{epi.tipoEPI}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${epiCls}`}>
                        {epi.status}
                      </span>
                      {epi.ca && (
                        <span className="text-xs text-muted-foreground">CA {epi.ca}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Qtd: {epi.quantidade}
                      {epi.observacoes && ` · ${epi.observacoes}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Entrega: {formatDate(epi.dataEntrega)}</p>
                    {epi.dataVencimento && (
                      <p className={`text-sm font-medium ${dias !== null && dias < 0 ? 'text-red-600' : dias !== null && dias <= 30 ? 'text-yellow-600' : ''}`}>
                        Vence: {formatDate(epi.dataVencimento)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Último ASO quick summary */}
      {ultimoASO && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <strong>Resumo de saúde:</strong> Último ASO {ultimoASO.tipo.replace(/_/g, ' ')} em{' '}
          {formatDate(ultimoASO.dataExame)} —{' '}
          <span className={`font-semibold ${ultimoASO.aptidao === 'INAPTO' ? 'text-red-600' : 'text-green-700'}`}>
            {aptidaoConfig[ultimoASO.aptidao]?.label ?? ultimoASO.aptidao}
          </span>
        </div>
      )}
    </div>
  )
}
