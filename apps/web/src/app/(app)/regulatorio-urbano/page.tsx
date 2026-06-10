import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/lib/api'
import { CriarAlvaraForm } from './criar-alvara-form'

export const metadata: Metadata = { title: 'Regulatório Urbano' }

interface AlvaraUrbanistico {
  id: string
  tipo: string
  numero: string | null
  orgaoEmissor: string
  dataEmissao: string | null
  dataVencimento: string | null
  status: string
  empreendimento: { id: string; nome: string }
}

const tipoLabel: Record<string, string> = {
  AVCB: 'AVCB',
  HABITE_SE: 'Habite-se',
  ALVARA_FUNCIONAMENTO: 'Alvará de Funcionamento',
  PPCI: 'PPCI',
  LICENCA_SANITARIA: 'Licença Sanitária',
  ALVARA_OBRAS: 'Alvará de Obras',
  OUTROS: 'Outros',
}

const statusLabel: Record<string, string> = {
  VIGENTE: 'Vigente',
  A_RENOVAR: 'A Renovar',
  VENCIDA: 'Vencida',
  SUSPENSA: 'Suspensa',
  CANCELADA: 'Cancelada',
  EM_RENOVACAO: 'Em Renovação',
}

const statusColor: Record<string, string> = {
  VIGENTE: 'bg-green-100 text-green-800',
  A_RENOVAR: 'bg-yellow-100 text-yellow-800',
  VENCIDA: 'bg-red-100 text-red-800',
  SUSPENSA: 'bg-orange-100 text-orange-800',
  CANCELADA: 'bg-gray-100 text-gray-600',
  EM_RENOVACAO: 'bg-blue-100 text-blue-800',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function diasRestantes(dataVencimento: string | null) {
  if (!dataVencimento) return null
  const hoje = new Date()
  const venc = new Date(dataVencimento)
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function RegulatorioUrbanoPage() {
  const token = await getAccessToken()

  let alvaras: AlvaraUrbanistico[] = []
  if (token) {
    try {
      const res = await api.get<PaginatedResponse<AlvaraUrbanistico>>(
        '/regulatorio-urbano?limit=50',
        token,
      )
      alvaras = res.data
    } catch {
      // exibe vazio
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regulatório Urbano</h1>
          <p className="text-muted-foreground text-sm">AVCB, Alvará de Funcionamento, Habite-se e demais documentos municipais</p>
        </div>
      </div>

      <CriarAlvaraForm />

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">
            {alvaras.length} documento{alvaras.length !== 1 ? 's' : ''} cadastrado{alvaras.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {alvaras.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum documento urbano cadastrado. Adicione o primeiro acima.
          </div>
        ) : (
          <div className="divide-y">
            {alvaras.map((alv) => {
              const dias = diasRestantes(alv.dataVencimento)
              return (
                <Link
                  key={alv.id}
                  href={`/regulatorio-urbano/${alv.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-bold">
                        {tipoLabel[alv.tipo] ?? alv.tipo}
                      </span>
                      {alv.numero && (
                        <span className="text-sm font-medium">{alv.numero}</span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[alv.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {statusLabel[alv.status] ?? alv.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">{alv.empreendimento.nome}</span>
                      <span className="text-xs text-muted-foreground">{alv.orgaoEmissor}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    {alv.dataVencimento ? (
                      <>
                        <p className="text-xs text-muted-foreground">Vence em</p>
                        <p className="text-sm font-medium">{formatDate(alv.dataVencimento)}</p>
                        {dias !== null && dias >= 0 && dias <= 120 && (
                          <p className={`text-xs font-medium ${dias <= 30 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {dias} dia{dias !== 1 ? 's' : ''}
                          </p>
                        )}
                        {dias !== null && dias < 0 && (
                          <p className="text-xs font-medium text-red-600">Vencida há {Math.abs(dias)} dias</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sem validade</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
