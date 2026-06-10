import { z } from 'zod'
import { emailSchema, senhaSchema } from './common.schema.js'

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'Senha obrigatória'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export const recuperarSenhaSchema = z.object({
  email: emailSchema,
})

export const redefinirSenhaSchema = z
  .object({
    token: z.string().min(1),
    novaSenha: senhaSchema,
    confirmacaoSenha: z.string(),
  })
  .refine((data) => data.novaSenha === data.confirmacaoSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmacaoSenha'],
  })

export const magicLinkSchema = z.object({
  empreendimentoId: z.string().uuid(),
  email: emailSchema,
  nomeContato: z.string().min(2).max(100).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>
