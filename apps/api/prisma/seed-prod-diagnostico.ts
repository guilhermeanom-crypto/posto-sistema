import { PrismaClient } from '@prisma/client'
import { seedObrigacoesRegulatorias } from './seed/obrigacoes-regulatorias.js'

// ─────────────────────────────────────────────────────────────────────────────
// SEED de PRODUÇÃO — só o necessário para o motor de diagnóstico (Blueprint 101).
// Atualiza as 34 obrigações com `aplicabilidade`/consequência (update-or-create
// por código — idempotente). NÃO toca em ServicoCatalogo (cujo seed não é
// idempotente). A fundação (CNAEs/órgãos/matriz) roda pelo seed-fundacao.ts.
// Uso (no container): node_modules/.bin/tsx prisma/seed-prod-diagnostico.ts
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

async function main() {
  await seedObrigacoesRegulatorias(prisma)
  const total = await prisma.obrigacaoRegulatoriaBase.count()
  console.log(`✅ Catálogo de obrigações processado (total: ${total})`)
}

main()
  .catch((e) => {
    console.error('Falha no seed-prod-diagnostico:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
