'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removerRelatorioAction } from './actions'

interface Relatorio {
  id: string
  tipo: string
  status: string
  erroMsg: string | null
  geradoEm: string | null
  criadoEm: string
}

const tipoLabel: Record<string, string> = {
  COMPLIANCE_GERAL: 'Compliance Geral',
  VENCIMENTOS: 'Vencimentos',
  SST: 'SST',
  MONITORAMENTO_AMBIENTAL: 'Monitoramento Ambiental',
  LOGISTICA_REVERSA: 'Logística Reversa',
  AUTOS_INFRACAO: 'Autuações',
  AUDIT_LOG: 'Audit Log',
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  AGUARDANDO: { label: 'Aguardando', cls: 'bg-gray-100 text-gray-700' },
  PROCESSANDO: { label: 'Gerando...', cls: 'bg-blue-100 text-blue-700' },
  CONCLUIDO: { label: 'Pronto', cls: 'bg-green-100 text-green-800' },
  ERRO: { label: 'Erro', cls: 'bg-red-100 text-red-800' },
}

const tipoExt: Record<string, string> = {
  COMPLIANCE_GERAL: 'pdf',
  VENCIMENTOS: 'xlsx',
  SST: 'pdf',
  MONITORAMENTO_AMBIENTAL: 'pdf',
  LOGISTICA_REVERSA: 'xlsx',
  AUTOS_INFRACAO: 'xlsx',
  AUDIT_LOG: 'csv',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function DownloadButton({ id, tipo }: { id: string; tipo: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDownload() {
    startTransition(async () => {
      const res = await fetch(`/api/relatorios/${id}/download`)
      if (!res.ok) return alert('Erro ao obter link de download')
      const { url } = await res.json()
      if (url) {
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio.${tipoExt[tipo] ?? 'pdf'}`
        a.click()
      }
    })
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isPending}
      className="text-xs text-primary hover:underline disabled:opacity-50"
    >
      {isPending ? 'Gerando link...' : 'Download'}
    </button>
  )
}

function RemoverButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRemover() {
    if (!confirm('Remover este relatório?')) return
    startTransition(async () => {
      await removerRelatorioAction(id)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleRemover}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-red-600 disabled:opacity-50"
    >
      {isPending ? '...' : 'Remover'}
    </button>
  )
}

export function RelatorioList({ relatorios }: { relatorios: Relatorio[] }) {
  if (relatorios.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Nenhum relatório gerado. Clique em &quot;+ Novo Relatório&quot; para começar.
      </div>
    )
  }

  return (
    <div className="divide-y">
      {relatorios.map((r) => {
        const s = statusConfig[r.status] ?? statusConfig['AGUARDANDO']!
        return (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{tipoLabel[r.tipo] ?? r.tipo}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
              </div>
              {r.erroMsg && <p className="text-xs text-red-600 mt-0.5">{r.erroMsg}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">
                Solicitado em {formatDateTime(r.criadoEm)}
                {r.geradoEm && ` · Gerado em ${formatDateTime(r.geradoEm)}`}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {r.status === 'CONCLUIDO' && <DownloadButton id={r.id} tipo={r.tipo} />}
              <RemoverButton id={r.id} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
