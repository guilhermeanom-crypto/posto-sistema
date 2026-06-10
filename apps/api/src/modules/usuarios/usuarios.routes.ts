import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  alterarPerfilUsuarioSchema,
  alterarSenhaSchema,
} from '@repo/schemas'
import { usuariosService } from './usuarios.service.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { extrairIp } from '../../shared/middleware/audit.js'

// ─────────────────────────────────────────────────────────────────────────────
// USUARIOS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const filtrosUsuarioSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().optional(),
  perfil: z.string().optional(),
  ativo: z.coerce.boolean().optional(),
})

export const usuariosRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  const ctx = (request: FastifyRequest) => ({
    id: request.user.id,
    tenantId: request.user.tenantId,
    perfil: request.user.perfil,
    nome: request.user.nome,
    email: request.user.email,
    ip: extrairIp(request),
  })

  app.get('/', { schema: { querystring: filtrosUsuarioSchema, tags: ['usuarios'], summary: 'Lista usuários do tenant' } }, async (request, reply) => {
    const result = await usuariosService.listar(ctx(request), request.query)
    return reply.status(200).send({ data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) } })
  })

  app.post('/', { schema: { body: criarUsuarioSchema, response: { 201: z.object({ data: z.record(z.unknown()) }) }, tags: ['usuarios'], summary: 'Cria um novo usuário (requer ADMIN)' } }, async (request, reply) => {
    const usuario = await usuariosService.criar(ctx(request), request.body)
    return reply.status(201).send({ data: usuario })
  })

  app.get('/:id', { schema: { params: z.object({ id: z.string().uuid() }), tags: ['usuarios'], summary: 'Retorna detalhes de um usuário' } }, async (request, reply) => {
    const usuario = await usuariosService.buscarPorId(ctx(request), request.params.id)
    return reply.status(200).send({ data: usuario })
  })

  app.patch('/:id', { schema: { params: z.object({ id: z.string().uuid() }), body: atualizarUsuarioSchema, tags: ['usuarios'], summary: 'Atualiza dados de um usuário' } }, async (request, reply) => {
    const usuario = await usuariosService.atualizar(ctx(request), request.params.id, request.body)
    return reply.status(200).send({ data: usuario })
  })

  app.patch('/:id/perfil', { schema: { params: z.object({ id: z.string().uuid() }), body: alterarPerfilUsuarioSchema, tags: ['usuarios'], summary: 'Altera o perfil/role de um usuário (requer ADMIN)' } }, async (request, reply) => {
    const usuario = await usuariosService.alterarPerfil(ctx(request), request.params.id, request.body.perfil)
    return reply.status(200).send({ data: usuario })
  })

  app.patch('/:id/senha', { schema: { params: z.object({ id: z.string().uuid() }), body: alterarSenhaSchema, tags: ['usuarios'], summary: 'Altera a senha do próprio usuário' } }, async (request, reply) => {
    await usuariosService.alterarSenha(ctx(request), request.params.id, request.body)
    return reply.status(204).send()
  })

  app.delete('/:id', { schema: { params: z.object({ id: z.string().uuid() }), response: { 204: z.undefined() }, tags: ['usuarios'], summary: 'Desativa um usuário (requer ADMIN)' } }, async (request, reply) => {
    await usuariosService.desativar(ctx(request), request.params.id)
    return reply.status(204).send()
  })
}
