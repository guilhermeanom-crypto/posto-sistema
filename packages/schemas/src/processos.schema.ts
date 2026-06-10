import { z } from 'zod'
import { dataSchema, paginacaoSchema, uuidSchema } from './common.schema.js'
import { StatusProcesso } from '@repo/types'

export const criarProcessoSchema = z.object({
  empreendimentoId: uuidSchema,
  tipoProcessoId: uuidSchema,
  numeroProtocolo: z.string().max(100).optional(),
  numeroLicenca: z.string().max(100).optional(),
  dataAbertura: dataSchema.optional(),
  dataProtocolo: dataSchema.optional(),
  dataVencimento: dataSchema.optional(),
  responsavelId: uuidSchema.optional(),
  observacoes: z.string().max(2000).optional(),
  metadados: z.record(z.unknown()).optional(),
})

export const atualizarProcessoSchema = criarProcessoSchema.omit({ empreendimentoId: true }).partial()

export const alterarStatusProcessoSchema = z.object({
  status: z.nativeEnum(StatusProcesso),
  observacoes: z.string().max(2000).optional(),
})

export const avancarFaseProcessoSchema = z.object({
  observacoes: z.string().max(2000).optional(),
  forcar: z.boolean().default(false), // Permite avançar com requisitos pendentes (requer COORDENADOR)
})

export const filtrosProcessoSchema = paginacaoSchema.extend({
  empreendimentoId: uuidSchema.optional(),
  status: z.nativeEnum(StatusProcesso).optional(),
  orgaoId: uuidSchema.optional(),
  responsavelId: uuidSchema.optional(),
  vencimentoDe: dataSchema.optional(),
  vencimentoAte: dataSchema.optional(),
  busca: z.string().optional(),
})

export const dispensarRequisitoSchema = z.object({
  motivoDispensa: z.string().min(10, 'Descreva o motivo da dispensa (mín. 10 caracteres)').max(500),
})

export type CriarProcessoInput = z.infer<typeof criarProcessoSchema>
export type AtualizarProcessoInput = z.infer<typeof atualizarProcessoSchema>
export type AlterarStatusProcessoInput = z.infer<typeof alterarStatusProcessoSchema>
export type AvancarFaseProcessoInput = z.infer<typeof avancarFaseProcessoSchema>
export type FiltrosProcessoInput = z.infer<typeof filtrosProcessoSchema>
export type DispensarRequisitoInput = z.infer<typeof dispensarRequisitoSchema>
