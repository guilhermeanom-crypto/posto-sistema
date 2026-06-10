import { z } from 'zod'
import { emailSchema, senhaSchema, uuidSchema } from './common.schema.js'
import { PerfilUsuario } from '@repo/types'

export const criarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(200),
  email: emailSchema,
  senha: senhaSchema,
  perfil: z.nativeEnum(PerfilUsuario),
  telefone: z.string().max(20).optional(),
  empreendimentoIds: z.array(uuidSchema).optional(), // Para analistas
})

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(2).max(200).optional(),
  telefone: z.string().max(20).optional(),
  configuracoes: z.record(z.unknown()).optional(),
})

export const alterarPerfilUsuarioSchema = z.object({
  perfil: z.nativeEnum(PerfilUsuario),
  empreendimentoIds: z.array(uuidSchema).optional(),
})

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1),
    novaSenha: senhaSchema,
    confirmacaoNovaSenha: z.string(),
  })
  .refine((data) => data.novaSenha === data.confirmacaoNovaSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmacaoNovaSenha'],
  })

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>
export type AlterarPerfilUsuarioInput = z.infer<typeof alterarPerfilUsuarioSchema>
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>
