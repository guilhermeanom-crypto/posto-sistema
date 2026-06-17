import { prisma } from '../src/infra/database/prisma.js'
import { executarGapAnalysis } from '../src/modules/onboarding/gap-analysis.service.js'
const EMP = '5d2846f3-1f5e-40c1-9bfa-95e92476a986'
const TENANT = '173fa80b-edaf-47f8-92cf-7958da22ea47'
const r = await executarGapAnalysis(prisma, EMP, TENANT)
console.log('total:', r.totalObrigacoes, '| conformes:', r.conformes, '| aRenovar:', r.aRenovar, '| semDados:', r.semDados, '| NAO_APLICAVEL:', r.naoAplicaveis, '| score:', r.scoreBase + '%')
console.log('NÃO APLICÁVEIS:', r.itens.filter((i) => i.status === 'NAO_APLICAVEL').map((i) => i.codigo).join(', ') || '(nenhuma)')
await prisma.$disconnect()
