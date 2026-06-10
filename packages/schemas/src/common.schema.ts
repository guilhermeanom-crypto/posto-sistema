import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVOS COMPARTILHADOS
// ─────────────────────────────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid({ message: 'ID inválido' })

export const cnpjSchema = z
  .string()
  .regex(/^\d{14}$/, 'CNPJ deve conter 14 dígitos numéricos')

export const cepSchema = z
  .string()
  .regex(/^\d{8}$/, 'CEP deve conter 8 dígitos numéricos')

export const estadoUfSchema = z.enum([
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const, { message: 'UF inválida' })

export const dataIsoSchema = z
  .string()
  .datetime({ message: 'Data e hora inválidas. Use o formato ISO 8601 (ex: 2024-03-15T14:30:00Z)' })

export const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato YYYY-MM-DD')

export const emailSchema = z
  .string()
  .email({ message: 'E-mail inválido' })
  .toLowerCase()

export const senhaSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve ter ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve ter ao menos um número')

// ─────────────────────────────────────────────────────────────────────────────
// PAGINAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

export const paginacaoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
})

export type PaginacaoParams = z.infer<typeof paginacaoSchema>
