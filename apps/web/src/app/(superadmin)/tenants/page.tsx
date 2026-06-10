import Link from 'next/link'
import { Building, Plus } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDateTime } from '@/lib/utils'

interface Tenant {
  id: string
  nome: string
  slug: string
  plano: 'STARTER' | 'PRO' | 'ENTERPRISE'
  status: 'ATIVO' | 'SUSPENSO' | 'CANCELADO'
  ativo: boolean
  limiteEmpreendimentos: number
  dataAtivacao: string | null
  criadoEm: string
  _count: { usuarios: number; empresas: number }
}

const planoLabel: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
}

const planoBadge: Record<string, string> = {
  STARTER: 'bg-muted text-muted-foreground',
  PRO: 'bg-blue-50 text-blue-700 border-blue-200',
  ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200',
}

const statusBadge: Record<string, string> = {
  ATIVO: 'bg-green-50 text-green-700 border-green-200',
  SUSPENSO: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  CANCELADO: 'bg-red-50 text-red-700 border-red-200',
}

export default async function TenantsPage() {
  const token = await getAccessToken()
  let tenants: Tenant[] = []
  let total = 0

  if (token) {
    try {
      const res = await api.get<{ data: Tenant[]; pagination: { total: number } }>(
        '/tenants?limit=100',
        token,
      )
      tenants = res.data
      total = res.pagination.total
    } catch {}
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description={`${total} tenant${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
        action={
          <Link
            href="/tenants/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Tenant
          </Link>
        }
      />

      {tenants.length === 0 ? (
        <EmptyState
          icon={<Building className="h-10 w-10" />}
          title="Nenhum tenant cadastrado"
          description="Crie o primeiro tenant clicando em Novo Tenant."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuários</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Limite Postos</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link href={`/tenants/${t.id}`} className="font-medium hover:text-primary transition-colors">
                      {t.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{t.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${planoBadge[t.plano] ?? 'bg-muted text-muted-foreground'}`}>
                      {planoLabel[t.plano] ?? t.plano}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadge[t.status] ?? ''}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t._count.usuarios}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.limiteEmpreendimentos}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(t.criadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
