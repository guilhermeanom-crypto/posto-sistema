import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../infra/database/prisma.js'
import { authenticate } from '../../shared/middleware/authenticate.js'
import { UnauthorizedError, NotFoundError } from '../../shared/errors/app-errors.js'
import { storageService, StorageService } from '../../infra/storage/storage.service.js'
import { registrarAuditoria, extrairIp } from '../../shared/middleware/audit.js'
import { alertaQueue } from '../../infra/queue/bullmq.js'

// ─────────────────────────────────────────────────────────────────────────────
// PORTAL ROUTES — acesso do representante do posto (REPRESENTANTE_POSTO)
// ─────────────────────────────────────────────────────────────────────────────

export const portalRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  // Garante que apenas REPRESENTANTE_POSTO acessa estas rotas
  app.addHook('preHandler', async (request) => {
    if (request.user.perfil !== 'REPRESENTANTE_POSTO') {
      throw new UnauthorizedError()
    }
  })

  /**
   * GET /api/v1/portal/dashboard
   * Visão resumida do empreendimento para o representante
   */
  app.get(
    '/dashboard',
    { schema: { tags: ['portal'], summary: 'Dashboard do representante do posto' } },
    async (request, reply) => {
      // O token de portal tem exatamente um empreendimentoId
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const [empreendimento, processosPendentes, condicionantesPendentes, tarefasPendentes] =
        await Promise.all([
          prisma.empreendimento.findFirst({
            where: { id: empreendimentoId },
            include: {
              snapshotsCompliance: { orderBy: { calculadoEm: 'desc' }, take: 1 },
            },
          }),
          prisma.processo.count({
            where: {
              empreendimentoId,
              status: { notIn: ['ARQUIVADO', 'CANCELADO'] as never[] },
            },
          }),
          prisma.condicionante.count({
            where: { empreendimentoId, status: { in: ['PENDENTE', 'VENCIDA'] as never[] } },
          }),
          prisma.tarefa.count({
            where: {
              empreendimentoId,
              responsavelId: request.user.id,
              status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] },
            },
          }),
        ])

      return reply.status(200).send({
        data: {
          empreendimento,
          resumo: {
            processosPendentes,
            condicionantesPendentes,
            tarefasPendentes,
          },
        },
      })
    },
  )

  /**
   * GET /api/v1/portal/documentos
   * Lista documentos do empreendimento do representante
   */
  app.get(
    '/documentos',
    {
      schema: {
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(50).default(10),
        }),
        tags: ['portal'],
        summary: 'Lista documentos do empreendimento (portal do representante)',
      },
    },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const { page, limit } = request.query
      const [total, items] = await prisma.$transaction([
        prisma.documento.count({ where: { empreendimentoId } }),
        prisma.documento.findMany({
          where: { empreendimentoId },
          include: {
            tipoDocumento: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                momento: true,
                descricaoCliente: true,
              },
            },
            versaoAtual: {
              select: {
                id: true,
                status: true,
                criadoEm: true,
                motivoRejeicao: true,
                observacoesEnvio: true,
                arquivoNome: true,
              },
            },
            // Inclui a versão mais recente (independente de aprovação) para o portal
            // exibir imediatamente o arquivo que o cliente acabou de enviar.
            versoes: {
              orderBy: { enviadoEm: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                criadoEm: true,
                enviadoEm: true,
                arquivoNome: true,
                observacoesEnvio: true,
                motivoRejeicao: true,
              },
            },
          },
          orderBy: { dataValidade: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      // Cliente recebe um campo `ultimaVersao` derivado (versaoAtual quando aprovada,
      // ou a versão mais recente enviada quando ainda em análise/pendente).
      const serializados = items.map((d) => {
        const ultima = d.versaoAtual ?? d.versoes[0] ?? null
        const { versoes: _ignored, ...rest } = d
        return { ...rest, ultimaVersao: ultima }
      })

      return reply.status(200).send({
        data: serializados,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    },
  )

  /**
   * POST /api/v1/portal/documentos/:id/upload/solicitar
   * Fase 1: o representante solicita URL presignada para envio direto ao storage
   */
  app.post(
    '/documentos/:id/upload/solicitar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          nomeArquivo: z.string().min(1).max(255),
          mimeType: z.enum([
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ]),
          tamanhoBytes: z.number().int().min(1).max(50 * 1024 * 1024),
          hashSha256: z.string().length(64),
        }),
        response: {
          200: z.object({
            data: z.object({
              versaoId: z.string().uuid(),
              uploadUrl: z.string().url(),
              chaveS3: z.string(),
              expiresIn: z.number(),
            }),
          }),
        },
        tags: ['portal'],
        summary: 'Solicita URL presignada para upload (portal)',
      },
    },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      // Verifica que o documento pertence ao empreendimento do representante
      const documento = await prisma.documento.findFirst({
        where: { id: request.params.id, empreendimentoId },
      })
      if (!documento) throw new NotFoundError('Documento', request.params.id)

      const ext = request.body.nomeArquivo.split('.').pop() ?? 'bin'
      const chaveS3 = StorageService.gerarChaveTemporaria(
        request.user.tenantId,
        `${documento.id}.${ext}`,
      )

      // Conta versões existentes para definir número da nova
      const totalVersoes = await prisma.documentoVersao.count({ where: { documentoId: documento.id } })

      const versao = await prisma.documentoVersao.create({
        data: {
          documentoId: documento.id,
          numeroVersao: totalVersoes + 1,
          arquivoChaveS3: chaveS3,
          arquivoNome: request.body.nomeArquivo,
          arquivoMime: request.body.mimeType,
          arquivoBytes: BigInt(request.body.tamanhoBytes),
          hashSha256: request.body.hashSha256,
          status: 'AGUARDANDO_UPLOAD',
          enviadoPorId: request.user.id,
          enviadoEm: new Date(),
        },
      })

      const resultado = await storageService.gerarUrlUpload(chaveS3, request.body.mimeType)
      const expiresIn = Math.floor((resultado.expiraEm.getTime() - Date.now()) / 1000)

      return reply.status(200).send({
        data: { versaoId: versao.id, uploadUrl: resultado.uploadUrl, chaveS3, expiresIn },
      })
    },
  )

  /**
   * GET /api/v1/portal/compliance
   * Score de compliance do posto para o representante
   */
  app.get(
    '/compliance',
    { schema: { tags: ['portal'], summary: 'Score de compliance do posto (portal do representante)' } },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const snapshot = await prisma.complianceSnapshot.findFirst({
        where: { empreendimentoId },
        orderBy: { calculadoEm: 'desc' },
      })

      // Detalhamento por eixo — consultas independentes em paralelo
      const hoje = new Date()
      const [licencas, alvaras, documentos, condicionantes, docsSST, bombas, tanques] =
        await Promise.all([
          prisma.licencaAmbiental.findMany({
            where: { empreendimentoId },
            select: { status: true },
          }),
          prisma.alvaraUrbanistico.findMany({
            where: { empreendimentoId },
            select: { status: true },
          }),
          prisma.documento.findMany({
            where: { empreendimentoId },
            select: { status: true },
          }),
          prisma.condicionante.findMany({
            where: { empreendimentoId, status: { not: 'DISPENSADA' as never } },
            select: { status: true },
          }),
          prisma.documentoSST.findMany({
            where: { empreendimentoId },
            select: { status: true },
          }),
          prisma.bombaAbastecimento.findMany({
            where: { empreendimentoId },
            select: { status: true, proximaCalibracao: true },
          }),
          prisma.tanque.findMany({
            where: { empreendimentoId },
            select: {
              status: true,
              testes: {
                orderBy: { dataExecucao: 'desc' },
                take: 1,
                select: { resultado: true, proximoTeste: true },
              },
            },
          }),
        ])

      const score = (valid: number, total: number) =>
        total === 0 ? null : Math.round((valid / total) * 100)

      const bombasAtivas = bombas.filter((b) => b.status === 'ATIVO')
      const bombasValidas = bombasAtivas.filter(
        (b) => !b.proximaCalibracao || b.proximaCalibracao >= hoje,
      )

      const tanquesAtivos = tanques.filter((t) => t.status === 'ATIVO')
      const tanquesValidos = tanquesAtivos.filter((t) => {
        const ultimo = t.testes[0]
        return ultimo && ultimo.resultado === 'APROVADO' && ultimo.proximoTeste >= hoje
      })

      const eixos = [
        {
          key: 'ambiental',
          nome: 'Lic. Ambientais',
          total: licencas.length,
          validos: licencas.filter((l) => l.status === 'VIGENTE').length,
          score: score(licencas.filter((l) => l.status === 'VIGENTE').length, licencas.length),
        },
        {
          key: 'urbano',
          nome: 'Reg. Urbano',
          total: alvaras.length,
          validos: alvaras.filter((a) => a.status === 'VIGENTE').length,
          score: score(alvaras.filter((a) => a.status === 'VIGENTE').length, alvaras.length),
        },
        {
          key: 'documentos',
          nome: 'Documentos',
          total: documentos.length,
          validos: documentos.filter((d) => d.status === 'APROVADO').length,
          score: score(documentos.filter((d) => d.status === 'APROVADO').length, documentos.length),
        },
        {
          key: 'condicionantes',
          nome: 'Condicionantes',
          total: condicionantes.length,
          validos: condicionantes.filter((c) => c.status === 'CUMPRIDA').length,
          score: score(condicionantes.filter((c) => c.status === 'CUMPRIDA').length, condicionantes.length),
        },
        {
          key: 'sst',
          nome: 'SST',
          total: docsSST.length,
          validos: docsSST.filter((d) => d.status === 'VIGENTE').length,
          score: score(docsSST.filter((d) => d.status === 'VIGENTE').length, docsSST.length),
        },
        {
          key: 'anp',
          nome: 'ANP / INMETRO',
          total: bombasAtivas.length,
          validos: bombasValidas.length,
          score: score(bombasValidas.length, bombasAtivas.length),
        },
        {
          key: 'estanqueidade',
          nome: 'Estanqueidade',
          total: tanquesAtivos.length,
          validos: tanquesValidos.length,
          score: score(tanquesValidos.length, tanquesAtivos.length),
        },
      ]

      return reply.status(200).send({
        data: {
          indiceGeral: snapshot ? Number(snapshot.indiceConformidade) : null,
          statusGeral: snapshot?.statusCompliance ?? null,
          calculadoEm: snapshot?.calculadoEm ?? null,
          eixos,
        },
      })
    },
  )

  /**
   * GET /api/v1/portal/alertas
   * Alertas ativos do empreendimento para o representante
   */
  app.get(
    '/alertas',
    {
      schema: {
        querystring: { type: 'object', properties: { limit: { type: 'number', default: 20 } } },
        tags: ['portal'],
        summary: 'Alertas ativos do posto (portal do representante)',
      },
    },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const ultimos90Dias = new Date(Date.now() - 90 * 86_400_000)
      const alertas = await prisma.alerta.findMany({
        where: {
          empreendimentoId,
          criadoEm: { gte: ultimos90Dias },
        },
        orderBy: [{ nivel: 'asc' }, { criadoEm: 'desc' }],
        take: 20,
        select: {
          id: true,
          tipo: true,
          nivel: true,
          titulo: true,
          mensagem: true,
          entidadeTipo: true,
          entidadeId: true,
          criadoEm: true,
        },
      })

      return reply.status(200).send({ data: alertas })
    },
  )

  /**
   * GET /api/v1/portal/tarefas
   * Tarefas atribuídas ao representante do posto
   */
  app.get(
    '/tarefas',
    { schema: { tags: ['portal'], summary: 'Tarefas do representante do posto (portal)' } },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const tarefas = await prisma.tarefa.findMany({
        where: {
          empreendimentoId,
          OR: [
            { responsavelId: request.user.id },
            // Tarefas sem responsável definido e sem prazo ainda são visíveis
            { responsavelId: null, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] } },
          ],
          status: { notIn: ['CANCELADA', 'CONCLUIDA'] as never[] },
        },
        orderBy: [{ prioridade: 'asc' }, { dataVencimento: 'asc' }],
        take: 50,
        select: {
          id: true,
          titulo: true,
          descricao: true,
          status: true,
          prioridade: true,
          dataVencimento: true,
          origem: true,
          criadoEm: true,
          responsavel: { select: { id: true, nome: true } },
        },
      })

      return reply.status(200).send({ data: tarefas })
    },
  )

  /**
   * GET /api/v1/portal/condicionantes
   * Condicionantes do empreendimento para o representante
   */
  app.get(
    '/condicionantes',
    {
      schema: {
        querystring: z.object({
          status: z.enum(['PENDENTE', 'EM_ANALISE', 'CUMPRIDA', 'VENCIDA', 'DISPENSADA']).optional(),
        }),
        tags: ['portal'],
        summary: 'Condicionantes do empreendimento (portal)',
      },
    },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const { status } = request.query as { status?: string }

      const condicionantes = await prisma.condicionante.findMany({
        where: {
          empreendimentoId,
          ...(status && { status: status as never }),
        },
        orderBy: [{ status: 'asc' }, { proximoVencimento: 'asc' }, { prazoCumprimento: 'asc' }],
        select: {
          id: true,
          descricao: true,
          numeroCondicionante: true,
          tipo: true,
          status: true,
          periodicidade: true,
          prazoCumprimento: true,
          proximoVencimento: true,
          evidenciaExigida: true,
          cumpridaEm: true,
          criadoEm: true,
        },
      })

      return reply.status(200).send({ data: condicionantes })
    },
  )

  /**
   * GET /api/v1/portal/mensagens
   * Mensagens do canal portal para o empreendimento
   */
  app.get(
    '/mensagens',
    { schema: { tags: ['portal'], summary: 'Mensagens do portal do representante' } },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const mensagens = await prisma.mensagemPortal.findMany({
        where: { empreendimentoId },
        orderBy: { criadoEm: 'asc' },
        take: 100,
        select: {
          id: true,
          tipoAutor: true,
          texto: true,
          lida: true,
          criadoEm: true,
        },
      })

      // Marcar não-lidas do representante como lidas ao consultor abrir (aqui basta o representante ler)
      await prisma.mensagemPortal.updateMany({
        where: { empreendimentoId, tipoAutor: 'CONSULTOR', lida: false },
        data: { lida: true },
      })

      return reply.status(200).send({ data: mensagens })
    },
  )

  /**
   * POST /api/v1/portal/mensagens
   * Representante envia uma mensagem
   */
  app.post(
    '/mensagens',
    {
      schema: {
        body: z.object({ texto: z.string().min(1).max(2000).trim() }),
        tags: ['portal'],
        summary: 'Representante envia mensagem (portal)',
      },
    },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const mensagem = await prisma.mensagemPortal.create({
        data: {
          tenantId: request.user.tenantId,
          empreendimentoId,
          autorId: request.user.id,
          tipoAutor: 'REPRESENTANTE',
          texto: request.body.texto,
        },
        select: {
          id: true,
          tipoAutor: true,
          texto: true,
          lida: true,
          criadoEm: true,
        },
      })

      return reply.status(201).send({ data: mensagem })
    },
  )

  /**
   * POST /api/v1/portal/documentos/:id/upload/confirmar
   * Fase 2: confirma que o PUT ao S3 foi concluído e atualiza status da versão
   */
  app.post(
    '/documentos/:id/upload/confirmar',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          chaveS3: z.string().min(1),
          observacoesEnvio: z.string().max(500).optional(),
        }),
        response: { 200: z.object({ data: z.record(z.unknown()) }) },
        tags: ['portal'],
        summary: 'Confirma que o arquivo foi enviado ao storage (portal)',
      },
    },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      // Garante que o documento pertence ao empreendimento
      const documento = await prisma.documento.findFirst({
        where: { id: request.params.id, empreendimentoId },
      })
      if (!documento) throw new NotFoundError('Documento', request.params.id)

      const versao = await prisma.documentoVersao.findFirst({
        where: { documentoId: documento.id, arquivoChaveS3: request.body.chaveS3 },
      })
      if (!versao) throw new NotFoundError('Versão de documento', request.body.chaveS3)

      // Confirma existência no storage
      const { existe } = await storageService.verificarArquivo(request.body.chaveS3)
      if (!existe) {
        return reply.status(422).send({ data: { message: 'Arquivo não encontrado no storage. Repita o upload.' } })
      }

      const atualizada = await prisma.documentoVersao.update({
        where: { id: versao.id },
        data: {
          status: 'ENVIADA',
          observacoesEnvio: request.body.observacoesEnvio,
        },
      })

      // Atualiza status do documento para EM_ANALISE
      await prisma.documento.update({
        where: { id: documento.id },
        data: { status: 'EM_ANALISE' },
      })

      await registrarAuditoria({
        tenantId: request.user.tenantId,
        usuarioId: request.user.id,
        usuarioNome: request.user.nome,
        acao: 'documento.versao_enviada_portal',
        entidadeTipo: 'documento_versao',
        entidadeId: versao.id,
        ipOrigem: extrairIp(request),
        contexto: { documentoId: documento.id, via: 'portal' },
      })

      // Notificar analistas com acesso ao empreendimento
      const analistas = await prisma.empreendimentoAcesso.findMany({
        where: { empreendimentoId },
        select: { usuarioId: true },
      })

      if (analistas.length > 0) {
        const emp = await prisma.empreendimento.findUnique({ where: { id: empreendimentoId }, select: { nome: true } })
        await alertaQueue.add('alerta-documento-recebido', {
          tenantId: request.user.tenantId,
          tipo: 'NOVO_REQUISITO',
          nivel: 'INFORMATIVO',
          titulo: 'Documento recebido pelo portal',
          mensagem: `Novo documento enviado para ${emp?.nome ?? 'empreendimento'}: ${documento.nome}. Aguardando análise.`,
          empreendimentoId,
          entidadeTipo: 'documento',
          entidadeId: documento.id,
          destinatarioIds: analistas.map((a) => a.usuarioId),
        })
      }

      // BigInt do `arquivoBytes` não serializa em JSON — convertemos antes de retornar
      return reply.status(200).send({
        data: {
          id: atualizada.id,
          documentoId: atualizada.documentoId,
          status: atualizada.status,
          arquivoNome: atualizada.arquivoNome,
          arquivoMime: atualizada.arquivoMime,
          arquivoBytes: Number(atualizada.arquivoBytes),
          observacoesEnvio: atualizada.observacoesEnvio,
          enviadoEm: atualizada.enviadoEm,
          documentoStatus: 'EM_ANALISE',
        },
      })
    },
  )

  /**
   * GET /api/v1/portal/checklists
   * Checklists atribuídos ao empreendimento do representante
   */
  app.get(
    '/checklists',
    {
      schema: {
        querystring: z.object({
          status: z.enum(['EM_ANDAMENTO', 'CONFORME', 'NAO_CONFORME', 'PARCIAL']).optional(),
        }),
        tags: ['portal'],
        summary: 'Checklists do empreendimento (portal)',
      },
    },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const { status } = request.query as { status?: string }

      const execucoes = await prisma.checklistExecucao.findMany({
        where: {
          empreendimentoId,
          ...(status && { status }),
        },
        include: {
          template: { select: { id: true, nome: true, modulo: true, descricao: true } },
          executadoPor: { select: { id: true, nome: true } },
          respostas: {
            include: { item: { select: { id: true, descricao: true, categoria: true, ordem: true } } },
            orderBy: { item: { ordem: 'asc' } },
          },
        },
        orderBy: { iniciadaEm: 'desc' },
        take: 30,
      })

      return reply.status(200).send({ data: execucoes })
    },
  )

  /**
   * POST /api/v1/portal/checklists/:execId/responder
   * Representante responde um item do checklist
   */
  app.post(
    '/checklists/:execId/responder',
    {
      schema: {
        params: z.object({ execId: z.string().uuid() }),
        body: z.object({
          itemId: z.string().uuid(),
          status: z.enum(['OK', 'ATENCAO', 'CRITICO', 'NA']),
          observacao: z.string().max(500).optional(),
        }),
        tags: ['portal'],
        summary: 'Representante responde item de checklist (portal)',
      },
    },
    async (request, reply) => {
      const empreendimentoId = request.user.empreendimentoIds?.[0]
      if (!empreendimentoId) throw new UnauthorizedError()

      const execucao = await prisma.checklistExecucao.findFirst({
        where: { id: request.params.execId, empreendimentoId },
      })
      if (!execucao) throw new NotFoundError('ChecklistExecucao', request.params.execId)

      const resposta = await prisma.checklistResposta.upsert({
        where: {
          execucaoId_itemId: {
            execucaoId: request.params.execId,
            itemId: request.body.itemId,
          },
        },
        create: {
          execucaoId: request.params.execId,
          itemId: request.body.itemId,
          status: request.body.status,
          observacao: request.body.observacao,
        },
        update: {
          status: request.body.status,
          observacao: request.body.observacao,
        },
      })

      return reply.status(200).send({ data: resposta })
    },
  )
}
