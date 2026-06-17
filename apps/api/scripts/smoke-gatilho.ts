import { prisma } from '../src/infra/database/prisma.js'
import { agendarRecalculoDiagnostico } from '../src/modules/diagnostico/service/diagnostico.service.js'

const EMP = process.argv[2]
if (!EMP) throw new Error('passe o empreendimentoId')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const antes = await prisma.diagnostico.count({ where: { empreendimentoId: EMP! } })
  // Muda o perfil (flip captação) → o snapshotHash muda → o gatilho deve criar versão.
  const emp = await prisma.empreendimento.findUniqueOrThrow({ where: { id: EMP! }, select: { possuiCaptacao: true } })
  await prisma.empreendimento.update({ where: { id: EMP! }, data: { possuiCaptacao: !emp.possuiCaptacao } })

  console.log(`versões antes: ${antes}; disparando gatilho não-bloqueante...`)
  agendarRecalculoDiagnostico(EMP!) // fire-and-forget
  console.log('(retornou imediatamente, sem await — não bloqueou)')

  await sleep(1500) // aguarda o setImmediate + recalc concluir
  const depois = await prisma.diagnostico.count({ where: { empreendimentoId: EMP! } })
  console.log(`versões depois: ${depois} → gatilho ${depois > antes ? 'FUNCIONOU ✅' : 'NÃO criou versão ❌'}`)
  await prisma.$disconnect()
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
