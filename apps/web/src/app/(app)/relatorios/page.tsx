import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { SolicitarRelatorioForm } from './solicitarForm'
import { RelatorioList } from './relatorioList'

export const metadata: Metadata = { title: 'Relatórios' }

interface RelatorioGerado {
  id: string
  tipo: string
  status: string
  erroMsg: string | null
  geradoEm: string | null
  criadoEm: string
}

export default async function RelatoriosPage() {
  const token = await getAccessToken()
  let relatorios: RelatorioGerado[] = []

  if (token) {
    try {
      const res = await api.get<{ data: RelatorioGerado[] }>('/relatorios', token)
      relatorios = res.data
    } catch { /* exibe vazio */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios e Exportações</h1>
        <p className="text-muted-foreground text-sm">Gere relatórios PDF e Excel de forma assíncrona</p>
      </div>

      <SolicitarRelatorioForm />

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">Relatórios Gerados</h2>
        </div>
        <RelatorioList relatorios={relatorios} />
      </div>
    </div>
  )
}
