import { EventEmitter } from 'node:events'

// ─────────────────────────────────────────────────────────────────────────────
// EVENT BUS IN-PROCESS
// Serviços emitem domain events → listeners reagem (audit, alertas, compliance)
// Em produção avançada: substituir por RabbitMQ/SQS sem mudar os emitters.
// ─────────────────────────────────────────────────────────────────────────────

export interface DomainEventPayload {
  tenantId: string
  usuarioId?: string
  usuarioNome?: string
  usuarioPerfil?: string
  ipOrigem?: string
  timestamp: Date
}

export interface ProcessoStatusAlteradoEvent extends DomainEventPayload {
  processoId: string
  empreendimentoId: string
  statusAnterior: string
  statusNovo: string
  observacoes?: string
}

export interface ProcessoFaseAvancadaEvent extends DomainEventPayload {
  processoId: string
  empreendimentoId: string
  ordemAnterior: number
  ordemNova: number
  nomeFaseNova: string
}

export interface DocumentoVersaoAprovadaEvent extends DomainEventPayload {
  documentoId: string
  versaoId: string
  empreendimentoId: string
  processoId?: string
}

export interface DocumentoVersaoRejeitadaEvent extends DomainEventPayload {
  documentoId: string
  versaoId: string
  empreendimentoId: string
  motivo: string
}

export interface DocumentoVencidoEvent extends DomainEventPayload {
  documentoId: string
  empreendimentoId: string
  diasVencido: number
}

export interface CondicionanteCumpridaEvent extends DomainEventPayload {
  condicionanteId: string
  processoId: string
  empreendimentoId: string
}

export interface CondicionanteVencidaEvent extends DomainEventPayload {
  condicionanteId: string
  processoId: string
  empreendimentoId: string
}

export interface TarefaCriadaEvent extends DomainEventPayload {
  tarefaId: string
  empreendimentoId: string
  origem: string
  responsavelId?: string
  prioridade: string
}

export interface TarefaConcluidaEvent extends DomainEventPayload {
  tarefaId: string
  empreendimentoId: string
  responsavelId: string
}

export interface TarefaEscalonadaEvent extends DomainEventPayload {
  tarefaId: string
  empreendimentoId: string
  escaladoParaId: string
  motivo?: string
}

// Tipagem dos eventos disponíveis
export interface DomainEvents {
  'processo.status_alterado': [ProcessoStatusAlteradoEvent]
  'processo.fase_avancada': [ProcessoFaseAvancadaEvent]
  'documento.versao_aprovada': [DocumentoVersaoAprovadaEvent]
  'documento.versao_rejeitada': [DocumentoVersaoRejeitadaEvent]
  'documento.vencido': [DocumentoVencidoEvent]
  'condicionante.cumprida': [CondicionanteCumpridaEvent]
  'condicionante.vencida': [CondicionanteVencidaEvent]
  'tarefa.criada': [TarefaCriadaEvent]
  'tarefa.concluida': [TarefaConcluidaEvent]
  'tarefa.escalonada': [TarefaEscalonadaEvent]
}

class TypedEventBus extends EventEmitter {
  override emit<K extends keyof DomainEvents>(event: K, ...args: DomainEvents[K]): boolean {
    return super.emit(event as string, ...args)
  }

  override on<K extends keyof DomainEvents>(
    event: K,
    listener: (...args: DomainEvents[K]) => void,
  ): this {
    return super.on(event as string, listener as (...args: unknown[]) => void)
  }

  override off<K extends keyof DomainEvents>(
    event: K,
    listener: (...args: DomainEvents[K]) => void,
  ): this {
    return super.off(event as string, listener as (...args: unknown[]) => void)
  }
}

export const eventBus = new TypedEventBus()
eventBus.setMaxListeners(50)
