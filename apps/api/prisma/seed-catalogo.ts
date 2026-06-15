import { PrismaClient } from '@prisma/client'
import { seedBaseInterface } from './seed/servicos-consultoria-base-interface.js'
import { seedServicosConsultoriaEPrecificacao } from './seed/servicos-consultoria.js'

// ─────────────────────────────────────────────────────────────────────────────
// SEED DE PRODUÇÃO — base regulatória + catálogo de serviços (GLOBAIS) e a
// política de precificação do tenant informado.
// O ServicoCatalogo é global (codigo @unique sem tenantId); a base de obrigações
// também. Só a PoliticaPrecificacaoDiagnostico é por-tenant. Rodar uma vez por
// tenant que vá gerar propostas (idempotente — usa upsert).
//
// Uso (dentro do container de produção):
//   SEED_TENANT_ID=<uuid> node_modules/.bin/tsx prisma/seed-catalogo.ts
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

async function main() {
  const tenantId = process.env.SEED_TENANT_ID
  if (!tenantId) {
    console.error('❌ Defina SEED_TENANT_ID com o UUID do tenant.')
    process.exit(1)
  }

  await seedBaseInterface(prisma)
  await seedServicosConsultoriaEPrecificacao(prisma, tenantId)

  const totalCatalogo = await prisma.servicoCatalogo.count()
  console.log(`✅ Base regulatória + catálogo semeados. ServicoCatalogo total: ${totalCatalogo}`)
  console.log(`✅ Política de precificação criada para o tenant ${tenantId}`)
}

main()
  .catch((err) => {
    console.error('Falha no seed de catálogo:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
