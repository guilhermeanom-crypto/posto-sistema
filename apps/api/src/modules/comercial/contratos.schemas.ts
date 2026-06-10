import { z } from 'zod'
import { STATUS_CONTRATO } from './contratos.types.js'

export const statusContratoSchema = z.enum(STATUS_CONTRATO)

export const contratoItemSnapshotSchema = z.object({
  itemPropostaId: z.string().uuid(),
  codigoServico: z.string(),
  nomeServico: z.string(),
  categoriaServico: z.string(),
  quantidade: z.number().int().positive(),
  precoAplicadoUnitario: z.number().nonnegative(),
  valorAplicadoLinha: z.number().nonnegative(),
})

export const criarContratoSchema = z.object({
  handoffComercialId: z.string().uuid(),
  objeto: z.string().trim().min(1).max(2000),
  dataInicioVigencia: z.string().date(),
  dataFimVigencia: z.string().date().nullable().optional(),
  diaVencimento: z.number().int().min(1).max(28),
  observacoesContratuais: z.string().trim().max(5000).nullable().optional(),
  observacoesInternas: z.string().trim().max(5000).nullable().optional(),
})

export const atualizarContratoSchema = z
  .object({
    status: statusContratoSchema.optional(),
    dataFimVigencia: z.string().date().nullable().optional(),
    observacoesContratuais: z.string().trim().max(5000).nullable().optional(),
    observacoesInternas: z.string().trim().max(5000).nullable().optional(),
    motivoEncerramento: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Informe ao menos um campo permitido para atualização do contrato.',
  })

export const filtrosContratoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: statusContratoSchema.optional(),
  empreendimentoId: z.string().uuid().optional(),
  handoffComercialId: z.string().uuid().optional(),
  busca: z.string().trim().min(1).optional(),
})

export const contratoResumoSchema = z.object({
  id: z.string().uuid(),
  numero: z.string(),
  status: statusContratoSchema,
  handoffComercialId: z.string().uuid(),
  propostaComercialId: z.string().uuid(),
  empreendimentoId: z.string().uuid().nullable(),
  empreendimentoNome: z.string().nullable(),
  empreendimentoCidade: z.string().nullable(),
  empreendimentoEstado: z.string().nullable(),
  nomeLead: z.string().nullable(),
  empresaLead: z.string().nullable(),
  objeto: z.string(),
  dataInicioVigencia: z.date(),
  dataFimVigencia: z.date().nullable(),
  diaVencimento: z.number().int(),
  valorMensal: z.number(),
  valorTotalEstimado: z.number().nullable(),
  moeda: z.string(),
  criadoEm: z.date(),
  atualizadoEm: z.date(),
})

export const contratoDetalheSchema = contratoResumoSchema.extend({
  observacoesContratuais: z.string().nullable(),
  observacoesInternas: z.string().nullable(),
  motivoEncerramento: z.string().nullable(),
  itensSnapshot: z.array(contratoItemSnapshotSchema),
  ativadoEm: z.date().nullable(),
  suspensoEm: z.date().nullable(),
  encerradoEm: z.date().nullable(),
  canceladoEm: z.date().nullable(),
  criadoPorId: z.string().uuid(),
  atualizadoPorId: z.string().uuid().nullable(),
})

export const contratoKpisSchema = z.object({
  totalAtivos: z.number().int().nonnegative(),
  totalCadastrados: z.number().int().nonnegative(),
  mrr: z.number().nonnegative(),
  moeda: z.string(),
})
