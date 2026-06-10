import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Link2 } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { Badge, statusTarefaBadge, prioridadeBadge, labelStatus } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/date'
import { notFound } from 'next/navigation'
import { TarefaActions } from './tarefa-actions'

const origemLabel: Record<string, string> = {
  MANUAL:        'Criada manualmente',
  ALERTA:        'Originada de alerta',
  CONDICIONANTE: 'Originada de condicionante',
  REGRA:         'Criada por regra automática',
  PROCESSO:      'Vinculada a processo',
  DOCUMENTO:     'Vinculada a documento',
}

export const metadata: Metadata = { title: 'Tarefa' }

interface Props { params: Promise<{ id: string }> }

export default async function TarefaDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let tarefa: any = null
  try {
    const res = await api.get<{ data: any }>(`/tarefas/${id}`, token)
    tarefa = res.data
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/tarefas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Tarefas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tarefa.titulo}</h1>
          {tarefa.empreendimento && (
            <p className="mt-1 text-sm text-muted-foreground">{tarefa.empreendimento.nome}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={prioridadeBadge(tarefa.prioridade)}>{labelStatus(tarefa.prioridade)}</Badge>
          <Badge variant={statusTarefaBadge(tarefa.status)}>{labelStatus(tarefa.status)}</Badge>
        </div>
      </div>

      {/* Ações */}
      <TarefaActions tarefaId={tarefa.id} status={tarefa.status} />

      {/* Detalhes */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Responsável', value: tarefa.responsavel?.nome },
          { label: 'Data Limite', value: formatDate(tarefa.dataVencimento) },
          { label: 'Iniciada em', value: formatDateTime(tarefa.iniciadaEm) },
          { label: 'Concluída em', value: formatDateTime(tarefa.concluidaEm) },
          { label: 'Criada em', value: formatDateTime(tarefa.criadoEm) },
          { label: 'Criada por', value: tarefa.criador?.nome },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Rastreabilidade de origem */}
      {(tarefa.origem || tarefa.processo || tarefa.condicionante || tarefa.empreendimento) && (
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Origem e Contexto</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Tipo de origem</span>
              <span className="font-medium">{origemLabel[tarefa.origem] ?? tarefa.origem ?? '—'}</span>
            </div>
            {tarefa.empreendimento && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Empreendimento</span>
                <Link href={`/empreendimentos/${tarefa.empreendimento.id}`} className="text-primary hover:underline font-medium">
                  {tarefa.empreendimento.nome}
                </Link>
              </div>
            )}
            {tarefa.processo && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Processo</span>
                <Link href={`/processos/${tarefa.processo.id}`} className="text-primary hover:underline font-medium">
                  {tarefa.processo.numeroProtocolo ?? tarefa.processo.id.slice(0, 8)}
                </Link>
              </div>
            )}
            {tarefa.condicionante && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Condicionante</span>
                <Link href={`/condicionantes/${tarefa.condicionante.id}`} className="text-primary hover:underline font-medium truncate">
                  {tarefa.condicionante.descricao}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {tarefa.descricao && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Descrição</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tarefa.descricao}</p>
        </div>
      )}

      {tarefa.observacoes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Observações de Conclusão</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tarefa.observacoes}</p>
        </div>
      )}

      {tarefa.motivoCancelamento && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm font-medium text-destructive mb-2">Motivo do Cancelamento</p>
          <p className="text-sm text-muted-foreground">{tarefa.motivoCancelamento}</p>
        </div>
      )}
    </div>
  )
}
