import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      tenantId: string
      perfil: string
      empreendimentoIds: string[] | null
    }
    user: {
      id: string
      tenantId: string
      perfil: string
      empreendimentoIds: string[] | null
      nome: string
      email: string
    }
  }
}
