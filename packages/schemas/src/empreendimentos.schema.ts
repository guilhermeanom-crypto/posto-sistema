import { z } from 'zod'
import { cepSchema, cnpjSchema, emailSchema, estadoUfSchema, paginacaoSchema, uuidSchema } from './common.schema.js'

export const criarEmpreendimentoSchema = z.object({
  empresaId: uuidSchema,
  nome: z.string().min(2, 'Nome muito curto').max(200),
  nomeFantasia: z.string().max(200).optional(),
  cnpj: cnpjSchema.optional(),
  codigoInterno: z.string().max(50).optional(),
  bandeira: z.string().max(100).optional(),
  tipo: z.enum(['revendedor', 'distribuidor', 'transportador', 'outros']).optional(),
  logradouro: z.string().min(2).max(300),
  numero: z.string().min(1).max(20),
  complemento: z.string().max(100).optional(),
  bairro: z.string().min(2).max(100),
  cidade: z.string().min(2).max(100),
  estado: estadoUfSchema,
  cep: cepSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  responsavelTecnicoNome: z.string().max(200).optional(),
  responsavelTecnicoCrea: z.string().max(50).optional(),
  responsavelTecnicoEmail: emailSchema.optional(),
  contatoEmail: emailSchema.optional(),
  contatoTelefone: z.string().max(20).optional(),
  atividades: z
    .array(z.string())
    .min(1, 'Ao menos uma atividade deve ser informada'),
  dataInicioOperacao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional(),
})

export const atualizarEmpreendimentoSchema = criarEmpreendimentoSchema
  .omit({ empresaId: true })
  .partial()

export const filtrosEmpreendimentoSchema = paginacaoSchema.extend({
  busca: z.string().optional(),
  estado: estadoUfSchema.optional(),
  cidade: z.string().optional(),
  bandeira: z.string().optional(),
  ativo: z.coerce.boolean().optional(),
  statusCompliance: z.enum(['REGULAR', 'ATENCAO', 'CRITICO', 'EMERGENCIA']).optional(),
})

export type CriarEmpreendimentoInput = z.infer<typeof criarEmpreendimentoSchema>
export type AtualizarEmpreendimentoInput = z.infer<typeof atualizarEmpreendimentoSchema>
export type FiltrosEmpreendimentoInput = z.infer<typeof filtrosEmpreendimentoSchema>
