import { z } from 'zod'
import { dataSchema, uuidSchema } from './common.schema.js'
import { PeriodicidadeCondicionante, TipoCondicionante } from '@repo/types'

const condicionanteBaseSchema = z.object({
  empreendimentoId: uuidSchema,
  processoId: uuidSchema.optional(),
  descricao: z.string().min(10, 'Descreva a condicionante').max(2000),
  numeroCondicionante: z.string().max(50).optional(),
  tipo: z.nativeEnum(TipoCondicionante),
  periodicidade: z.nativeEnum(PeriodicidadeCondicionante),
  intervaloDias: z.number().int().min(1).optional(),
  prazoCumprimento: dataSchema.optional(),
  evidenciaExigida: z.string().max(500).optional(),
  responsavelId: uuidSchema.optional(),
  gerarTarefaAuto: z.boolean().default(true),
  diasAlertaAntes: z.array(z.number().int().min(1)).default([30, 15, 7]),
})

export const criarCondicionanteSchema = condicionanteBaseSchema
  .refine(
    (data) => {
      if (data.periodicidade === PeriodicidadeCondicionante.PERSONALIZADA) {
        return data.intervaloDias !== undefined && data.intervaloDias > 0
      }
      return true
    },
    {
      message: 'Informe o intervalo em dias para periodicidade personalizada',
      path: ['intervaloDias'],
    },
  )
  .refine(
    (data) => {
      if (data.periodicidade === PeriodicidadeCondicionante.UNICA) {
        return data.prazoCumprimento !== undefined
      }
      return true
    },
    {
      message: 'Informe o prazo de cumprimento para condicionante única',
      path: ['prazoCumprimento'],
    },
  )

export const atualizarCondicionanteSchema = condicionanteBaseSchema.omit({ processoId: true }).partial()

export const cumpirCondicionanteSchema = z.object({
  documentoEvidenciaId: uuidSchema.optional(),
  observacoes: z.string().max(1000).optional(),
})

export const dispensarCondicionanteSchema = z.object({
  motivoDispensa: z
    .string()
    .min(20, 'Descreva detalhadamente o motivo da dispensa (mín. 20 caracteres)')
    .max(1000),
})

export type CriarCondicionanteInput = z.infer<typeof criarCondicionanteSchema>
export type AtualizarCondicionanteInput = z.infer<typeof atualizarCondicionanteSchema>
export type CumprirCondicionanteInput = z.infer<typeof cumpirCondicionanteSchema>
export type DispensarCondicionanteInput = z.infer<typeof dispensarCondicionanteSchema>
