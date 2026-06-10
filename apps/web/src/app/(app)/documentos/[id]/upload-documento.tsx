'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { solicitarUploadAction, confirmarUploadAction } from '../actions'
import { toast } from '@/hooks/use-toast'

interface Props {
  documentoId: string
}

export function UploadDocumento({ documentoId }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [progresso, setProgresso] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function handleArquivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setArquivo(e.target.files?.[0] ?? null)
    setProgresso(null)
  }

  function handleUpload() {
    if (!arquivo) return

    startTransition(async () => {
      // Fase 1: solicitar URL presignada
      const solicitacao = await solicitarUploadAction(
        documentoId,
        arquivo.name,
        arquivo.size,
        arquivo.type || 'application/octet-stream',
      )

      if (solicitacao.error || !solicitacao.data) {
        toast({ title: 'Erro ao iniciar upload', description: solicitacao.error, variant: 'destructive' })
        return
      }

      const { versaoId, uploadUrl, chaveS3 } = solicitacao.data

      // Fase 2: PUT direto no S3 via presigned URL
      try {
        setProgresso(0)
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgresso(Math.round((e.loaded / e.total) * 100))
        }

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 status ${xhr.status}`)))
          xhr.onerror = () => reject(new Error('Falha na conexão'))
          xhr.open('PUT', uploadUrl)
          xhr.setRequestHeader('Content-Type', arquivo.type || 'application/octet-stream')
          xhr.send(arquivo)
        })
      } catch (err) {
        setProgresso(null)
        toast({ title: 'Falha no envio para o storage', description: String(err), variant: 'destructive' })
        return
      }

      // Fase 3: confirmar upload
      const confirmacao = await confirmarUploadAction(documentoId, versaoId, chaveS3)
      setProgresso(null)
      setArquivo(null)
      if (inputRef.current) inputRef.current.value = ''

      if (confirmacao.error) {
        toast({ title: 'Arquivo enviado mas confirmação falhou', description: confirmacao.error, variant: 'destructive' })
      } else {
        toast({ title: 'Arquivo enviado com sucesso', variant: 'success' })
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <p className="text-sm font-semibold">Enviar Nova Versão</p>

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          id="arquivo-upload"
          onChange={handleArquivoChange}
          disabled={pending}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
        />
        <button
          onClick={handleUpload}
          disabled={!arquivo || pending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {pending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>

      {arquivo && !pending && (
        <p className="text-xs text-muted-foreground">
          {arquivo.name} · {(arquivo.size / 1024).toFixed(1)} KB
        </p>
      )}

      {progresso !== null && (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progresso}%</p>
        </div>
      )}
    </div>
  )
}
