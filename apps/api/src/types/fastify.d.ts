import 'fastify'

declare module 'fastify' {
  // Extensão do schema para suportar campos OpenAPI/Swagger
  interface FastifySchema {
    tags?: string[]
    summary?: string
    description?: string
    security?: Array<Record<string, string[]>>
    deprecated?: boolean
  }
}
