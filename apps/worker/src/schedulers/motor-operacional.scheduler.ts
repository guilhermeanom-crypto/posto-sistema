import { Queue } from 'bullmq'
import { prisma } from '../infra/prisma.js'
import { redis } from '../infra/redis.js'
import { calcularScoreCriticidade, deveEscalar } from '../services/criticidade.service.js'
import { rotearTarefa } from '../services/roteamento.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR OPERACIONAL SCHEDULER
// Roda diariamente para:
// 1. Recalcular scoreCriticidade de todas as tarefas abertas
// 2. Escalar tarefas que ficaram sem ação por tempo demais
// 3. Rotear tarefas que estão sem responsável
// ─────────────────────────────────────────────────────────────────────────────

const alertaQueue = new Queue('alertas', { connection: redis })

export async function recalcularMotorOperacional(): Promise<void> {
  const agora = new Date()

  // 1. Buscar todas as tarefas abertas
  const tarefas = await prisma.tarefa.findMany({
    where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] } },
    select: {
      id: true,
      tenantId: true,
      empreendimentoId: true,
      origem: true,
      dataVencimento: true,
      atualizadoEm: true,
      responsavelId: true,
      escaladoParaId: true,
      dataEscalonamento: true,
      scoreCriticidade: true,
    },
  })

  let recalculados = 0
  let escalados = 0
  let roteados = 0

  for (const tarefa of tarefas) {
    // 2. Recalcular score
    const novoScore = calcularScoreCriticidade({
      origem: tarefa.origem,
      dataVencimento: tarefa.dataVencimento,
      atualizadoEm: tarefa.atualizadoEm,
    })

    const updates: Record<string, unknown> = {}

    if (novoScore !== tarefa.scoreCriticidade) {
      updates.scoreCriticidade = novoScore
      recalculados++
    }

    // 3. Rotear tarefas sem responsável
    if (!tarefa.responsavelId) {
      const responsavelId = await rotearTarefa(tarefa.tenantId, tarefa.empreendimentoId, tarefa.origem)
      if (responsavelId) {
        updates.responsavelId = responsavelId
        roteados++

        // Notificar o novo responsável
        await alertaQueue.add('alerta-tarefa-roteada', {
          tenantId: tarefa.tenantId,
          empreendimentoId: tarefa.empreendimentoId,
          tipo: 'TAREFA_ATRIBUIDA',
          nivel: novoScore > 70 ? 'ALTO' : 'MEDIO',
          titulo: 'Tarefa atribuída automaticamente',
          mensagem: `Uma tarefa foi atribuída a você pelo sistema de roteamento.`,
          entidadeTipo: 'tarefa',
          entidadeId: tarefa.id,
          destinatarioIds: [responsavelId],
          canais: ['app'],
        })
      }
    }

    // 4. Escalar tarefas com inação
    if (tarefa.responsavelId && !tarefa.dataEscalonamento && deveEscalar(novoScore, tarefa.atualizadoEm)) {
      // Buscar coordenador do empreendimento
      const coordenador = await prisma.empreendimentoAcesso.findFirst({
        where: { empreendimentoId: tarefa.empreendimentoId },
        include: { usuario: { select: { id: true, perfil: true, ativo: true } } },
      })

      const escaladoPara = coordenador?.usuario.ativo
        ? coordenador.usuario
        : await prisma.usuario.findFirst({
            where: { tenantId: tarefa.tenantId, ativo: true, perfil: { in: ['COORDENADOR', 'ADMIN_TENANT'] as never[] } },
            select: { id: true },
          })

      if (escaladoPara && escaladoPara.id !== tarefa.responsavelId) {
        updates.escaladoParaId = escaladoPara.id
        updates.dataEscalonamento = agora
        escalados++

        await alertaQueue.add('alerta-tarefa-escalada', {
          tenantId: tarefa.tenantId,
          empreendimentoId: tarefa.empreendimentoId,
          tipo: 'ESCALONAMENTO_TAREFA',
          nivel: 'ALTO',
          titulo: 'Tarefa escalada por inação',
          mensagem: `Uma tarefa com score de criticidade ${novoScore} foi escalada para você por inação do responsável original.`,
          entidadeTipo: 'tarefa',
          entidadeId: tarefa.id,
          destinatarioIds: [escaladoPara.id],
          canais: ['app', 'email'],
        })
      }
    }

    // 5. Persistir updates se houver mudanças
    if (Object.keys(updates).length > 0) {
      await prisma.tarefa.update({
        where: { id: tarefa.id },
        data: updates as never,
      })
    }
  }

  console.log(`[motor-operacional] ${tarefas.length} tarefas processadas — ${recalculados} scores recalculados, ${roteados} roteados, ${escalados} escalados`)
}
