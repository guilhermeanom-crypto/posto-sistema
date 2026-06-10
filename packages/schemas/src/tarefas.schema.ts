import { z } from 'zod'
import { uuidSchema } from './common.schema.js'
import { PrioridadeTarefa, TipoEvidencia } from '@repo/types'

export const criarTarefaSchema = z.object({
  empreendimentoId: uuidSchema,
  processoId: uuidSchema.optional(),
  condicionanteId: uuidSchema.optional(),
  documentoId: uuidSchema.optional(),
  titulo: z.string().min(5).max(300),
  descricao: z.string().max(2000).optional(),
  prioridade: z.nativeEnum(PrioridadeTarefa).default(PrioridadeTarefa.MEDIA),
  responsavelId: uuidSchema.optional(),
  dataVencimento: z.string().datetime().optional(),
  dependencias: z.array(uuidSchema).default([]),
})

export const atualizarTarefaSchema = z.object({
  titulo: z.string().min(5).max(300).optional(),
  descricao: z.string().max(2000).optional(),
  prioridade: z.nativeEnum(PrioridadeTarefa).optional(),
  responsavelId: uuidSchema.optional(),
  dataVencimento: z.string().datetime().optional(),
})

export const concluirTarefaSchema = z.object({
  observacoesConclusao: z.string().max(2000).optional(),
  evidencias: z
    .array(
      z.discriminatedUnion('tipo', [
        z.object({
          tipo: z.literal(TipoEvidencia.TEXTO),
          descricao: z.string().min(1),
          textoLivre: z.string().min(10),
        }),
        z.object({
          tipo: z.literal(TipoEvidencia.LINK),
          descricao: z.string().optional(),
          url: z.string().url('URL inválida'),
        }),
        z.object({
          tipo: z.literal(TipoEvidencia.DOCUMENTO),
          descricao: z.string().optional(),
          documentoVersaoId: uuidSchema,
        }),
      ]),
    )
    .default([]),
})

export const reatribuirTarefaSchema = z.object({
  responsavelId: uuidSchema,
  motivo: z.string().max(500).optional(),
})

export const cancelarTarefaSchema = z.object({
  motivo: z.string().min(5, 'Informe o motivo do cancelamento').max(500),
})

export type CriarTarefaInput = z.infer<typeof criarTarefaSchema>
export type AtualizarTarefaInput = z.infer<typeof atualizarTarefaSchema>
export type ConcluirTarefaInput = z.infer<typeof concluirTarefaSchema>
export type ReatribuirTarefaInput = z.infer<typeof reatribuirTarefaSchema>
export type CancelarTarefaInput = z.infer<typeof cancelarTarefaSchema>
