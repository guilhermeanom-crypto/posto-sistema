import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { empresasService } from './empresas.service.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'
import { ForbiddenError } from '../../shared/errors/app-errors.js'

// ─────────────────────────────────────────────────────────────────────────────
// EMPRESAS ROUTES — cadastro da empresa-matriz (pré-requisito de empreendimento)
// ─────────────────────────────────────────────────────────────────────────────

const criarEmpresaSchema = z.object({
  nome: z.string().min(1).max(200),
  razaoSocial: z.string().min(1).max(200),
  cnpj: z.string().min(11).max(20),
  inscricaoEstadual: z.string().max(40).optional().nullable(),
  inscricaoMunicipal: z.string().max(40).optional().nullable(),
})

const PERFIS_GESTAO = ['SUPER_ADMIN', 'ADMIN_TENANT', 'COORDENADOR']

export const empresasRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const ctx = (request: FastifyRequest) => ({
    id: request.user.id,
    tenantId: request.user.tenantId,
    perfil: request.user.perfil,
    nome: request.user.nome,
    email: request.user.email,
    ip: extrairIp(request),
  })

  app.get(
    '/',
    { schema: { tags: ['empresas'], summary: 'Lista as empresas do tenant' } },
    async (request, reply) => {
      const empresas = await empresasService.listar(ctx(request))
      return reply.status(200).send({ data: empresas })
    },
  )

  app.post(
    '/',
    {
      schema: {
        body: criarEmpresaSchema,
        tags: ['empresas'],
        summary: 'Cria uma empresa (matriz dos empreendimentos) no tenant',
      },
    },
    async (request, reply) => {
      if (!PERFIS_GESTAO.includes(request.user.perfil)) {
        throw new ForbiddenError(
          'Apenas ADMIN_TENANT, COORDENADOR ou SUPER_ADMIN podem criar empresas',
        )
      }
      const empresa = await empresasService.criar(ctx(request), request.body)
      return reply.status(201).send({ data: empresa })
    },
  )
}
