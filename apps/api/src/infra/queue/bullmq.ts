import { Queue, type ConnectionOptions } from 'bullmq'
import { redis } from '../cache/redis.js'

// ─────────────────────────────────────────────────────────────────────────────
// FILAS BULLMQ — definição centralizada
// ─────────────────────────────────────────────────────────────────────────────

const connection: ConnectionOptions = redis

// Nomes das filas (constantes para evitar typos)
export const QUEUE_NAMES = {
  EMAIL: 'email',
  ALERTAS: 'alertas',
  COMPLIANCE: 'compliance',
  SCHEDULER: 'scheduler',
  AI: 'ia',
  RELATORIO: 'relatorio',
  WHATSAPP: 'whatsapp',
  ENTREGAVEIS: 'entregaveis',
} as const

// Tipos de jobs por fila
export type EmailJobData =
  | { tipo: 'boas_vindas'; usuarioNome: string; email: string }
  | { tipo: 'alerta_vencimento'; email: string; entidade: string; diasRestantes: number; link: string }
  | { tipo: 'documento_rejeitado'; email: string; nome: string; documento: string; motivo: string }
  | { tipo: 'tarefa_atribuida'; email: string; tarefaTitulo: string; dataVencimento?: string; link: string }
  | { tipo: 'magic_link'; email: string; link: string; empreendimento: string; expiresIn: string }
  | { tipo: 'recuperar_senha'; email: string; link: string }

export type AlertaJobData = {
  tenantId: string
  tipo: string
  nivel: string
  titulo: string
  mensagem: string
  empreendimentoId?: string
  entidadeTipo?: string
  entidadeId?: string
  dados?: Record<string, unknown>
  destinatarioIds: string[]
}

export type ComplianceJobData = {
  tenantId: string
  empreendimentoId: string
}

export type SchedulerJobData =
  | { tipo: 'verificar_vencimentos'; tenantId: string }
  | { tipo: 'verificar_condicionantes'; tenantId: string }
  | { tipo: 'verificar_processos_renovacao'; tenantId: string }
  | { tipo: 'escalonar_tarefas_atrasadas'; tenantId: string }
  | { tipo: 'recalcular_compliance_rede'; tenantId: string }
  | { tipo: 'limpar_uploads_temporarios' }
  | Record<string, never>

export type EntregavelJobData = {
  entregavelId: string
  tenantId: string
}

export type AIJobData =
  | { licencaId: string }
  | { autoId: string }

export type RelatorioJobData = {
  relatorioId: string
}

export type WhatsAppJobData =
  | { numero: string; texto: string; tipo?: string; tenantId?: string }
  | { tenantId: string; empreendimentoId: string | null; mensagem: string }
  | { numero: string; mensagem: string }

// Instâncias das filas (usadas pela API para enfileirar jobs)
export const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
})

export const alertaQueue = new Queue<AlertaJobData>(QUEUE_NAMES.ALERTAS, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
})

export const complianceQueue = new Queue<ComplianceJobData>(QUEUE_NAMES.COMPLIANCE, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
})

export const schedulerQueue = new Queue<SchedulerJobData>(QUEUE_NAMES.SCHEDULER, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 20 },
    removeOnFail: { count: 50 },
  },
})

export const aiQueue = new Queue<AIJobData>(QUEUE_NAMES.AI, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
})

export const relatorioQueue = new Queue<RelatorioJobData>(QUEUE_NAMES.RELATORIO, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
})

export const whatsappQueue = new Queue<WhatsAppJobData>(QUEUE_NAMES.WHATSAPP, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
})

export const entregavelQueue = new Queue<EntregavelJobData>(QUEUE_NAMES.ENTREGAVEIS, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
})
