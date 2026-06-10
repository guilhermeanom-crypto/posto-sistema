import { prisma } from '../infra/prisma.js'
import { calcularScoreCriticidade } from './criticidade.service.js'
import { rotearTarefa } from './roteamento.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// TAREFA AUTO SERVICE
// Cria Tarefas (pendências) automaticamente a partir de vencimentos detectados
// pelo scheduler. Garante idempotência: não cria duplicata se já existe tarefa
// aberta para a mesma entidade + origem.
// Agora com: score de criticidade calculado + roteamento automático.
// ─────────────────────────────────────────────────────────────────────────────

type PrioridadeTarefa = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
type OrigemTarefa =
  | 'REGRA_VENCIMENTO_DOC'
  | 'REGRA_VENCIMENTO_PROC'
  | 'REGRA_CONDICIONANTE'
  | 'REGRA_VENCIMENTO_SST'
  | 'REGRA_VENCIMENTO_ESTANQUEIDADE'
  | 'REGRA_VENCIMENTO_ANP'
  | 'REGRA_VENCIMENTO_OUTORGA'
  | 'REGRA_VENCIMENTO_LICENCA'
  | 'REGRA_VENCIMENTO_PGRS'

interface CriarTarefaAutoInput {
  tenantId: string
  empreendimentoId: string
  titulo: string
  descricao: string
  origem: OrigemTarefa
  prioridade: PrioridadeTarefa
  /** Tipo da entidade de origem (ex: 'licencaAmbiental', 'aso') */
  entidadeTipo: string
  /** ID da entidade de origem */
  entidadeId: string
  /** Data de vencimento da obrigação — será a data limite da tarefa */
  dataVencimento: Date
  /** ID do usuário criador (sistema) — usa o primeiro admin do tenant */
  criadorId?: string
}

/**
 * Cria uma Tarefa automática se não existir uma tarefa aberta
 * para a mesma entidade + origem no mesmo tenant.
 *
 * Retorna o ID da tarefa criada, ou null se já existia.
 */
export async function criarTarefaAutomatica(input: CriarTarefaAutoInput): Promise<string | null> {
  // Verificação de idempotência: busca tarefa aberta com mesma origem e entidade
  const existente = await prisma.tarefa.findFirst({
    where: {
      tenantId: input.tenantId,
      empreendimentoId: input.empreendimentoId,
      origem: input.origem as never,
      status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] },
      metadados: {
        path: ['entidadeTipo'],
        equals: input.entidadeTipo,
      },
    },
  })

  // Refina: verifica se é da mesma entidade específica
  if (existente) {
    const meta = existente.metadados as Record<string, unknown> | null
    if (meta && meta.entidadeId === input.entidadeId) {
      return null // já existe tarefa aberta para esta entidade
    }
  }

  // Busca um usuário admin do tenant para ser o criador (sistema)
  const criadorId = input.criadorId ?? await obterCriadorSistema(input.tenantId)
  if (!criadorId) {
    console.warn(`[tarefa-auto] Nenhum admin encontrado para tenant ${input.tenantId} — tarefa não criada`)
    return null
  }

  // Calcular score de criticidade
  const score = calcularScoreCriticidade({
    origem: input.origem,
    dataVencimento: input.dataVencimento,
    atualizadoEm: new Date(),
  })

  // Rotear para o responsável correto
  const responsavelId = await rotearTarefa(input.tenantId, input.empreendimentoId, input.origem)

  const tarefa = await prisma.tarefa.create({
    data: {
      tenantId: input.tenantId,
      empreendimentoId: input.empreendimentoId,
      titulo: input.titulo,
      descricao: input.descricao,
      origem: input.origem as never,
      prioridade: input.prioridade as never,
      status: 'PENDENTE' as never,
      dataVencimento: input.dataVencimento,
      criadorId: criadorId,
      responsavelId: responsavelId,
      scoreCriticidade: score,
      metadados: {
        entidadeTipo: input.entidadeTipo,
        entidadeId: input.entidadeId,
        geradoAutomaticamente: true,
      },
    },
  })

  console.log(`[tarefa-auto] Tarefa criada: ${tarefa.id} — score=${score} — resp=${responsavelId ?? 'NENHUM'} — ${input.titulo}`)
  return tarefa.id
}

/** Cache simples de admin por tenant para evitar queries repetidas na mesma execução */
const cacheAdmin: Record<string, string> = {}

async function obterCriadorSistema(tenantId: string): Promise<string | null> {
  if (cacheAdmin[tenantId]) return cacheAdmin[tenantId]

  const admin = await prisma.usuario.findFirst({
    where: { tenantId, ativo: true, perfil: { in: ['SUPER_ADMIN', 'ADMIN_TENANT'] as never[] } },
    select: { id: true },
    orderBy: { criadoEm: 'asc' },
  })

  if (admin) {
    cacheAdmin[tenantId] = admin.id
  }
  return admin?.id ?? null
}
