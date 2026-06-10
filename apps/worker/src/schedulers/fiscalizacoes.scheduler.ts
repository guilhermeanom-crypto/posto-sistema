import { Queue } from 'bullmq'
import { prisma } from '../infra/prisma.js'
import { redis } from '../infra/redis.js'
import { criarTarefaAutomatica } from '../services/tarefa-auto.service.js'
import { logger } from "../lib/logger.js"

// ─────────────────────────────────────────────────────────────────────────────
// FISCALIZAÇÕES SCHEDULER
// Verifica prazos de defesa e de recurso em autos de infração.
// Cria alertas e tarefas para itens com prazo crítico.
// ─────────────────────────────────────────────────────────────────────────────

const alertaQueue = new Queue('alertas', { connection: redis })

const DIAS_ALERTA = [30, 15, 7, 3, 1]

export async function verificarPrazosDefesa(): Promise<void> {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // ── Prazos de defesa ──────────────────────────────────────────────────────
  for (const dias of DIAS_ALERTA) {
    const alvo = new Date(hoje)
    alvo.setDate(alvo.getDate() + dias)
    const alvoFim = new Date(alvo.getTime() + 86400000)

    const autos = await prisma.autoInfracao.findMany({
      where: {
        status: { in: ['RECEBIDO', 'EM_DEFESA'] as never[] },
        prazoDefesa: { gte: alvo, lt: alvoFim },
      },
      include: {
        empreendimento: { select: { id: true, nome: true, tenantId: true } },
      },
    })

    for (const auto of autos) {
      const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'

      await alertaQueue.add('alerta-prazo-defesa', {
        tenantId: auto.tenantId,
        empreendimentoId: auto.empreendimentoId,
        tipo: 'COMPLIANCE_CRITICO',
        nivel,
        titulo: `Prazo de defesa em ${dias} dia${dias !== 1 ? 's' : ''}`,
        mensagem: `Auto ${auto.numeroAuto} (${auto.orgao}) em ${auto.empreendimento.nome} — prazo de defesa vence em ${dias} dia${dias !== 1 ? 's' : ''}.`,
        entidadeTipo: 'autoInfracao',
        entidadeId: auto.id,
        destinatarioIds: [],
        canais: ['app'],
      })
    }
  }

  // ── Prazos de recurso ─────────────────────────────────────────────────────
  for (const dias of DIAS_ALERTA) {
    const alvo = new Date(hoje)
    alvo.setDate(alvo.getDate() + dias)
    const alvoFim = new Date(alvo.getTime() + 86400000)

    const recursos = await prisma.recursoAdministrativo.findMany({
      where: {
        resultado: 'PENDENTE',
        prazoResposta: { gte: alvo, lt: alvoFim },
      },
      include: {
        auto: {
          select: {
            id: true,
            tenantId: true,
            empreendimentoId: true,
            numeroAuto: true,
            orgao: true,
            empreendimento: { select: { nome: true } },
          },
        },
      },
    })

    for (const recurso of recursos) {
      const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'

      await alertaQueue.add('alerta-prazo-recurso', {
        tenantId: recurso.auto.tenantId,
        empreendimentoId: recurso.auto.empreendimentoId,
        tipo: 'COMPLIANCE_CRITICO',
        nivel,
        titulo: `Prazo de recurso ${recurso.instancia} em ${dias} dia${dias !== 1 ? 's' : ''}`,
        mensagem: `Recurso ${recurso.instancia} do auto ${recurso.auto.numeroAuto} (${recurso.auto.orgao}) em ${recurso.auto.empreendimento.nome} — prazo vence em ${dias} dia${dias !== 1 ? 's' : ''}.`,
        entidadeTipo: 'recursoAdministrativo',
        entidadeId: recurso.id,
        destinatarioIds: [],
        canais: ['app'],
      })
    }
  }

  // ── Tarefas automáticas para autos com prazo de defesa vencido ────────────
  const autosVencidos = await prisma.autoInfracao.findMany({
    where: {
      status: { in: ['RECEBIDO', 'EM_DEFESA'] as never[] },
      prazoDefesa: { lt: hoje },
    },
    include: {
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
    },
  })

  for (const auto of autosVencidos) {
    await criarTarefaAutomatica({
      tenantId: auto.tenantId,
      empreendimentoId: auto.empreendimentoId,
      titulo: `Prazo de defesa vencido — Auto ${auto.numeroAuto}`,
      descricao: `Auto de infração ${auto.numeroAuto} (${auto.orgao}) em ${auto.empreendimento.nome} com prazo de defesa vencido. Ação urgente necessária.`,
      origem: 'REGRA_VENCIMENTO_PROC',
      prioridade: 'CRITICA',
      entidadeTipo: 'autoInfracao',
      entidadeId: auto.id,
      dataVencimento: auto.prazoDefesa,
    })
  }

  logger.info(`[scheduler] Prazos de defesa e recurso verificados — ${new Date().toISOString()}`)
}
