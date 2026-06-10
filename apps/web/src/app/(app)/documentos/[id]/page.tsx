import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { Badge, statusDocumentoBadge, labelStatus } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/date'
import { notFound } from 'next/navigation'
import { UploadDocumento } from './upload-documento'
import { AprovacaoInline } from '../aprovacao-inline'

export const metadata: Metadata = { title: 'Documento' }

interface Props { params: Promise<{ id: string }> }

const versaoStatusLabel: Record<string, string> = {
  AGUARDANDO_UPLOAD: 'Ag. upload',
  ENVIADA: 'Enviada',
  EM_VALIDACAO: 'Em validação',
  ATIVA: 'Ativa',
  REJEITADA: 'Rejeitada',
  SUBSTITUIDA: 'Substituída',
  UPLOAD_FALHOU: 'Falha no upload',
}

export default async function DocumentoDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let documento: any = null
  try {
    const res = await api.get<{ data: any }>(`/documentos/${id}`, token)
    documento = res.data
  } catch {
    notFound()
  }

  const versoes: any[] = documento.versoes ?? []
  const versaoAtiva = versoes.find((v: any) => v.status === 'ATIVA')

  return (
    <div className="space-y-6">
      <Link href="/documentos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Documentos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {documento.tipoDocumento?.nome ?? documento.nome ?? 'Documento'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {documento.empreendimento?.nome}
          </p>
        </div>
        <Badge variant={statusDocumentoBadge(documento.status)} className="text-sm px-3 py-1">
          {labelStatus(documento.status)}
        </Badge>
      </div>

      {/* Detalhes */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Categoria', value: documento.tipoDocumento?.categoria },
          { label: 'Data Emissão', value: formatDate(documento.dataEmissao) },
          { label: 'Validade', value: formatDate(documento.dataValidade) },
          { label: 'Número / Protocolo', value: documento.numeroDocumento },
          { label: 'Órgão Emissor', value: documento.orgaoEmissor },
          { label: 'Processo', value: documento.processo?.tipoProcesso?.nome },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Versões */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b font-semibold text-sm">
          Histórico de Versões ({versoes.length})
        </div>
        {versoes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhuma versão enviada.</p>
        ) : (
          <div className="divide-y">
            {versoes.map((v: any, i: number) => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Versão {versoes.length - i}</span>
                    {v.id === versaoAtiva?.id && (
                      <Badge variant="success" className="text-xs">Ativa</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.enviadoPor?.nome ?? '—'} · {formatDateTime(v.criadoEm)}
                  </p>
                  {v.motivoRejeicao && (
                    <p className="text-xs text-destructive mt-0.5">Rejeitado: {v.motivoRejeicao}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <span className="text-xs text-muted-foreground">{versaoStatusLabel[v.status] ?? v.status}</span>
                  {v.status === 'ATIVA' && (
                    <a
                      href={`/api/documentos/${id}/versoes/${v.id}/download`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </a>
                  )}
                  {v.status === 'ENVIADA' && (
                    <AprovacaoInline documentoId={id} versaoId={v.id} size="md" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload de nova versão */}
      <UploadDocumento documentoId={id} />

      {/* Observações */}
      {documento.observacoes && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Observações</p>
          <p className="text-sm text-muted-foreground">{documento.observacoes}</p>
        </div>
      )}
    </div>
  )
}
