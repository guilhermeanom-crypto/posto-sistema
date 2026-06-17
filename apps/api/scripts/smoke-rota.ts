import { prisma } from '../src/infra/database/prisma.js'
import { obterUltimoDiagnostico } from '../src/modules/diagnostico/service/diagnostico.service.js'

const TENANT = '173fa80b-edaf-47f8-92cf-7958da22ea47'
const COM_DIAG = '5d2846f3-1f5e-40c1-9bfa-95e92476a986' // America (já tem versões)
const SEM_DIAG = 'b52eb99b-05e8-405e-a608-a85b62078a3a' // Norte SP (0 versões → lazy compute)

async function resumo(label: string, empId: string) {
  const d = await obterUltimoDiagnostico(TENANT, empId)
  const enq = d?.enquadramento as Record<string, unknown> | null
  const obrig = (d as unknown as { obrigacoes?: { status: string }[] })?.obrigacoes ?? []
  const conformes = obrig.filter((o) => o.status === 'CONFORME').length
  console.log(`[${label}] v${d?.versao} | conformidade ${d?.conformidadeScore}% | riscoConf ${d?.riscoConformidadeScore} | riscoEco ${d?.riscoIntrinsecoScore}/${d?.riscoNivel} | enquadr ${enq?.potencialPoluidor ?? '—'}/${enq?.orgaoCompetente ?? '—'} | obrigações ${obrig.length} (${conformes} conformes)`)
}

async function main() {
  console.log('— leitura de posto COM diagnóstico (retorna última versão) —')
  await resumo('America', COM_DIAG)

  const antes = await prisma.diagnostico.count({ where: { empreendimentoId: SEM_DIAG } })
  console.log(`\n— leitura de posto SEM diagnóstico (versões antes: ${antes}) → deve calcular sob demanda —`)
  await resumo('NorteSP', SEM_DIAG)
  const depois = await prisma.diagnostico.count({ where: { empreendimentoId: SEM_DIAG } })
  console.log(`versões depois: ${depois} → lazy compute ${depois > antes ? 'FUNCIONOU ✅' : 'NÃO criou ❌'}`)

  await prisma.$disconnect()
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
