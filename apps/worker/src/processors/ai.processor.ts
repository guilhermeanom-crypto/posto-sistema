import { Worker } from 'bullmq'
import { redis } from '../infra/redis.js'
import { prisma } from '../infra/prisma.js'
import {
  analisarLicencaAmbiental,
  analisarAutoInfracao,
  gerarDefesaTecnica,
} from '../services/ai.service.js'
import { logger } from "../lib/logger.js"

// ─────────────────────────────────────────────────────────────────────────────
// AI PROCESSOR — processa jobs de IA (análise de PDF + geração de defesa)
// ─────────────────────────────────────────────────────────────────────────────

export function criarAIWorker(concurrency = 2) {
  return new Worker(
    'ia',
    async (job) => {
      switch (job.name) {
        // ── Análise de Licença Ambiental ────────────────────────────────────
        case 'analisar-licenca': {
          const { licencaId } = job.data as { licencaId: string }

          const licenca = await prisma.licencaAmbiental.findUnique({ where: { id: licencaId } })
          if (!licenca?.chaveS3) throw new Error(`Licença ${licencaId} sem arquivo S3`)

          logger.info(`[ia] Analisando licença ${licencaId}...`)
          const analise = await analisarLicencaAmbiental(licenca.chaveS3)

          await prisma.licencaAmbiental.update({
            where: { id: licencaId },
            data: { analiseIA: analise as object, analisadoEm: new Date() },
          })

          // Cria condicionantes automaticamente se ainda não existirem
          if (analise.condicionantes?.length) {
            const existentes = await prisma.condicaoLicenca.count({ where: { licencaId } })
            if (existentes === 0) {
              await prisma.condicaoLicenca.createMany({
                data: analise.condicionantes.map((c) => ({
                  licencaId,
                  numero: c.numero,
                  descricao: c.descricao,
                  prazo: c.prazo ? new Date(c.prazo) : undefined,
                  status: 'PENDENTE' as const,
                })),
              })
              logger.info(`[ia] Criadas ${analise.condicionantes.length} condicionantes para licença ${licencaId}`)
            }
          }

          break
        }

        // ── Análise de Auto de Infração ─────────────────────────────────────
        case 'analisar-auto': {
          const { autoId } = job.data as { autoId: string }

          const auto = await prisma.autoInfracao.findUnique({ where: { id: autoId } })
          if (!auto?.chaveS3) throw new Error(`Auto ${autoId} sem arquivo S3`)

          logger.info(`[ia] Analisando auto ${autoId}...`)
          const analise = await analisarAutoInfracao(auto.chaveS3)

          await prisma.autoInfracao.update({
            where: { id: autoId },
            data: {
              analiseIA: analise as object,
              analisadoEm: new Date(),
              // Preenche campos vazios com dados extraídos pela IA
              ...(!auto.artigo && analise.artigo ? { artigo: analise.artigo } : {}),
            },
          })

          break
        }

        // ── Geração de Defesa Técnica ───────────────────────────────────────
        case 'gerar-defesa': {
          const { autoId } = job.data as { autoId: string }

          const auto = await prisma.autoInfracao.findUnique({
            where: { id: autoId },
            include: { empreendimento: { select: { nome: true } } },
          })
          if (!auto) throw new Error(`Auto ${autoId} não encontrado`)

          logger.info(`[ia] Gerando defesa para auto ${autoId}...`)

          const rascunho = await gerarDefesaTecnica({
            numeroAuto: auto.numeroAuto,
            orgao: auto.orgao,
            artigo: auto.artigo,
            descricao: auto.descricao,
            valorMulta: auto.valorMulta ? Number(auto.valorMulta) : null,
            prazoDefesa: auto.prazoDefesa.toISOString().slice(0, 10),
            dataLavratura: auto.dataLavratura.toISOString().slice(0, 10),
            empreendimento: auto.empreendimento.nome,
          })

          await prisma.defesaTecnica.create({
            data: {
              autoId,
              rascunhoIA: rascunho,
              status: 'RASCUNHO',
            },
          })

          logger.info(`[ia] Defesa gerada para auto ${autoId}`)
          break
        }

        default:
          logger.warn(`[ia] Job desconhecido: ${job.name}`)
      }
    },
    {
      connection: redis,
      concurrency,
    },
  )
}
