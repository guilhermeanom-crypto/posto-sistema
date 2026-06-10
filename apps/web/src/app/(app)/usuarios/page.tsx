import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDateTime } from '@/lib/date'
import { CriarUsuarioForm } from './criar-usuario-form'

export const metadata: Metadata = { title: 'Usuários' }

const perfilLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_TENANT: 'Administrador',
  COORDENADOR: 'Coordenador',
  ANALISTA: 'Analista',
  ANALISTA_CAMPO: 'Analista de Campo',
  EXECUTIVO: 'Executivo',
  REPRESENTANTE_POSTO: 'Representante',
}

const perfilVariant = (perfil: string): 'default' | 'success' | 'destructive' => {
  if (['SUPER_ADMIN', 'ADMIN_TENANT'].includes(perfil)) return 'destructive'
  if (['COORDENADOR'].includes(perfil)) return 'default'
  return 'success'
}

interface Empreendimento { id: string; nome: string; cidade: string; estado: string }

export default async function UsuariosPage() {
  const token = await getAccessToken()
  let usuarios: any[] = []
  let total = 0
  let empreendimentos: Empreendimento[] = []

  if (token) {
    try {
      const [uRes, eRes] = await Promise.all([
        api.get<{ data: any[]; pagination: any }>('/usuarios?limit=100', token),
        api.get<{ data: Empreendimento[] }>('/empreendimentos?limit=200', token),
      ])
      usuarios = uRes.data
      total = uRes.pagination.total
      empreendimentos = eRes.data
    } catch {}
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description={`${total} usuário${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
      />

      <CriarUsuarioForm empreendimentos={empreendimentos} />

      {usuarios.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Nenhum usuário encontrado"
          description="Crie o primeiro usuário usando o formulário acima."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Perfil</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={perfilVariant(u.perfil)}>
                      {perfilLabel[u.perfil] ?? u.perfil}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.ativo ? 'success' : 'destructive'}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(u.criadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
