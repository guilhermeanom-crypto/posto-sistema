import { z } from 'zod'
import {
  PRIORIDADE_ORDEM_SERVICO,
  STATUS_ORDEM_SERVICO,
  TIPO_ORDEM_SERVICO,
} from './ordens-servico.types.js'

export const statusOrdemServicoSchema = z.enum(STATUS_ORDEM_SERVICO)
export const prioridadeOrdemServicoSchema = z.enum(PRIORIDADE_ORDEM_SERVICO)
export const tipoOrdemServicoSchema = z.enum(TIPO_ORDEM_SERVICO)

const booleanQueryParam = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => (typeof value === 'boolean' ? value : value === 'true'))

export const criarOrdemServicoSchema = z.object({
  contratoId: z.string().uuid(),
  tipo: tipoOrdemServicoSchema,
  titulo: z.string().trim().min(1).max(255),
  escopo: z.string().trim().min(1).max(5000),
  dataPlanejada: z.string().datetime().or(z.string().date()),
  dataPrevistaConclusao: z.string().datetime().or(z.string().date()).nullable().optional(),
  prioridade: prioridadeOrdemServicoSchema.optional(),
  responsavelId: z.string().uuid().nullable().optional(),
  localExecucao: z.string().trim().max(500).nullable().optional(),
  observacoesInternas: z.string().trim().max(5000).nullable().optional(),
})

export const atualizarOrdemServicoSchema = z
  .object({
    status: statusOrdemServicoSchema.optional(),
    prioridade: prioridadeOrdemServicoSchema.optional(),
    tipo: tipoOrdemServicoSchema.optional(),
    responsavelId: z.string().uuid().nullable().optional(),
    titulo: z.string().trim().min(1).max(255).optional(),
    escopo: z.string().trim().min(1).max(5000).optional(),
    localExecucao: z.string().trim().max(500).nullable().optional(),
    observacoesExecucao: z.string().trim().max(5000).nullable().optional(),
    observacoesInternas: z.string().trim().max(5000).nullable().optional(),
    motivoCancelamento: z.string().trim().max(2000).nullable().optional(),
    dataPlanejada: z.string().datetime().or(z.string().date()).optional(),
    dataPrevistaConclusao: z.string().datetime().or(z.string().date()).nullable().optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Informe ao menos um campo permitido para atualização.',
  })

export const filtrosOrdemServicoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: statusOrdemServicoSchema.optional(),
  prioridade: prioridadeOrdemServicoSchema.optional(),
  tipo: tipoOrdemServicoSchema.optional(),
  contratoId: z.string().uuid().optional(),
  empreendimentoId: z.string().uuid().optional(),
  responsavelId: z.string().uuid().optional(),
  apenasMinhas: booleanQueryParam.optional(),
  apenasAbertas: booleanQueryParam.optional(),
})

export const ordemServicoResumoSchema = z.object({
  id: z.string().uuid(),
  numero: z.string(),
  status: statusOrdemServicoSchema,
  tipo: tipoOrdemServicoSchema,
  prioridade: prioridadeOrdemServicoSchema,
  contratoId: z.string().uuid(),
  contratoNumero: z.string().nullable(),
  empreendimentoId: z.string().uuid(),
  empreendimentoNome: z.string().nullable(),
  empreendimentoCidade: z.string().nullable(),
  empreendimentoEstado: z.string().nullable(),
  responsavelId: z.string().uuid().nullable(),
  responsavelNome: z.string().nullable(),
  titulo: z.string(),
  dataPlanejada: z.date(),
  dataPrevistaConclusao: z.date().nullable(),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
})

export const ordemServicoDetalheSchema = ordemServicoResumoSchema.extend({
  escopo: z.string(),
  localExecucao: z.string().nullable(),
  observacoesExecucao: z.string().nullable(),
  observacoesInternas: z.string().nullable(),
  motivoCancelamento: z.string().nullable(),
  dataInicioExecucao: z.date().nullable(),
  dataConclusao: z.date().nullable(),
  dataCancelamento: z.date().nullable(),
  criadoPorId: z.string().uuid(),
  atualizadoPorId: z.string().uuid().nullable(),
})

export const ordemServicoKpisSchema = z.object({
  totalAbertas: z.number().int().nonnegative(),
  totalEmExecucao: z.number().int().nonnegative(),
  totalCriticas: z.number().int().nonnegative(),
  totalConcluidasMes: z.number().int().nonnegative(),
})
