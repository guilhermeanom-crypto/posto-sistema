import { PageHeader } from '@/components/ui/page-header'
import { NovoTenantForm } from './novo-tenant-form'

export default function NovoTenantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Tenant"
        description="Cadastre uma nova empresa cliente e crie o usuário administrador inicial."
      />
      <NovoTenantForm />
    </div>
  )
}
