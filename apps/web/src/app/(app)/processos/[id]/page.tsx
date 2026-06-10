import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { Badge, statusProcessoBadge, statusDocumentoBadge, labelStatus } from '@/components/ui/badge'
import { formatDate } from '@/lib/date'
import { notFound } from 'next/navigation'
import { ProcessoActions } from './processo-actions'

export const metadata: Metadata = { title: 'Processo' }

interface Props { params: Promise<{ id: string }> }

export default async function ProcessoDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let processo: any = null
  try {
    const res = await api.get<{ data: any }>(`/processos/${id}`, token)
    processo = res.data
  } catch {
    notFound()
  }

  const faseAtual = processo.faseAtualOrdem ?? 1
  const fases = processo.tipoProcesso?.fases ?? []
  const requisitos = processo.requisitos ?? []

  return (
    <div className="space-y-6">
      <Link href="/processos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Processos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{processo.tipoProcesso?.nome}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{processo.orgao?.nome ?? processo.orgao?.sigla}</span>
            <span>·</span>
            <span>{processo.empreendimento?.nome}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusProcessoBadge(processo.status)} className="text-sm px-3 py-1">
            {labelStatus(processo.status)}
          </Badge>
          <ProcessoActions
            processoId={processo.id}
            statusAtual={processo.status}
            temProximaFase={fases.some((f: any) => f.ordem === faseAtual + 1)}
          />
        </div>
      </div>

      {/* Dados */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Informações gerais */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4">
            {[
              { label: 'Nº Protocolo', value: processo.numeroProtocolo },
              { label: 'Nº Licença', value: processo.numeroLicenca },
              { label: 'Data Abertura', value: formatDate(processo.dataAbertura) },
              { label: 'Data Protocolo', value: formatDate(processo.dataProtocolo) },
              { label: 'Data Decisão', value: formatDate(processo.dataDecisao) },
              { label: 'Vencimento', value: formatDate(processo.dataVencimento) },
              { label: 'Responsável', value: processo.responsavel?.nome },
              { label: 'Fase Atual', value: faseAtual },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value ?? '—'}</p>
              </div>
            ))}
          </div>

          {/* Requisitos documentais */}
          {requisitos.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b font-semibold text-sm">Requisitos Documentais</div>
              <div className="divide-y">
                {requisitos.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{req.tipoDocumento?.nome ?? req.descricao}</p>
                      {req.obrigatorio && <p className="text-xs text-muted-foreground">Obrigatório</p>}
                    </div>
                    <Badge variant={statusDocumentoBadge(req.status)}>{labelStatus(req.status)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline de fases */}
        {fases.length > 0 && (
          <div className="rounded-lg border bg-card p-5">
            <p className="font-semibold text-sm mb-4">Fases do Processo</p>
            <div className="space-y-3">
              {fases.sort((a: any, b: any) => a.ordem - b.ordem).map((fase: any) => {
                const concluida = fase.ordem < faseAtual
                const atual = fase.ordem === faseAtual
                return (
                  <div key={fase.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 ${concluida ? 'text-green-600' : atual ? 'text-primary' : 'text-muted-foreground/40'}`}>
                      {concluida ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className={`text-sm ${atual ? 'font-semibold' : concluida ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                        {fase.nome}
                      </p>
                      {atual && <p className="text-xs text-primary">Fase atual</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Observações */}
      {processo.observacoes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Observações</p>
          <p className="text-sm text-muted-foreground">{processo.observacoes}</p>
        </div>
      )}
    </div>
  )
}
