import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/date'
import { LaudoForm } from './laudo-form'
import { EquipamentoHistorico } from '../../components/equipamento-historico'

export const metadata: Metadata = { title: 'Tanque — Estanqueidade' }

interface Props { params: Promise<{ id: string }> }

const statusColor: Record<string, string> = {
  ATIVO:       'bg-green-100 text-green-800',
  INATIVO:     'bg-gray-100 text-gray-600',
  INTERDITADO: 'bg-red-100 text-red-800',
  REMOVIDO:    'bg-gray-100 text-gray-400',
}

const resultadoConfig: Record<string, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  APROVADO:     { label: 'Aprovado',     color: 'text-green-700 bg-green-50 border-green-200', Icon: CheckCircle2 },
  REPROVADO:    { label: 'Reprovado',    color: 'text-red-700 bg-red-50 border-red-200',       Icon: XCircle },
  INCONCLUSIVO: { label: 'Inconclusivo', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', Icon: AlertCircle },
}

export default async function TanqueDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let tanque: any = null
  try {
    const res = await api.get<{ data: any }>(`/estanqueidade/tanques/${id}`, token)
    tanque = res.data
  } catch {
    notFound()
  }

  const testes: any[] = tanque.testes ?? []
  const ultimoTeste   = testes[0] ?? null
  const diasProximo   = ultimoTeste?.proximoTeste
    ? Math.floor((new Date(ultimoTeste.proximoTeste).getTime() - Date.now()) / 86400000)
    : null
  const vencido  = diasProximo !== null && diasProximo < 0
  const urgente  = diasProximo !== null && diasProximo >= 0 && diasProximo <= 60

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/estanqueidade" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Estanqueidade
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tanque #{tanque.numero} — {tanque.combustivel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/empreendimentos/${tanque.empreendimento.id}`} className="hover:underline">
              {tanque.empreendimento.nome}
            </Link>
            {tanque.empreendimento.cidade && ` · ${tanque.empreendimento.cidade}, ${tanque.empreendimento.estado}`}
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColor[tanque.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {tanque.status}
        </span>
      </div>

      {/* Banner de urgência */}
      {(vencido || urgente) && (
        <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          vencido ? 'border-red-200 bg-red-50 text-red-800' : 'border-orange-200 bg-orange-50 text-orange-800'
        }`}>
          {vencido
            ? `Ensaio vencido há ${Math.abs(diasProximo!)} dias — realize o teste de estanqueidade imediatamente.`
            : `Próximo ensaio em ${diasProximo} dias — agende com antecedência.`}
        </div>
      )}

      {/* Dados do tanque */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Capacidade',      value: `${(tanque.capacidadeLitros / 1000).toFixed(1)} m³ (${tanque.capacidadeLitros.toLocaleString('pt-BR')} L)` },
          { label: 'Material',        value: tanque.material?.replace(/_/g, ' ') },
          { label: 'Data instalação', value: formatDate(tanque.dataInstalacao) },
          { label: 'Total de ensaios',value: `${testes.length}` },
          { label: 'Último ensaio',   value: ultimoTeste ? formatDate(ultimoTeste.dataExecucao) : null },
          { label: 'Próximo ensaio',  value: ultimoTeste ? formatDate(ultimoTeste.proximoTeste) : null },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-sm font-medium ${
              label === 'Próximo ensaio' && vencido ? 'text-red-600' :
              label === 'Próximo ensaio' && urgente ? 'text-orange-600' : ''
            }`}>{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Registrar novo laudo — B2 workflow */}
      <LaudoForm tanqueId={id} />

      {/* Histórico de laudos */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Histórico de Ensaios ({testes.length})</h2>
        </div>

        {testes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">
            Nenhum ensaio registrado. Registre o primeiro laudo acima.
          </p>
        ) : (
          <div className="divide-y">
            {testes.map((t: any, i: number) => {
              const cfg = resultadoConfig[t.resultado] ?? resultadoConfig['INCONCLUSIVO']!
              const { Icon } = cfg
              return (
                <div key={t.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        t.resultado === 'APROVADO' ? 'text-green-600' :
                        t.resultado === 'REPROVADO' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">Ensaio {testes.length - i}</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {i === 0 && (
                            <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                              Mais recente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(t.dataExecucao)} · {t.empresa}
                          {t.responsavel && ` · RT: ${t.responsavel}`}
                          {t.metodo && ` · Método: ${t.metodo}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Próximo ensaio: {formatDate(t.proximoTeste)}
                        </p>
                        {t.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{t.observacoes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Histórico Técnico */}
      <EquipamentoHistorico equipamentoTipo="TANQUE" equipamentoId={id} empreendimentoId={tanque.empreendimento.id} />

      {/* Observações do tanque */}
      {tanque.observacoes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Observações</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tanque.observacoes}</p>
        </div>
      )}
    </div>
  )
}
