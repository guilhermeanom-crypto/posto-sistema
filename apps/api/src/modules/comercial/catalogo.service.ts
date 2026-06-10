import { prisma } from '../../infra/database/prisma.js'
import { FiltrosCatalogo, ServicoCatalogoPublico, ServicoCatalogoAdmin } from './catalogo.types.js'
import { Prisma } from '@prisma/client'

export const catalogoService = {
  /**
   * Lista serviços para visão pública (sanitizada)
   */
  async listarPublico(filtros: FiltrosCatalogo): Promise<{ items: ServicoCatalogoPublico[]; total: number }> {
    const { page = 1, limit = 20, categoria, busca, recorrente } = filtros
    const skip = (page - 1) * limit

    const where: Prisma.ServicoCatalogoWhereInput = {
      ativo: true,
      ...(categoria && { categoria }),
      ...(recorrente !== undefined && { recorrente }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { codigo: { contains: busca, mode: 'insensitive' } },
          { descricao: { contains: busca, mode: 'insensitive' } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      prisma.servicoCatalogo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          codigo: true,
          nome: true,
          descricao: true,
          categoria: true,
          subcategoria: true,
          horasTecnicasBase: true,
          fatorComplexidade: true,
          precoBase: true,
          precoMinimo: true,
          precoMaximo: true,
          recorrente: true,
          mesesRecorrencia: true,
          obrigacaoBaseId: true,
          obrigacaoBaseCodigo: true,
          ativo: true,
          criadoEm: true,
        },
      }),
      prisma.servicoCatalogo.count({ where }),
    ])

    return { items: items as unknown as ServicoCatalogoPublico[], total }
  },

  /**
   * Lista serviços para visão administrativa (completa)
   */
  async listarAdministrativo(filtros: FiltrosCatalogo): Promise<{ items: ServicoCatalogoAdmin[]; total: number }> {
    const { page = 1, limit = 20, categoria, busca, recorrente } = filtros
    const skip = (page - 1) * limit

    const where: Prisma.ServicoCatalogoWhereInput = {
      ...(categoria && { categoria }),
      ...(recorrente !== undefined && { recorrente }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { codigo: { contains: busca, mode: 'insensitive' } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      prisma.servicoCatalogo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { codigo: 'asc' },
      }),
      prisma.servicoCatalogo.count({ where }),
    ])

    return { items, total }
  },

  /**
   * Busca um serviço específico por ID
   */
  async buscarPorId(id: string, isAdmin = false): Promise<ServicoCatalogoAdmin | ServicoCatalogoPublico | null> {
    const servico = await prisma.servicoCatalogo.findUnique({
      where: { id },
    })

    if (!servico) return null

    if (isAdmin) return servico

    // Sanitização manual para segurança extra
    const {
      custoInternoEstimado,
      margemLucroAlvo,
      valorReferenciaHora,
      metadata,
      atualizadoEm,
      ...publico
    } = servico

    return publico as unknown as ServicoCatalogoPublico
  },
}
