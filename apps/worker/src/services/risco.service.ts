import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'
import { prisma } from '../infra/prisma.js'

// ─────────────────────────────────────────────────────────────────────────────
// SCORE DE RISCO DE FISCALIZAÇÃO
// Calcula score 0-100 por órgão para cada empreendimento.
// Maior score = maior risco de ser fiscalizado / autuado.
// ─────────────────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

type Nivel = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
type Orgao = 'CETESB' | 'ANP' | 'INMETRO' | 'BOMBEIROS'

interface Fator { descricao: string; pontos: number }

function nivelFromScore(score: number): Nivel {
  if (score >= 75) return 'CRITICO'
  if (score >= 50) return 'ALTO'
  if (score >= 25) return 'MEDIO'
  return 'BAIXO'
}

function diasAte(data: Date): number {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(data); alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000)
}

// ─── cálculos por órgão ───────────────────────────────────────────────────────

async function calcularCETESB(empId: string): Promise<{ score: number; fatores: Fator[] }> {
  const fatores: Fator[] = []
  let score = 0

  const hoje = new Date()
  const em90 = new Date(hoje); em90.setDate(em90.getDate() + 90)
  const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30)

  // Licenças ambientais
  const licencas = await prisma.licencaAmbiental.findMany({
    where: { empreendimentoId: empId, status: { not: 'CANCELADA' } },
    select: { dataVencimento: true, status: true, tipo: true },
  })

  for (const l of licencas) {
    const d = diasAte(l.dataVencimento)
    if (l.status === 'VENCIDA' || d < 0) {
      fatores.push({ descricao: `Licença ${l.tipo} vencida`, pontos: 35 }); score += 35
    } else if (d <= 30) {
      fatores.push({ descricao: `Licença ${l.tipo} vence em ${d} dias`, pontos: 20 }); score += 20
    } else if (d <= 90) {
      fatores.push({ descricao: `Licença ${l.tipo} vence em ${d} dias`, pontos: 8 }); score += 8
    }
  }

  // Autos de infração CETESB
  const autosCETESB = await prisma.autoInfracao.count({
    where: { empreendimentoId: empId, orgao: { contains: 'CETESB', mode: 'insensitive' }, status: { notIn: ['ENCERRADO', 'PAGO'] } },
  })
  if (autosCETESB > 0) {
    fatores.push({ descricao: `${autosCETESB} auto(s) de infração CETESB ativo(s)`, pontos: 25 * autosCETESB }); score += 25 * autosCETESB
  }

  // Testes de estanqueidade reprovados / vencidos
  const testesReprovados = await prisma.testeEstanqueidade.count({
    where: { tanque: { empreendimentoId: empId }, resultado: 'REPROVADO' },
  })
  if (testesReprovados > 0) {
    fatores.push({ descricao: `${testesReprovados} teste(s) de estanqueidade reprovado(s)`, pontos: 20 }); score += 20
  }

  const testesVencidos = await prisma.testeEstanqueidade.count({
    where: { tanque: { empreendimentoId: empId }, proximoTeste: { lt: hoje } },
  })
  if (testesVencidos > 0) {
    fatores.push({ descricao: `${testesVencidos} próximo teste de estanqueidade atrasado`, pontos: 15 }); score += 15
  }

  // Campanhas de monitoramento não conformes
  const campNaoConformes = await prisma.campanhaMonitoramento.count({
    where: { empreendimentoId: empId, resultado: 'NAO_CONFORME' },
  })
  if (campNaoConformes > 0) {
    fatores.push({ descricao: `${campNaoConformes} campanha(s) de monitoramento não conforme(s)`, pontos: 15 }); score += 15
  }

  return { score: Math.min(score, 100), fatores }
}

