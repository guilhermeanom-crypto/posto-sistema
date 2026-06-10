import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/errors/app-errors.js'
import {
  assertPodeAceitarHandoffOperacional,
  assertTransicaoStatusPermitida,
} from './handoffs-rules.js'

describe('handoffs-rules', () => {
  it('permite manter o mesmo status sem lançar erro', () => {
    expect(() => assertTransicaoStatusPermitida('EM_EXECUCAO', 'EM_EXECUCAO')).not.toThrow()
  })

  it('permite transições válidas do fluxo operacional', () => {
    expect(() => assertTransicaoStatusPermitida('AGUARDANDO_HANDOFF', 'EM_TRIAGEM_OPERACIONAL')).not.toThrow()
    expect(() => assertTransicaoStatusPermitida('EM_EXECUCAO', 'CONCLUIDO')).not.toThrow()
  })

  it('bloqueia transições inválidas com erro de conflito explícito', () => {
    try {
      assertTransicaoStatusPermitida('AGUARDANDO_HANDOFF', 'CONCLUIDO')
      throw new Error('A transição deveria ter falhado')
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).code).toBe('HANDOFF_STATUS_TRANSICAO_INVALIDA')
      expect((error as AppError).statusCode).toBe(409)
    }
  })

  it('exige responsável operacional para aceitar o handoff', () => {
    expect(() =>
      assertPodeAceitarHandoffOperacional({
        statusAtual: 'EM_TRIAGEM_OPERACIONAL',
        proximoStatus: 'EM_PLANEJAMENTO',
        responsavelOperacionalId: null,
        pendenciasOperacionais: [],
      }),
    ).toThrow('Defina um responsável operacional')
  })

  it('bloqueia aceite quando há pendências operacionais', () => {
    expect(() =>
      assertPodeAceitarHandoffOperacional({
        statusAtual: 'AGUARDANDO_DOCUMENTOS',
        proximoStatus: 'EM_PLANEJAMENTO',
        responsavelOperacionalId: 'resp-1',
        pendenciasOperacionais: ['Checklist pendente'],
      }),
    ).toThrow('Resolva ou remova as pendências operacionais')
  })

  it('permite aceite quando a transição está pronta', () => {
    expect(() =>
      assertPodeAceitarHandoffOperacional({
        statusAtual: 'AGUARDANDO_DOCUMENTOS',
        proximoStatus: 'EM_PLANEJAMENTO',
        responsavelOperacionalId: 'resp-1',
        pendenciasOperacionais: [],
      }),
    ).not.toThrow()
  })
})
