import { notFound } from 'next/navigation'
import { Users, Building2, MapPin } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { formatDateTime } from '@/lib/utils'
import { EditarTenantForm, BotaoDesativar } from './tenant-actions'

interface TenantDetalhe {
  id: string
  nome: string
  slug: string
  plano: 'STARTER' | 'PRO' | 'ENTERPRISE'
  status: 'ATIVO' | 'SUSPENSO' | 'CANCELADO'
  ativo: boolean
  limiteEmpreendimentos: number
  dataAtivacao: string | null
  dataExpiracao: string | null
  criadoEm: string
  atualizadoEm: string
  _stats: {
    totalUsuarios: number
    totalEmpresas: number
    totalEmpreendimentos: number
  }
  usuarios: Array<{
    id: string
    nome: string
    email: string
    perfil: string
    ativo: boolean
    criadoEm: string
    ultimoAcesso: string | null
  }>
}

const planoBadge: Record<string, string> = {
  STARTER: 'bg-muted text-muted-foreground border',
  PRO: 'bg-blue-50 text-blue-700 border-blue-200',
  ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200',
}

const statusBadge: Record<string, string> = {
  ATIVO: 'bg-green-50 text-green-700 border-green-200',
  SUSPENSO: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  CANCELADO: 'bg-red-50 text-red-700 border-red-200',
}

const perfilLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_TENANT: 'Admin',
  COORDENADOR: 'Coordenador',
  ANALISTA: 'Analista',
  ANALISTA_CAMPO: 'Analista Campo',
  EXECUTIVO: 'Executivo',
  REPRESENTANTE_POSTO: 'Representante',
}

export default async function TenantDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return notFound()

  let tenant: TenantDetalhe | null = null
  try {
    const res = await api.get<{ data: TenantDetalhe }>(`/tenants/${id}`, token)
    tenant = res.data
  } catch {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.nome}
        description={`/${tenant.slug}`}
        action={
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-medium ${planoBadge[tenant.plano] ?? ''}`}>
              {tenant.plano}
            </span>
            <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-medium ${statusBadge[tenant.status] ?? ''}`}>
              {tenant.status}
            </span>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-muted-foreground/50" />
          <div>
            <p className="text-2xl font-bold">{tenant._stats.totalUsuarios}</p>
            <p className="text-xs text-muted-foreground">Usuários</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-muted-foreground/50" />
          <div>
            <p className="text-2xl font-bold">{tenant._stats.totalEmpresas}</p>
            <p className="text-xs text-muted-foreground">Empresas</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <MapPin className="h-8 w-8 text-muted-foreground/50" />
          <div>
            <p className="text-2xl font-bold">{tenant._stats.totalEmpreendimentos}</p>
            <p className="text-xs text-muted-foreground">
              Postos <span className="text-muted-foreground/60">/ {tenant.limiteEmpreendimentos} limite</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Edição */}
        <div className="col-span-2 rounded-lg border bg-card p-5 space-y-4">
          <p className="text-sm font-semibold">Editar Tenant</p>
          <EditarTenantForm tenant={{
            id: tenant.id,
            nome: tenant.nome,
            plano: tenant.plano,
            status: tenant.status,
            limiteEmpreendimentos: tenant.limiteEmpreendimentos,
          }} />
        </div>

        {/* Informações */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">Informações</p>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">ID</dt>
                <dd className="font-mono text-xs mt-0.5 break-all">{tenant.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Ativado em</dt>
                <dd className="mt-0.5">{tenant.dataAtivacao ? formatDateTime(tenant.dataAtivacao) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Expira em</dt>
                <dd className="mt-0.5">{tenant.dataExpiracao ? formatDateTime(tenant.dataExpiracao) : 'Sem expiração'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Criado em</dt>
                <dd className="mt-0.5">{formatDateTime(tenant.criadoEm)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">Atualizado em</dt>
                <dd className="mt-0.5">{formatDateTime(tenant.atualizadoEm)}</dd>
              </div>
            </dl>
          </div>

          {tenant.ativo && (
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 space-y-2">
              <p className="text-sm font-semibold text-red-800">Zona de perigo</p>
              <p className="text-xs text-red-700">Desativar o tenant bloqueará o acesso de todos os seus usuários.</p>
              <BotaoDesativar tenantId={tenant.id} nomeAtual={tenant.nome} />
            </div>
          )}
        </div>
      </div>

      {/* Últimos usuários */}
      {tenant.usuarios.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b">
            <p className="text-sm font-semibold">Últimos usuários</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">E-mail</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Perfil</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Último acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenant.usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">{u.nome}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded-md bg-muted border px-2 py-0.5 text-xs font-medium">
                      {perfilLabel[u.perfil] ?? u.perfil}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {u.ultimoAcesso ? formatDateTime(u.ultimoAcesso) : 'Nunca'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
