'use client'

import { useRef, useState } from 'react'

interface VersaoResumo {
  id: string
  status: string
  criadoEm: string
  enviadoEm?: string
  motivoRejeicao?: string | null
  observacoesEnvio?: string | null
  arquivoNome?: string | null
}

interface Documento {
  id: string
  nome: string
  descricao?: string | null
  status: string
  dataValidade: string | null
  versaoAtual: VersaoResumo | null
  ultimaVersao?: VersaoResumo | null
  tipoDocumento: {
    nome: string
    codigo?: string | null
    momento?: 'ANTES_PROCESSO' | 'DURANTE_PROCESSO' | 'APOS_EMISSAO' | null
    descricaoCliente?: string | null
  }
}

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  ENVIADO: 'Enviado',
  EM_ANALISE: 'Em análise',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  VENCIDO: 'Vencido',
  A_RENOVAR: 'A renovar',
  SUBSTITUIDO: 'Substituído',
  DISPENSADO: 'Dispensado',
}

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  ENVIADO: 'bg-blue-100 text-blue-700',
  EM_ANALISE: 'bg-blue-100 text-blue-700',
  APROVADO: 'bg-green-100 text-green-700',
  REJEITADO: 'bg-red-100 text-red-700',
  VENCIDO: 'bg-red-100 text-red-700',
  A_RENOVAR: 'bg-orange-100 text-orange-700',
  SUBSTITUIDO: 'bg-gray-100 text-gray-600',
  DISPENSADO: 'bg-gray-100 text-gray-600',
}

const MIME_ACCEPT = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',')

type UploadState = 'idle' | 'hashing' | 'solicitando' | 'enviando' | 'confirmando' | 'ok' | 'erro'

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function UploadCard({ doc, apiBase, token }: { doc: Documento; apiBase: string; token: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [observacao, setObservacao] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)

  const podeEnviar = !['APROVADO', 'DISPENSADO', 'SUBSTITUIDO'].includes(doc.status)

  async function handleFile(file: File) {
    setErro(null)
    setFileName(file.name)
    setState('hashing')
    setProgress(5)

    try {
      // 1. Calcula hash SHA-256 do arquivo no browser
      const buffer = await file.arrayBuffer()
      const hash = await sha256Hex(buffer)
      setProgress(15)
      setState('solicitando')

      // 2. Solicita URL presignada
      const solRes = await fetch(`${apiBase}/portal/documentos/${doc.id}/upload/solicitar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nomeArquivo: file.name,
          mimeType: file.type,
          tamanhoBytes: file.size,
          hashSha256: hash,
        }),
      })

      if (!solRes.ok) {
        const err = await solRes.json().catch(() => ({})) as { message?: string }
        throw new Error(err.message ?? `Erro ${solRes.status} ao solicitar upload`)
      }

      const { data } = await solRes.json() as { data: { uploadUrl: string; chaveS3: string } }
      setProgress(30)
      setState('enviando')

      // 3. PUT direto ao S3/MinIO
      const putRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: buffer,
      })

      if (!putRes.ok) throw new Error(`Falha no envio ao storage (${putRes.status})`)
      setProgress(80)
      setState('confirmando')

      // 4. Confirma o upload
      const confRes = await fetch(`${apiBase}/portal/documentos/${doc.id}/upload/confirmar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chaveS3: data.chaveS3, observacoesEnvio: observacao || undefined }),
      })

      if (!confRes.ok) {
        const err = await confRes.json().catch(() => ({})) as { message?: string }
        throw new Error(err.message ?? `Erro ${confRes.status} ao confirmar upload`)
      }

      setProgress(100)
      setState('ok')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido no upload')
      setState('erro')
      setProgress(0)
    }
  }

  const progressLabel: Record<UploadState, string> = {
    idle: '',
    hashing: 'Verificando arquivo...',
    solicitando: 'Preparando envio...',
    enviando: 'Enviando arquivo...',
    confirmando: 'Finalizando...',
    ok: 'Enviado com sucesso!',
    erro: '',
  }

  const descricao = doc.tipoDocumento.descricaoCliente ?? doc.descricao

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 transition-shadow hover:shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight">{doc.nome}</p>
          {descricao && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{descricao}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
            STATUS_COLOR[doc.status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {STATUS_LABEL[doc.status] ?? doc.status}
        </span>
      </div>

      {/* Validade */}
      {doc.dataValidade && (
        <p className="text-xs text-muted-foreground">
          Validade: {new Date(doc.dataValidade).toLocaleDateString('pt-BR')}
        </p>
      )}

      {/* Última versão / arquivo enviado */}
      {(doc.ultimaVersao ?? doc.versaoAtual) && (() => {
        const versao = (doc.ultimaVersao ?? doc.versaoAtual)!
        return (
          <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs">
            <p className="font-semibold text-muted-foreground">
              Último envio · {new Date(versao.enviadoEm ?? versao.criadoEm).toLocaleString('pt-BR')}
            </p>
            {versao.arquivoNome && (
              <p className="mt-0.5 truncate font-mono text-[11px] text-foreground/80">
                📄 {versao.arquivoNome}
              </p>
            )}
            {versao.observacoesEnvio && (
              <p className="mt-1 italic leading-snug text-muted-foreground">
                &ldquo;{versao.observacoesEnvio}&rdquo;
              </p>
            )}
          </div>
        )
      })()}

      {/* Motivo de rejeição */}
      {doc.status === 'REJEITADO' && (doc.ultimaVersao ?? doc.versaoAtual)?.motivoRejeicao && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs font-medium text-red-800">Motivo da rejeição:</p>
          <p className="text-xs text-red-700 mt-0.5">{(doc.ultimaVersao ?? doc.versaoAtual)?.motivoRejeicao}</p>
        </div>
      )}

      {/* Área de upload */}
      {podeEnviar && state !== 'ok' && (
        <div className="space-y-2 pt-1">
          {state === 'idle' || state === 'erro' ? (
            <>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Justificativa ou observação
                </span>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex.: Documento enviado para análise."
                  rows={2}
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <input
                ref={inputRef}
                type="file"
                accept={MIME_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                  e.target.value = ''
                }}
              />
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-md border-2 border-dashed border-muted-foreground/30 px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors text-center"
              >
                Anexar documento e enviar
                <span className="block text-xs mt-0.5 opacity-70">PDF, JPG, PNG, DOCX - máx. 50 MB</span>
              </button>
              {erro && <p className="text-xs text-destructive">{erro}</p>}
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate max-w-[200px]">{fileName}</span>
                <span>{progressLabel[state]}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sucesso */}
      {state === 'ok' && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 flex items-center gap-2">
          <span>✓</span>
          <span>Documento enviado! Aguarde a análise da equipe Hábilis.</span>
        </div>
      )}

      {/* Não editável */}
      {!podeEnviar && (
        <p className="text-xs text-muted-foreground italic">
          Este documento está {STATUS_LABEL[doc.status]?.toLowerCase()} e não requer nova versão.
        </p>
      )}
    </div>
  )
}
