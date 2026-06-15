import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import helmet from '@fastify/helmet'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { ZodError } from 'zod'

import { env } from './config/env.js'
import { redis } from './infra/cache/redis.js'
import { prisma } from './infra/database/prisma.js'
import { AppError } from './shared/errors/app-errors.js'

// BigInt não tem serialização JSON nativa, e o Prisma usa BigInt em colunas como
// `arquivo_bytes`. Sem isto, respostas que carregam esses campos quebram com
// "Do not know how to serialize a BigInt". Bytes de arquivo nunca excedem
// Number.MAX_SAFE_INTEGER, então a conversão para number é segura.
;(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this)
}

// Módulos de rotas
import { authRoutes } from './modules/auth/auth.routes.js'
import { usuariosRoutes } from './modules/usuarios/usuarios.routes.js'
import { empreendimentosRoutes } from './modules/empreendimentos/empreendimentos.routes.js'
import { empresasRoutes } from './modules/empresas/empresas.routes.js'
import { processosRoutes } from './modules/processos/processos.routes.js'
import { documentosRoutes } from './modules/documentos/documentos.routes.js'
import { condicionantesRoutes } from './modules/condicionantes/condicionantes.routes.js'
import { tarefasRoutes } from './modules/tarefas/tarefas.routes.js'
import { alertasRoutes } from './modules/alertas/alertas.routes.js'
import { complianceRoutes } from './modules/compliance/compliance.routes.js'
import { portalRoutes } from './modules/portal/portal.routes.js'
import { conhecimentoRoutes } from './modules/conhecimento/conhecimento.routes.js'
import { configRoutes } from './modules/config/config.routes.js'
import { licencasAmbientaisRoutes } from './modules/licencas-ambientais/licencas-ambientais.routes.js'
import { regulatorioUrbanoRoutes } from './modules/regulatorio-urbano/regulatorio-urbano.routes.js'
import { sstRoutes } from './modules/sst/sst.routes.js'
import { anpInmetroRoutes } from './modules/anp-inmetro/anp-inmetro.routes.js'
import { estanqueidadeRoutes } from './modules/estanqueidade/estanqueidade.routes.js'
import { logisticaReversaRoutes } from './modules/logistica-reversa/logistica-reversa.routes.js'
import { outorgaHidricaRoutes } from './modules/outorga-hidrica/outorga-hidrica.routes.js'
import { monitoramentoRoutes } from './modules/monitoramento/monitoramento.routes.js'
import { fiscalizacoesRoutes } from './modules/fiscalizacoes/fiscalizacoes.routes.js'
import { cockpitRoutes } from './modules/cockpit/cockpit.routes.js'
import { relatoriosRoutes } from './modules/relatorios/relatorios.routes.js'
import { iaRoutes } from './modules/ia/ia.routes.js'
import { legislacaoRoutes } from './modules/legislacao/legislacao.routes.js'
import { riscoRoutes } from './modules/risco/risco.routes.js'
import { whatsappRoutes } from './modules/whatsapp/whatsapp.routes.js'
import { checklistsRoutes } from './modules/checklists/checklists.routes.js'
import { auditRoutes } from './modules/audit/audit.routes.js'
import { onboardingRoutes } from './modules/onboarding/onboarding.routes.js'
import { crmRoutes } from './modules/crm/crm.routes.js'
import { tenantsRoutes } from './modules/tenants/tenants.routes.js'
import { pgrsRoutes } from './modules/pgrs/pgrs.routes.js'
import { equipamentosHistoricoRoutes } from './modules/equipamentos/equipamentos-historico.routes.js'
import { filaRoutes } from './modules/fila/fila.routes.js'
import { metricasRoutes } from './modules/metricas/metricas.routes.js'
import { integracoesItecologicaRoutes } from './modules/integracoes/integracoes-itecologica.routes.js'
import { comercialRoutes } from './modules/comercial/comercial.routes.js'
import { handoffsRoutes } from './modules/operacao/handoffs.routes.js'
import { ordensServicoRoutes } from './modules/operacao/ordens-servico.routes.js'
import { pendenciasRoutes } from './modules/pendencias/pendencias.routes.js'
import { evidenciasRoutes } from './modules/evidencias/evidencias.routes.js'
import { entregaveisRoutes } from './modules/operacao/entregaveis.routes.js'

