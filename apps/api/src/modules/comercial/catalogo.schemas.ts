import { z } from 'zod'

export const filtrosCatalogoSchema = z.object({
  categoria: z.string().optional(),
  busca: z.string().optional(),
  recorrente: z.string().transform((val) => val === 'true').optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
})

export const servicoCatalogoPublicoSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  nome: z.string(),
  descricao: z.string(),
  categoria: z.string(),
  subcategoria: z.string().nullable(),
  horasTecnicasBase: z.any(),
  fatorComplexidade: z.any(),
  precoBase: z.any().nullable(),
  precoMinimo: z.any().nullable(),
  precoMaximo: z.any().nullable(),
  recorrente: z.boolean(),
  mesesRecorrencia: z.number().nullable(),
  obrigacaoBaseId: z.string().uuid().nullable(),
  obrigacaoBaseCodigo: z.string().nullable(),
  ativo: z.boolean(),
  criadoEm: z.date(),
})

export const servicoCatalogoAdminSchema = servicoCatalogoPublicoSchema.extend({
  custoInternoEstimado: z.any().nullable(),
  margemLucroAlvo: z.any().nullable(),
  valorReferenciaHora: z.any(),
  metadata: z.any().nullable(),
  atualizadoEm: z.date(),
})
