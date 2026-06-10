import { ServicoCatalogo } from '@prisma/client'

export type ServicoCatalogoPublico = Omit<
  ServicoCatalogo,
  | 'custoInternoEstimado'
  | 'margemLucroAlvo'
  | 'valorReferenciaHora'
  | 'metadata'
  | 'atualizadoEm'
>

export type ServicoCatalogoAdmin = ServicoCatalogo

export interface FiltrosCatalogo {
  categoria?: string
  busca?: string
  recorrente?: boolean
  page?: number
  limit?: number
}
