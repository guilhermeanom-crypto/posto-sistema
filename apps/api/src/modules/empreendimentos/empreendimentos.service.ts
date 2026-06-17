import { empreendimentosRepository } from './empreendimentos.repository.js'
import { NotFoundError, ForbiddenError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { complianceQueue, emailQueue } from '../../infra/queue/bullmq.js'
import { agendarRecalculoDiagnostico } from '../diagnostico/service/diagnostico.service.js'
import { prisma } from '../../infra/database/prisma.js'
import type { CriarEmpreendimentoInput, AtualizarEmpreendimentoInput, FiltrosEmpreendimentoInput } from '@repo/schemas'
import { gerarPortalToken, hashPortalToken } from '../auth/portal-token.js'

// ─────────────────────────────────────────────────────────────────────────────
// EMPREENDIMENTOS SERVICE
// ─────────────────────────────────────────────────────────────────────────────

interface ContextoUsuario {
  id: string
  tenantId: string
  perfil: string
  nome: string
  email: string
  ip: string
}

export class EmpreendimentosService {
  async listar(ctx: ContextoUsuario, filtros: FiltrosEmpreendimentoInput) {
    return empreendimentosRepository.findMany(ctx.tenantId, filtros)
  }

  async buscarPorId(ctx: ContextoUsuario, id: string) {
    const empreendimento = await empreendimentosRepository.findById(ctx.tenantId, id)

    if (!empreendimento) {
      throw new NotFoundError('Empreendimento', id)
    }

    const temAcesso = await empreendimentosRepository.verificarAcesso(ctx.id, id, ctx.perfil)
    if (!temAcesso) {
      throw new ForbiddenError('Sem acesso a este empreendimento')
    }

    return empreendimento
  }

  async criar(ctx: ContextoUsuario, data: CriarEmpreendimentoInput) {
    // Valida que a empresa pertence ao tenant (a FK garante existência, não posse)
    const empresa = await prisma.empresa.findFirst({
      where: { id: data.empresaId, tenantId: ctx.tenantId },
      select: { id: true },
    })
    if (!empresa) throw new NotFoundError('Empresa', data.empresaId)

    const empreendimento = await empreendimentosRepository.create(ctx.tenantId, data)

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      usuarioEmail: ctx.email,
      acao: 'empreendimento.criado',
      entidadeTipo: 'empreendimento',
      entidadeId: empreendimento.id,
      dadosDepois: empreendimento,
      ipOrigem: ctx.ip,
    })

    // Enfileirar cálculo inicial de compliance
    await complianceQueue.add('calcular-compliance', {
      tenantId: ctx.tenantId,
      empreendimentoId: empreendimento.id,
    })

    // Recalcular o diagnóstico (fonte única) — não-bloqueante
    agendarRecalculoDiagnostico(empreendimento.id)

    // Se contatoEmail preenchido, gerar magic link e enviar convite automático
    if (empreendimento.contatoEmail) {
      try {
        const token = gerarPortalToken()
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias

        await prisma.tokenPortal.create({
          data: {
            tenantId: ctx.tenantId,
            empreendimentoId: empreendimento.id,
            solicitadoPorId: ctx.id,
            emailDestinatario: empreendimento.contatoEmail,
            nomeContato: empreendimento.nome,
            token: hashPortalToken(token),
            expiresAt,
          },
        })

        const webUrl = process.env.WEB_URL ?? 'http://localhost:3000'
        const link = `${webUrl}/portal/login?token=${token}`

        await emailQueue.add('convite-portal-auto', {
          tipo: 'magic_link',
          email: empreendimento.contatoEmail,
          link,
          empreendimento: empreendimento.nome,
          expiresIn: '30 dias',
        })
      } catch (err) {
        // Não bloqueia criação se o convite falhar
        console.warn('[empreendimentos] Falha ao enviar convite automático:', (err as Error).message)
      }
    }

    return empreendimento
  }

  async atualizar(ctx: ContextoUsuario, id: string, data: AtualizarEmpreendimentoInput) {
    const existente = await this.buscarPorId(ctx, id)

    const atualizado = await empreendimentosRepository.update(ctx.tenantId, id, data)

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      acao: 'empreendimento.atualizado',
      entidadeTipo: 'empreendimento',
      entidadeId: id,
      dadosAntes: existente,
      dadosDepois: atualizado,
      ipOrigem: ctx.ip,
    })

    // Perfil pode ter mudado (CNAE, situação, dados ambientais) → recalcular
    agendarRecalculoDiagnostico(id)

    return atualizado
  }

  async desativar(ctx: ContextoUsuario, id: string) {
    await this.buscarPorId(ctx, id)
    await empreendimentosRepository.deactivate(ctx.tenantId, id)

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      acao: 'empreendimento.desativado',
      entidadeTipo: 'empreendimento',
      entidadeId: id,
      ipOrigem: ctx.ip,
    })
  }
}

export const empreendimentosService = new EmpreendimentosService()
