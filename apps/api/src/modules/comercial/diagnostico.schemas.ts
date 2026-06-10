import { z } from 'zod'

export const diagnosticoInputSchema = z.object({
  cnaes: z.array(z.string()).min(1, 'Pelo menos um CNAE é necessário'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
  municipio: z.string().optional(),
  porte: z.enum(['MICRO', 'PEQUENO', 'MEDIO', 'GRANDE', 'MUITO_GRANDE']),
  situacao: z.enum(['PLANEJADO', 'IMPLANTACAO', 'OPERACAO', 'IRREGULAR', 'RENOVACAO']),
  temLicencaAnterior: z.boolean().optional(),
  temOutorgaAnterior: z.boolean().optional()
})

const riscoNivelSchema = z.enum(['BAIXO', 'MEDIO', 'ALTO', 'CRITICO'])
const potencialPoluidorSchema = z.enum(['BAIXO', 'MEDIO', 'ALTO'])
const esferaSchema = z.enum(['MUNICIPAL', 'ESTADUAL', 'FEDERAL'])

export const recomendacaoServicoSchema = z.object({
  servicoId: z.string().uuid(),
  codigo: z.string(),
  nome: z.string(),
  categoria: z.string(),
  decisao: z.enum(['OBRIGATORIO', 'CONDICIONAL', 'OPCIONAL']),
  justificativa: z.string(),
  precoEstimado: z.number(),
  precoMinimo: z.number(),
  precoMaximo: z.number(),
})

export const diagnosticoResultadoSchema = z.object({
  cnaePrincipal: z.object({
    codigo: z.string(),
    descricao: z.string(),
    riscoNivel: riscoNivelSchema,
    potencialPoluidor: potencialPoluidorSchema,
  }),
  enquadramento: z.object({
    licenciamentoTipo: z.string(),
    orgaoCompetente: z.string(),
    esfera: esferaSchema,
  }),
  riscoGeral: z.object({
    score: z.number(),
    nivel: riscoNivelSchema,
    justificativa: z.string(),
  }),
  obrigatoriedades: z.object({
    necessitaEIA: z.boolean(),
    necessitaOutorga: z.boolean(),
    necessitaMonitoramento: z.boolean(),
    principaisImpactos: z.array(z.string()),
  }),
  recomendacoes: z.array(recomendacaoServicoSchema),
  estimativaOrcamento: z.object({
    minimo: z.number(),
    maximo: z.number(),
    recomendado: z.number(),
  }),
  alertas: z.array(z.string()),
  proximosPassos: z.array(z.string()),
})

export type DiagnosticoInputSchema = z.infer<typeof diagnosticoInputSchema>
export type DiagnosticoResultadoSchema = z.infer<typeof diagnosticoResultadoSchema>
