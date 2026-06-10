import { ConflictError } from '../../shared/errors/app-errors.js'
import type { StatusHandoffComercial } from './handoffs.types.js'

export const STATUS_TRANSITIONS: Record<StatusHandoffComercial, StatusHandoffComercial[]> = {
  AGUARDANDO_HANDOFF: ['EM_TRIAGEM_OPERACIONAL', 'CANCELADO'],
  EM_TRIAGEM_OPERACIONAL: ['AGUARDANDO_DOCUMENTOS', 'EM_PLANEJAMENTO', 'CANCELADO'],
  AGUARDANDO_DOCUMENTOS: ['EM_TRIAGEM_OPERACIONAL', 'EM_PLANEJAMENTO', 'CANCELADO'],
  EM_PLANEJAMENTO: ['EM_EXECUCAO', 'PAUSADO', 'CANCELADO'],
  EM_EXECUCAO: ['PAUSADO', 'CONCLUIDO', 'CANCELADO'],
  PAUSADO: ['EM_TRIAGEM_OPERACIONAL', 'EM_PLANEJAMENTO', 'EM_EXECUCAO', 'CANCELADO'],
  CANCELADO: [],
  CONCLUIDO: [],
}

export function assertTransicaoStatusPermitida(
  statusAtual: StatusHandoffComercial,
  proximoStatus: StatusHandoffComercial,
) {
  if (statusAtual === proximoStatus) return

  if (!STATUS_TRANSITIONS[statusAtual].includes(proximoStatus)) {
    throw new ConflictError(
      `Transição de status "${statusAtual}" para "${proximoStatus}" não é permitida para o handoff comercial.`,
      'HANDOFF_STATUS_TRANSICAO_INVALIDA',
    )
  }
}

export function assertPodeAceitarHandoffOperacional(params: {
  statusAtual: StatusHandoffComercial
  proximoStatus: StatusHandoffComercial
  responsavelOperacionalId: string | null
  pendenciasOperacionais: string[]
}) {
  if (params.proximoStatus !== 'EM_PLANEJAMENTO') return
  if (params.statusAtual === 'EM_PLANEJAMENTO') return

  if (params.statusAtual === 'CANCELADO' || params.statusAtual === 'CONCLUIDO') {
    throw new ConflictError(
      'A transição para preparação não é permitida a partir do status atual do handoff.',
      'HANDOFF_ACEITE_TRANSICAO_INVALIDA',
    )
  }

  if (!STATUS_TRANSITIONS[params.statusAtual].includes('EM_PLANEJAMENTO')) {
    throw new ConflictError(
      'A transição para preparação não é permitida a partir do status atual do handoff.',
      'HANDOFF_ACEITE_TRANSICAO_INVALIDA',
    )
  }

  if (!params.responsavelOperacionalId) {
    throw new ConflictError(
      'Defina um responsável operacional antes de aceitar este handoff.',
      'HANDOFF_ACEITE_SEM_RESPONSAVEL',
    )
  }

  if (params.pendenciasOperacionais.length > 0) {
    throw new ConflictError(
      'Resolva ou remova as pendências operacionais antes de avançar para preparação.',
      'HANDOFF_ACEITE_COM_PENDENCIAS',
    )
  }
}
