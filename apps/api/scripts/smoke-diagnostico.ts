import { prisma } from '../src/infra/database/prisma.js'
import { recalcularDiagnostico } from '../src/modules/diagnostico/service/diagnostico.service.js'

// Smoke test do Passo 7 (DEV). Uso: tsx --env-file=.env scripts/smoke-diagnostico.ts <empreendimentoId>
const EMP = process.argv[2]
if (!EMP) throw new Error('passe o empreendimentoId')

async function main() {
  const dataRef = new Date('2026-06-17T00:00:00Z')

  console.log('━━ 1ª execução (deve criar versão) ━━')
  const d1 = await recalcularDiagnostico(EMP!, { dataRef })
  const enq = d1.enquadramento as Record<string, unknown> | null
  console.log({
    versao: d1.versao,
    conformidade: d1.conformidadeScore,
    riscoConformidade: d1.riscoConformidadeScore,
    riscoEcologico: d1.riscoIntrinsecoScore,
    nivelHeadline: d1.riscoNivel,
    hash: d1.snapshotHash.slice(0, 12),
  })
  console.log('enquadramento:', enq?.potencialPoluidor, '/', enq?.esfera, '/', enq?.orgaoCompetente)
  const obrig = await prisma.diagnosticoObrigacao.findMany({ where: { diagnosticoId: d1.id }, orderBy: { codigo: 'asc' } })
  console.log(`obrigações aplicáveis (${obrig.length}):`, obrig.map((o) => `${o.codigo}=${o.status}`).join(' '))
  const fr = d1.fatoresRisco as { intrinseco?: { fatores?: { descricao: string }[] } } | null
  console.log('top fatores ecológicos:', fr?.intrinseco?.fatores?.slice(0, 3).map((f) => f.descricao))

  console.log('\n━━ 2ª execução (idempotência: NÃO deve criar versão) ━━')
  const d2 = await recalcularDiagnostico(EMP!, { dataRef })
  console.log('mesma versão?', d2.versao === d1.versao, '→ v' + d2.versao)

  console.log('\n━━ 3ª execução com force (deve criar nova versão) ━━')
  const d3 = await recalcularDiagnostico(EMP!, { dataRef, force: true })
  console.log('nova versão?', d3.versao === d1.versao + 1, '→ v' + d3.versao)

  const total = await prisma.diagnostico.count({ where: { empreendimentoId: EMP! } })
  console.log('\ntotal de versões persistidas p/ este posto:', total)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
