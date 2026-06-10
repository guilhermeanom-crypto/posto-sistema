import { relatorioQueue } from '../../infra/queue/bullmq.js'
import { prisma } from '../../infra/database/prisma.js'
import { storageService } from '../../infra/storage/storage.service.js'
import { NotFoundError } from '../../shared/errors/app-errors.js'
import type { TipoRelatorio } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIOS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

interface Ctx { id: string; tenantId: string }

export interface SolicitarRelatorioInput {
  tipo: TipoRelatorio
  parametros: Record<string, unknown>
}

class RelatoriosService {
  async solicitar(ctx: Ctx, data: SolicitarRelatorioInput) {
    // Um relatório por vez por tenant (evita sobrecarga)
    const emProcessamento = await prisma.relatorioGerado.findFirst({
      where: { tenantId: ctx.tenantId, status: { in: ['AGUARDANDO', 'PROCESSANDO'] } },
    })
    if (emProcessamento) {
      return { aguardando: true, relatorio: emProcessamento }
    }

    const relatorio = await prisma.relatorioGerado.create({
      data: {
        tenantId: ctx.tenantId,
        tipo: data.tipo,
        parametros: data.parametros as object,
        solicitadoPor: ctx.id,
      },
    })

    await relatorioQueue.add(
      'gerar-relatorio',
      { relatorioId: relatorio.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 10000 } },
    )

    return { aguardando: false, relatorio }
  }

  async listar(ctx: Ctx) {
    return prisma.relatorioGerado.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { criadoEm: 'desc' },
      take: 20,
    })
  }

  async obterDownload(ctx: Ctx, id: string) {
    const rel = await prisma.relatorioGerado.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!rel) throw new NotFoundError('RelatorioGerado', id)
    if (rel.status !== 'CONCLUIDO' || !rel.s3Key) {
      return { url: null, status: rel.status }
    }

    const url = await storageService.gerarUrlDownload(rel.s3Key, 600) // 10min
    return { url, status: rel.status }
  }

  async remover(ctx: Ctx, id: string) {
    const rel = await prisma.relatorioGerado.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!rel) throw new NotFoundError('RelatorioGerado', id)

    if (rel.s3Key) {
      await storageService.removerArquivo(rel.s3Key).catch(() => null)
    }

    await prisma.relatorioGerado.delete({ where: { id } })
  }
}

export const relatoriosService = new RelatoriosService()