async function calcularANP(empId: string): Promise<{ score: number; fatores: Fator[] }> {
  const fatores: Fator[] = []
  let score = 0

  const hoje = new Date()
  const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30)

  // Bombas com calibração vencida ou vencendo
  const bombasVencidas = await prisma.bombaAbastecimento.count({
    where: { empreendimentoId: empId, status: 'ATIVO', proximaCalibracao: { lt: hoje } },
  })
  if (bombasVencidas > 0) {
    fatores.push({ descricao: `${bombasVencidas} bomba(s) com calibração vencida`, pontos: 30 }); score += 30
  }

  const bombasVencendo = await prisma.bombaAbastecimento.count({
    where: { empreendimentoId: empId, status: 'ATIVO', proximaCalibracao: { gte: hoje, lte: em30 } },
  })
  if (bombasVencendo > 0) {
    fatores.push({ descricao: `${bombasVencendo} bomba(s) com calibração vencendo em 30 dias`, pontos: 15 }); score += 15
  }

  // Autos ANP
  const autosANP = await prisma.autoInfracao.count({
    where: { empreendimentoId: empId, orgao: { contains: 'ANP', mode: 'insensitive' }, status: { notIn: ['ENCERRADO', 'PAGO'] } },
  })
  if (autosANP > 0) {
    fatores.push({ descricao: `${autosANP} auto(s) de infração ANP ativo(s)`, pontos: 25 * autosANP }); score += 25 * autosANP
  }

  // MTRs em aberto há mais de 30 dias
  const limite30 = new Date(hoje); limite30.setDate(limite30.getDate() - 30)
  const mtrsAbertos = await prisma.mTR.count({
    where: { empreendimentoId: empId, status: 'ABERTO', dataEmissao: { lt: limite30 } },
  })
  if (mtrsAbertos > 0) {
    fatores.push({ descricao: `${mtrsAbertos} MTR(s) em aberto há mais de 30 dias`, pontos: 10 }); score += 10
  }

  return { score: Math.min(score, 100), fatores }
}

async function calcularINMETRO(empId: string): Promise<{ score: number; fatores: Fator[] }> {
  const fatores: Fator[] = []
  let score = 0

  const hoje = new Date()
  const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30)
  const em60 = new Date(hoje); em60.setDate(em60.getDate() + 60)

  const bombasVencidas = await prisma.bombaAbastecimento.count({
    where: { empreendimentoId: empId, status: 'ATIVO', proximaCalibracao: { lt: hoje } },
  })
  if (bombasVencidas > 0) {
    fatores.push({ descricao: `${bombasVencidas} bomba(s) sem certificado INMETRO válido`, pontos: 35 }); score += 35
  }

  const bombasVencendo30 = await prisma.bombaAbastecimento.count({
    where: { empreendimentoId: empId, status: 'ATIVO', proximaCalibracao: { gte: hoje, lte: em30 } },
  })
  if (bombasVencendo30 > 0) {
    fatores.push({ descricao: `${bombasVencendo30} bomba(s) a vencer em 30 dias`, pontos: 20 }); score += 20
  }

  const bombasVencendo60 = await prisma.bombaAbastecimento.count({
    where: { empreendimentoId: empId, status: 'ATIVO', proximaCalibracao: { gt: em30, lte: em60 } },
  })
  if (bombasVencendo60 > 0) {
    fatores.push({ descricao: `${bombasVencendo60} bomba(s) a vencer em 31–60 dias`, pontos: 10 }); score += 10
  }

  const autosINMETRO = await prisma.autoInfracao.count({
    where: { empreendimentoId: empId, orgao: { contains: 'INMETRO', mode: 'insensitive' }, status: { notIn: ['ENCERRADO', 'PAGO'] } },
  })
  if (autosINMETRO > 0) {
    fatores.push({ descricao: `${autosINMETRO} auto(s) de infração INMETRO ativo(s)`, pontos: 20 * autosINMETRO }); score += 20 * autosINMETRO
  }

  return { score: Math.min(score, 100), fatores }
}