// ─────────────────────────────────────────────────────────────────────────────
// BOOTSTRAP DA APLICAÇÃO FASTIFY
// ─────────────────────────────────────────────────────────────────────────────

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
            },
          }
        : {}),
    },
    trustProxy: env.TRUST_PROXY_HOPS,
    requestIdHeader: 'x-request-id',
  }).withTypeProvider<ZodTypeProvider>()

  // ── Validação via Zod ───────────────────────────────────────────────────────
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // ── Security headers ────────────────────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: false, // CSP gerenciado pelo Next.js
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite presigned URLs do S3
  })

  // ── Plugins globais ─────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: [env.WEB_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  })

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    ...(env.NODE_ENV === 'test' ? {} : { redis }),
  })

  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  })

  // ── Tratamento global de erros ──────────────────────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    // Erros de domínio (AppError)
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
    }

    // Erros de validação Zod
    if (error instanceof ZodError || error.name === 'ZodError' || error.code === 'FST_ERR_VALIDATION') {
      const zodLike = error as unknown as ZodError & {
        issues?: Array<{ path?: Array<string | number>; message?: string }>
        validation?: Array<{ path?: Array<string | number>; message?: string }>
      }
      const details = Object.fromEntries(
        (zodLike.issues ?? zodLike.validation ?? []).map((issue) => [
          String(issue.path?.[0] ?? 'form'),
          [issue.message ?? 'Valor inválido'],
        ]),
      )
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          details,
        },
      })
    }

    // Rate limit
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Muitas requisições. Aguarde um momento.',
        },
      })
    }

    // Erros desconhecidos — log mas não expõe stack em produção
    app.log.error({ err: error, url: request.url }, 'Erro não tratado')
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: env.NODE_ENV === 'production' ? 'Erro interno do servidor' : error.message,
      },
    })
  })

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', { logLevel: 'silent' }, async (_req, reply) => {
    const checks: Record<string, string> = {}
    let allOk = true

    // Verifica PostgreSQL
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.db = 'ok'
    } catch {
      checks.db = 'error'
      allOk = false
    }

    // Verifica Redis
    try {
      await redis.ping()
      checks.redis = 'ok'
    } catch {
      checks.redis = 'error'
      allOk = false
    }

    const status = allOk ? 'ok' : 'degraded'
    return reply.status(allOk ? 200 : 503).send({
      status,
      checks,
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      uptime: Math.floor(process.uptime()),
    })
  })

  // ── Rotas da API ────────────────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(usuariosRoutes, { prefix: '/api/v1/usuarios' })
  await app.register(empreendimentosRoutes, { prefix: '/api/v1/empreendimentos' })
  await app.register(empresasRoutes, { prefix: '/api/v1/empresas' })
  await app.register(processosRoutes, { prefix: '/api/v1/processos' })
  await app.register(documentosRoutes, { prefix: '/api/v1/documentos' })
  await app.register(condicionantesRoutes, { prefix: '/api/v1/condicionantes' })
  await app.register(tarefasRoutes, { prefix: '/api/v1/tarefas' })
  await app.register(alertasRoutes, { prefix: '/api/v1/alertas' })
  await app.register(complianceRoutes, { prefix: '/api/v1/compliance' })
  await app.register(portalRoutes, { prefix: '/api/v1/portal' })
  await app.register(conhecimentoRoutes, { prefix: '/api/v1/conhecimento' })
  await app.register(configRoutes, { prefix: '/api/v1/config' })
  await app.register(licencasAmbientaisRoutes, { prefix: '/api/v1/licencas-ambientais' })
  await app.register(regulatorioUrbanoRoutes, { prefix: '/api/v1/regulatorio-urbano' })
  await app.register(sstRoutes, { prefix: '/api/v1/sst' })
  await app.register(anpInmetroRoutes, { prefix: '/api/v1/anp-inmetro' })
  await app.register(estanqueidadeRoutes, { prefix: '/api/v1/estanqueidade' })
  await app.register(logisticaReversaRoutes, { prefix: '/api/v1/logistica-reversa' })
  await app.register(outorgaHidricaRoutes, { prefix: '/api/v1/outorga-hidrica' })
  await app.register(monitoramentoRoutes, { prefix: '/api/v1/monitoramento' })
  await app.register(fiscalizacoesRoutes, { prefix: '/api/v1/fiscalizacoes' })
  await app.register(cockpitRoutes, { prefix: '/api/v1/cockpit' })
  await app.register(relatoriosRoutes, { prefix: '/api/v1/relatorios' })
  await app.register(iaRoutes, { prefix: '/api/v1/ia' })
  await app.register(legislacaoRoutes, { prefix: '/api/v1/legislacao' })
  await app.register(riscoRoutes, { prefix: '/api/v1/risco' })
  await app.register(whatsappRoutes, { prefix: '/api/v1/whatsapp' })
  await app.register(checklistsRoutes, { prefix: '/api/v1/checklists' })
  await app.register(auditRoutes, { prefix: '/api/v1/audit-log' })
  await app.register(onboardingRoutes, { prefix: '/api/v1/onboarding' })
  await app.register(crmRoutes, { prefix: '/api/v1/crm' })
  await app.register(tenantsRoutes, { prefix: '/api/v1/tenants' })
  await app.register(pgrsRoutes, { prefix: '/api/v1/pgrs' })
  await app.register(equipamentosHistoricoRoutes, { prefix: '/api/v1/equipamentos-historico' })
  await app.register(filaRoutes, { prefix: '/api/v1/fila' })
  await app.register(metricasRoutes, { prefix: '/api/v1/metricas' })
  await app.register(integracoesItecologicaRoutes, { prefix: '/api/v1/integracoes' })
  await app.register(comercialRoutes, { prefix: '/api/v1/comercial' })
  await app.register(handoffsRoutes, { prefix: '/api/v1/operacao/handoffs' })
  await app.register(ordensServicoRoutes, { prefix: '/api/v1/operacao/ordens-servico' })
  await app.register(entregaveisRoutes, { prefix: '/api/v1/operacao/entregaveis' })
  await app.register(pendenciasRoutes, { prefix: '/api/v1/pendencias' })
  await app.register(evidenciasRoutes, { prefix: '/api/v1/evidencias' })

  return app
}
