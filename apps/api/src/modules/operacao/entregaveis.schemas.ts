import { z } from 'zod'
import { STATUS_ENTREGAVEL, TIPO_ENTREGAVEL } from './entregaveis.types.js'

export const statusEntregavelSchema = z.enum(STATUS_ENTREGAVEL)
export const tipoEntregavelSchema = z.enum(TIPO_ENTREGAVEL)

export const criarEntregavelSchema = z.object({
  ordemServicoId: z.string().uuid(),
  tipo: tipoEntregavelSchema,
  titulo: z.string().trim().min(1).max(255),
  descricao: z.string().trim().max(5000).nullable().optional(),
})

export const cancelarEntregavelSchema = z
  .object({})
  .strict()
  .refine(() => true, {
    message: 'Requisição inválida.',
  })

export const filtrosEntregavelSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: statusEntregavelSchema.optional(),
  tipo: tipoEntregavelSchema.optional(),
  ordemServicoId: z.string().uuid().optional(),
  contratoId: z.string().uuid().optional(),
  empreendimentoId: z.string().uuid().optional(),
  busca: z.string().trim().max(255).optional(),
})

export const entregavelResumoSchema = z.object({
  id: z.string().uuid(),
  numero: z.string(),
  status: statusEntregavelSchema,
  tipo: tipoEntregavelSchema,
  ordemServicoId: z.string().uuid(),
  osNumero: z.string().nullable(),
  contratoId: z.string().uuid().nullable(),
  empreendimentoId: z.string().uuid(),
  empreendimentoNome: z.string().nullable(),
  titulo: z.string(),
  s3Key: z.string().nullable(),
  nomeArquivo: z.string().nullable(),
  tamanhoBytes: z.number().int().nullable(),
  geradoEm: z.date().nullable(),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
})

export const entregavelDetalheSchema = entregavelResumoSchema.extend({
  descricao: z.string().nullable(),
  erroMsg: z.string().nullable(),
  canceladoEm: z.date().nullable(),
  criadoPorId: z.string().uuid(),
  atualizadoPorId: z.string().uuid().nullable(),
})

export const entregavelKpisSchema = z.object({
  totalPendentes: z.number().int().nonnegative(),
  totalDisponiveis: z.number().int().nonnegative(),
  totalCadastrados: z.number().int().nonnegative(),
})