async function calcularBOMBEIROS(empId: string): Promise<{ score: number; fatores: Fator[] }> {
  const fatores: Fator[] = []
  let score = 0

  const hoje = new Date()
  const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30)
  const em90 = new Date(hoje); em90.setDate(em90.getDate() + 90)

  const alvaras = await prisma.alvaraUrbanistico.findMany({
    where: { empreendimentoId: empId, tipo: { in: ['AVCB', 'PPCI'] } },
    select: { tipo: true, dataVencimento: true, status: true },
  })

  for (const a of alvaras) {
    if (!a.dataVencimento) continue
    const d = diasAte(a.dataVencimento)
    if (a.status === 'VENCIDA' || d < 0) {
      const pts = a.tipo === 'AVCB' ? 40 : 30
      fatores.push({ descricao: `${a.tipo} vencido`, pontos: pts }); score += pts
    } else if (d <= 30) {
      const pts = a.tipo === 'AVCB' ? 25 : 18
      fatores.push({ descricao: `${a.tipo} vence em ${d} dias`, pontos: pts }); score += pts
    } else if (d <= 90) {
      fatores.push({ descricao: `${a.tipo} vence em ${d} dias`, pontos: 10 }); score += 10
    }
  }

  const autosBombeiros = await prisma.autoInfracao.count({
    where: { empreendimentoId: empId, orgao: { contains: 'BOMBEIRO', mode: 'insensitive' }, status: { notIn: ['ENCERRADO', 'PAGO'] } },
  })
  if (autosBombeiros > 0) {
    fatores.push({ descricao: `${autosBombeiros} auto(s) do Corpo de Bombeiros ativo(s)`, pontos: 20 * autosBombeiros }); score += 20 * autosBombeiros
  }

  return { score: Math.min(score, 100), fatores }
}

// ─── recomendações com Claude ─────────────────────────────────────────────────

async function gerarRecomendacoes(orgao: Orgao, score: number, fatores: Fator[]): Promise<string[]> {
  if (score < 25 || fatores.length === 0) return []

  const fatoresStr = fatores.map((f) => `- ${f.descricao} (+${f.pontos} pts)`).join('\n')
  const prompt = `Você é um especialista em conformidade regulatória para postos de combustíveis no Brasil.

O posto teve score de risco de ${score}/100 para fiscalização pelo órgão ${orgao}.
Fatores que contribuíram:
${fatoresStr}

Liste de 3 a 5 ações concretas e prioritárias para reduzir esse risco. Seja específico e objetivo.
Retorne SOMENTE um array JSON de strings, sem markdown:
["ação 1", "ação 2", "ação 3"]`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content.find((b) => b.type === 'text')?.type === 'text'
      ? (msg.content.find((b) => b.type === 'text') as { type: 'text'; text: string }).text
      : '[]'
    const match = text.match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : []
  } catch {
    return fatores.slice(0, 3).map((f) => `Regularizar: ${f.descricao}`)
  }
}

// ─── job principal ────────────────────────────────────────────────────────────

export async function calcularScoresRisco(): Promise<void> {
  const empreendimentos = await prisma.empreendimento.findMany({
    where: { ativo: true },
    select: { id: true, tenantId: true, nome: true },
  })

  console.log(`[risco] Calculando scores para ${empreendimentos.length} empreendimento(s)...`)

  const orgaos: Orgao[] = ['CETESB', 'ANP', 'INMETRO', 'BOMBEIROS']
  const calculos: Record<Orgao, (id: string) => Promise<{ score: number; fatores: Fator[] }>> = {
    CETESB: calcularCETESB,
    ANP: calcularANP,
    INMETRO: calcularINMETRO,
    BOMBEIROS: calcularBOMBEIROS,
  }

  for (const emp of empreendimentos) {
    for (const orgao of orgaos) {
      try {
        const { score, fatores } = await calculos[orgao](emp.id)
        const nivel = nivelFromScore(score)
        const recomendacoes = await gerarRecomendacoes(orgao, score, fatores)

        await prisma.scoreRisco.upsert({
          where: { empreendimentoId_orgao: { empreendimentoId: emp.id, orgao } },
          update: { score, nivel, fatores: fatores as object[], recomendacoes, calculadoEm: new Date(), tenantId: emp.tenantId },
          create: { empreendimentoId: emp.id, tenantId: emp.tenantId, orgao, score, nivel, fatores: fatores as object[], recomendacoes },
        })
      } catch (err) {
        console.error(`[risco] Erro ao calcular ${orgao} para ${emp.nome}:`, err instanceof Error ? err.message : err)
      }
    }
    console.log(`[risco] ${emp.nome} ✓`)
  }

  console.log('[risco] Cálculo concluído.')
}
