import { z } from 'zod'
import { dataSchema, paginacaoSchema, uuidSchema } from './common.schema.js'
import { StatusDocumento } from '@repo/types'

export const criarDocumentoSchema = z.object({
  empreendimentoId: uuidSchema,
  tipoDocumentoId: uuidSchema,
  processoId: uuidSchema.optional(),
  condicionanteId: uuidSchema.optional(),
  nome: z.string().min(2).max(300),
  descricao: z.string().max(1000).optional(),
  dataEmissao: dataSchema.optional(),
  dataValidade: dataSchema.optional(),
  orgaoEmissor: z.string().max(200).optional(),
  alertaDiasAntes: z.array(z.number().int().min(1)).optional(),
})

export const atualizarDocumentoSchema = criarDocumentoSchema.omit({ empreendimentoId: true }).partial()

export const filtrosDocumentoSchema = paginacaoSchema.extend({
  empreendimentoId: uuidSchema.optional(),
  processoId: uuidSchema.optional(),
  tipoDocumentoId: uuidSchema.optional(),
  status: z.nativeEnum(StatusDocumento).optional(),
  vencimentoDe: dataSchema.optional(),
  vencimentoAte: dataSchema.optional(),
  busca: z.string().optional(),
  vencendoEm: z.coerce.number().int().min(1).optional(), // Vencendo em N dias
})

// Chamado antes do upload ao S3 — retorna presigned URL
export const solicitarUploadUrlSchema = z.object({
  documentoId: uuidSchema,
  nomeArquivo: z.string().min(1).max(255),
  mimeType: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ], { message: 'Tipo de arquivo não suportado' }),
  tamanhoBytes: z.number().int().min(1).max(50 * 1024 * 1024), // Máx. 50MB
  hashSha256: z.string().length(64, 'Hash SHA-256 inválido'),
})

// Chamado após upload ao S3 — confirma a versão
export const confirmarUploadSchema = z.object({
  documentoId: uuidSchema,
  chaveS3: z.string().min(1),
  observacoesEnvio: z.string().max(500).optional(),
})

export const reprovarVersaoSchema = z.object({
  motivoRejeicao: z
    .string()
    .min(10, 'Descreva o motivo da rejeição (mín. 10 caracteres)')
    .max(1000),
})

export type CriarDocumentoInput = z.infer<typeof criarDocumentoSchema>
export type AtualizarDocumentoInput = z.infer<typeof atualizarDocumentoSchema>
export type FiltrosDocumentoInput = z.infer<typeof filtrosDocumentoSchema>
export type SolicitarUploadUrlInput = z.infer<typeof solicitarUploadUrlSchema>
export type ConfirmarUploadInput = z.infer<typeof confirmarUploadSchema>
export type ReprovarVersaoInput = z.infer<typeof reprovarVersaoSchema>
