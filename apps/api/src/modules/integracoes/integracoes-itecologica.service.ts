import type { Prisma, PrioridadeTarefa } from '@prisma/client'
import { complianceQueue, emailQueue } from '../../infra/queue/bullmq.js'
import { prisma } from '../../infra/database/prisma.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { ConflictError, NotFoundError, UnprocessableError } from '../../shared/errors/app-errors.js'
import { gerarPortalToken, hashPortalToken } from '../auth/portal-token.js'

type CrmWinPayload = {
  handoff_id: string
  handoff_version: number
  occurred_at: string
  idempotency_key: string
  target_tenant_slug: string
  source: {
    lead_id: string
    lead_status: string
    qualification_status?: string | null
    assigned_to?: string | null
    source?: string | null
    source_page?: string | null
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
  }
  company: {
    company_name: string
    legal_name: string
    cnpj: string
    primary_contact_name: string
    primary_contact_email: string
    primary_contact_phone: string
  }
  enterprise: {
    enterprise_name: string
    enterprise_type: string
    brand?: string | null
    logradouro: string
    numero: string
    complemento?: string | null
    bairro: string
    cidade: string
    estado: string
    cep: string
    atividades: string[]
    data_inicio_operacao?: string | null
  }
  diagnosis: {
    diagnosis_case_id: string
    diagnosis_type: string
    briefing_summary?: string | null
    declared_need?: string | null
    territorial_scope?: string | null
    recommended_next_step?: string | null
    official_diagnostic_artifact_id?: string | null
    official_execution_plan_artifact_id?: string | null
    official_artifacts_generated_at?: string | null
    official_diagnostic_result?: Record<string, unknown> | null
    official_execution_plan?: Record<string, unknown> | null
  }
  commercial: {
    proposal_external_id: string
    proposal_value?: number | null
    proposal_scope_summary?: string | null
    commercial_notes?: string | null
  }
  operation: {
    responsavel_tecnico_nome?: string | null
    responsavel_tecnico_crea?: string | null
    responsavel_tecnico_email?: string | null
    operational_owner_email?: string | null
    initial_task_title: string
    initial_task_description?: string | null
    initial_due_date?: string | null
  }
}

type ExecutionPlanTaskPayload = {
  code: string
  title: string
  description: string
  phaseCode: string
  priority: 'critica' | 'alta' | 'media' | 'baixa'
  status: string
  owner: string
  expectedDays: number
  obligationCode?: string | null
  serviceCode?: string | null
}

type ExecutionPlanPayload = {
  summary?: {
    totalPhases?: number
    totalTasks?: number
    totalDeadlines?: number
    totalMonitorings?: number
  }
  tasks?: ExecutionPlanTaskPayload[]
}

type ReceiveCrmWinInput = {
  body: CrmWinPayload
  idempotencyKey: string
  sourceSystem: string
  ipOrigem?: string
  userAgent?: string
}

type ReprocessEventoInput = {
  tenantId: string
  eventId: string
  requester: {
    id: string
    nome: string
    email: string
    perfil: string
  }
  ipOrigem?: string
  userAgent?: string
}

type MaterializationSummary = {
  empresa: {
    id: string
    created: boolean
  }
  empreendimento: {
    id: string
    created: boolean
  }
  tarefa: {
    id: string
    created: boolean
  }
  bootstrap: {
    complianceQueued: boolean
    portalTokenCreated: boolean
    portalInviteQueued: boolean
  }
  executionPlan?: {
    tasksCreated: number
  }
}

const integracaoEventoSelect = {
  id: true,
  tenantId: true,
  sourceSystem: true,
  eventName: true,
  idempotencyKey: true,
  status: true,
  processedAt: true,
  errorMessage: true,
  empresaId: true,
  empreendimentoId: true,
  tarefaId: true,
  payloadJson: true,
  criadoEm: true,
  atualizadoEm: true,
} satisfies Prisma.IntegracaoEventoSelect

export class IntegracoesItecologicaService {
  async listEventos(args: {
    tenantId: string
    page: number
    limit: number
    status?: string
    sourceSystem?: string
    leadId?: string
    handoffId?: string
  }) {
    const { tenantId, page, limit, status, sourceSystem, leadId, handoffId } = args

    const payloadFilters: Prisma.IntegracaoEventoWhereInput[] = []

    if (leadId) {
      payloadFilters.push({
        payloadJson: {
          path: ['source', 'lead_id'],
          equals: leadId,
        },
      })
    }

    if (handoffId) {
      payloadFilters.push({
        payloadJson: {
          path: ['handoff_id'],
          equals: handoffId,
        },
      })
    }

    const where: Prisma.IntegracaoEventoWhereInput = {
      tenantId,
      ...(status ? { status } : {}),
      ...(sourceSystem ? { sourceSystem } : {}),
      ...(payloadFilters.length > 0 ? { AND: payloadFilters } : {}),
    }

    const [total, items] = await prisma.$transaction([
      prisma.integracaoEvento.count({ where }),
      prisma.integracaoEvento.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: integracaoEventoSelect,
      }),
    ])

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getEventoById(args: { tenantId: string; eventId: string }) {
    const event = await prisma.integracaoEvento.findFirst({
      where: {
        id: args.eventId,
        tenantId: args.tenantId,
      },
      select: integracaoEventoSelect,
    })

    if (!event) {
      throw new NotFoundError('IntegracaoEvento', args.eventId)
    }

    return event
  }

  async reprocessEvento(input: ReprocessEventoInput) {
    const event = await prisma.integracaoEvento.findFirst({
      where: {
        id: input.eventId,
        tenantId: input.tenantId,
      },
      select: integracaoEventoSelect,
    })

    if (!event) {
      throw new NotFoundError('IntegracaoEvento', input.eventId)
    }

    if (event.sourceSystem !== 'itecologica' || event.eventName !== 'crm.win_to_posto.v1') {
      throw new ConflictError('Evento nao pertence ao fluxo suportado de integracao da ITECOLOGICA')
    }

    if (event.status === 'materialized') {
      return {
        alreadyMaterialized: true,
        event,
        summary: null,
      }
    }

    const payload = event.payloadJson as CrmWinPayload
    const tenant = await prisma.tenant.findUnique({
      where: { id: input.tenantId },
      select: { id: true, slug: true },
    })

    if (!tenant) {
      throw new NotFoundError('Tenant', input.tenantId)
    }

    const rematerialized = await this.tryMaterializarEvento({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      eventId: event.id,
      body: payload,
      ipOrigem: input.ipOrigem,
      userAgent: input.userAgent,
    })

    await registrarAuditoria({
      tenantId: input.tenantId,
      usuarioId: input.requester.id,
      usuarioNome: input.requester.nome,
      usuarioEmail: input.requester.email,
      usuarioPerfil: input.requester.perfil,
      acao: 'integracao.itecologica.crm_win.reprocessada',
      entidadeTipo: 'integracao_evento',
      entidadeId: event.id,
      dadosDepois: rematerialized,
      ipOrigem: input.ipOrigem,
      userAgent: input.userAgent,
      contexto: {
        sourceSystem: event.sourceSystem,
        eventName: event.eventName,
        handoffId: payload.handoff_id,
        leadId: payload.source.lead_id,
      },
    })

    return {
      alreadyMaterialized: false,
      event: rematerialized.event,
      summary: rematerialized.summary,
    }
  }

  async receiveCrmWin(input: ReceiveCrmWinInput) {
    const { body, idempotencyKey, sourceSystem, ipOrigem, userAgent } = input

    const tenant = await prisma.tenant.findUnique({
      where: { slug: body.target_tenant_slug },
      select: { id: true, slug: true, nome: true },
    })

    if (!tenant) {
      throw new NotFoundError('Tenant', body.target_tenant_slug)
    }

    const existing = await prisma.integracaoEvento.findUnique({
      where: {
        tenantId_sourceSystem_idempotencyKey: {
          tenantId: tenant.id,
          sourceSystem,
          idempotencyKey,
        },
      },
    })

    if (existing) {
      const sameEventName = existing.eventName === 'crm.win_to_posto.v1'
      const sameLeadId =
        typeof existing.payloadJson === 'object'
          && existing.payloadJson !== null
          && 'source' in existing.payloadJson
          && typeof (existing.payloadJson as { source?: { lead_id?: string } }).source?.lead_id === 'string'
          && (existing.payloadJson as { source?: { lead_id?: string } }).source?.lead_id === body.source.lead_id

      if (!sameEventName || !sameLeadId) {
        throw new ConflictError('Chave de idempotência já usada por um evento diferente')
      }

      if (existing.status !== 'materialized') {
        const rematerialized = await this.tryMaterializarEvento({
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          eventId: existing.id,
          body,
          ipOrigem,
          userAgent,
        })

        return { existing: true, tenant, event: rematerialized.event, summary: rematerialized.summary }
      }

      return { existing: true, tenant, event: existing, summary: null }
    }

    const event = await prisma.integracaoEvento.create({
      data: {
        tenantId: tenant.id,
        sourceSystem,
        eventName: 'crm.win_to_posto.v1',
        idempotencyKey,
        payloadJson: JSON.parse(JSON.stringify(body)),
        status: 'received',
      },
    })

    await registrarAuditoria({
      tenantId: tenant.id,
      usuarioNome: 'Integração ITECOLOGICA',
      usuarioEmail: 'integracao@itecologica.local',
      usuarioPerfil: 'SISTEMA',
      acao: 'integracao.itecologica.crm_win.recebida',
      entidadeTipo: 'integracao_evento',
      entidadeId: event.id,
      dadosDepois: event,
      ipOrigem,
      userAgent,
      contexto: {
        sourceSystem,
        eventName: event.eventName,
        tenantSlug: tenant.slug,
        leadId: body.source.lead_id,
        diagnosisCaseId: body.diagnosis.diagnosis_case_id,
        proposalExternalId: body.commercial.proposal_external_id,
      },
    })

    const materializedEvent = await this.tryMaterializarEvento({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      eventId: event.id,
      body,
      ipOrigem,
      userAgent,
    })

    return { existing: false, tenant, event: materializedEvent.event, summary: materializedEvent.summary }
  }

  private async tryMaterializarEvento(args: {
    tenantId: string
    tenantSlug: string
    eventId: string
    body: CrmWinPayload
    ipOrigem?: string
    userAgent?: string
  }) {
    try {
      return await this.materializarEvento(args)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida na materializacao'

      const failedEvent = await prisma.integracaoEvento.update({
        where: { id: args.eventId },
        data: {
          status: 'failed',
          errorMessage: message.slice(0, 1000),
          processedAt: new Date(),
        },
        select: integracaoEventoSelect,
      })

      await registrarAuditoria({
        tenantId: args.tenantId,
        usuarioNome: 'Integração ITECOLOGICA',
        usuarioEmail: 'integracao@itecologica.local',
        usuarioPerfil: 'SISTEMA',
        acao: 'integracao.itecologica.crm_win.falha_materializacao',
        entidadeTipo: 'integracao_evento',
        entidadeId: failedEvent.id,
        dadosDepois: failedEvent,
        ipOrigem: args.ipOrigem,
        userAgent: args.userAgent,
        contexto: {
          tenantSlug: args.tenantSlug,
          handoffId: args.body.handoff_id,
          leadId: args.body.source.lead_id,
          diagnosisCaseId: args.body.diagnosis.diagnosis_case_id,
          proposalExternalId: args.body.commercial.proposal_external_id,
          errorMessage: message,
        },
      })

      throw error
    }
  }

  private async materializarEvento(args: {
    tenantId: string
    tenantSlug: string
    eventId: string
    body: CrmWinPayload
    ipOrigem?: string
    userAgent?: string
  }) {
    const { tenantId, tenantSlug, eventId, body, ipOrigem, userAgent } = args

    const actor = await this.resolveIntegrationActor(
      tenantId,
      body.operation.operational_owner_email,
      body.operation.responsavel_tecnico_email,
    )

    const result = await prisma.$transaction(async (tx) => {
      const empresa = await this.findOrCreateEmpresa(tx, tenantId, body)
      const empreendimento = await this.findOrCreateEmpreendimento(tx, tenantId, empresa.record.id, body)
      await this.ensureEmpreendimentoAccess(tx, actor.id, empreendimento.record.id)
      const tarefa = await this.findOrCreateTarefaInicial(tx, tenantId, actor.id, empreendimento.record.id, body)
      const executionPlanTasksCreated = await this.materializeExecutionPlanTasks(
        tx,
        tenantId,
        actor.id,
        empreendimento.record.id,
        body,
      )

      const event = await tx.integracaoEvento.update({
        where: { id: eventId },
        data: {
          status: 'materialized',
          processedAt: new Date(),
          errorMessage: null,
          empresaId: empresa.record.id,
          empreendimentoId: empreendimento.record.id,
          tarefaId: tarefa.record.id,
        },
      })

      return { empresa, empreendimento, tarefa, executionPlanTasksCreated, event, actor }
    })

    const complianceQueued = await this.ensureComplianceBootstrap(result.event.tenantId, result.empreendimento.record.id)
    const portalBootstrap = await this.ensurePortalBootstrap({
      tenantId,
      empreendimentoId: result.empreendimento.record.id,
      empreendimentoNome: result.empreendimento.record.nome,
      contatoEmail: result.empreendimento.record.contatoEmail,
      solicitadoPorId: result.actor.id,
    })

    await registrarAuditoria({
      tenantId,
      usuarioId: actor.id,
      usuarioNome: actor.nome,
      usuarioEmail: actor.email,
      usuarioPerfil: actor.perfil,
      acao: 'integracao.itecologica.crm_win.materializada',
      entidadeTipo: 'integracao_evento',
      entidadeId: result.event.id,
      dadosDepois: {
        empresaId: result.empresa.record.id,
        empreendimentoId: result.empreendimento.record.id,
        tarefaId: result.tarefa.record.id,
        empresaCriada: result.empresa.created,
        empreendimentoCriado: result.empreendimento.created,
        tarefaCriada: result.tarefa.created,
        executionPlanTasksCreated: result.executionPlanTasksCreated,
        complianceQueued,
        portalTokenCreated: portalBootstrap.portalTokenCreated,
        portalInviteQueued: portalBootstrap.portalInviteQueued,
      },
      ipOrigem,
      userAgent,
      contexto: {
        tenantSlug,
        handoffId: body.handoff_id,
        leadId: body.source.lead_id,
        diagnosisCaseId: body.diagnosis.diagnosis_case_id,
        proposalExternalId: body.commercial.proposal_external_id,
      },
    })

    return {
      event: result.event,
      summary: {
        empresa: {
          id: result.empresa.record.id,
          created: result.empresa.created,
        },
        empreendimento: {
          id: result.empreendimento.record.id,
          created: result.empreendimento.created,
        },
        tarefa: {
          id: result.tarefa.record.id,
          created: result.tarefa.created,
        },
        bootstrap: {
          complianceQueued,
          portalTokenCreated: portalBootstrap.portalTokenCreated,
          portalInviteQueued: portalBootstrap.portalInviteQueued,
        },
        executionPlan: {
          tasksCreated: result.executionPlanTasksCreated,
        },
      } satisfies MaterializationSummary,
    }
  }

  private parseExecutionPlan(body: CrmWinPayload): ExecutionPlanPayload | null {
    const value = body.diagnosis.official_execution_plan
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as ExecutionPlanPayload
  }

  private mapTaskPriority(priority?: string | null): PrioridadeTarefa {
    switch (priority) {
      case 'critica':
        return 'CRITICA'
      case 'alta':
        return 'ALTA'
      case 'baixa':
        return 'BAIXA'
      case 'media':
      default:
        return 'MEDIA'
    }
  }

  private buildExecutionPlanTaskDueDate(expectedDays?: number | null) {
    if (!expectedDays || expectedDays <= 0) return undefined
    return new Date(Date.now() + expectedDays * 24 * 60 * 60 * 1000)
  }

  private async materializeExecutionPlanTasks(
    tx: Prisma.TransactionClient,
    tenantId: string,
    criadorId: string,
    empreendimentoId: string,
    body: CrmWinPayload,
  ) {
    const executionPlan = this.parseExecutionPlan(body)
    const tasks = executionPlan?.tasks

    if (!tasks?.length) return 0

    const responsavel = body.operation.operational_owner_email
      ? await tx.usuario.findFirst({
          where: {
            tenantId,
            ativo: true,
            email: body.operation.operational_owner_email,
          },
          select: { id: true },
        })
      : null

    let createdCount = 0

    for (const planTask of tasks) {
      if (!planTask?.code || planTask.code === 'task_consolidar_diagnostico') continue

      const regraOrigemId = `${body.handoff_id}:${planTask.code}`
      const existing = await tx.tarefa.findFirst({
        where: {
          tenantId,
          empreendimentoId,
          regraOrigemId,
        },
        select: { id: true },
      })

      if (existing) continue

      await tx.tarefa.create({
        data: {
          tenantId,
          empreendimentoId,
          titulo: planTask.title,
          descricao: planTask.description || undefined,
          prioridade: this.mapTaskPriority(planTask.priority),
          origem: 'WORKFLOW',
          regraOrigemId,
          responsavelId: responsavel?.id || criadorId,
          criadorId,
          dataVencimento: this.buildExecutionPlanTaskDueDate(planTask.expectedDays),
          status: 'PENDENTE',
          metadados: {
            sourceSystem: 'itecologica',
            handoffId: body.handoff_id,
            diagnosisCaseId: body.diagnosis.diagnosis_case_id,
            proposalExternalId: body.commercial.proposal_external_id,
            executionPlanTask: {
              code: planTask.code,
              phaseCode: planTask.phaseCode,
              owner: planTask.owner,
              expectedDays: planTask.expectedDays,
              obligationCode: planTask.obligationCode ?? null,
              serviceCode: planTask.serviceCode ?? null,
            },
          },
        },
      })

      createdCount += 1
    }

    return createdCount
  }

  private async ensureComplianceBootstrap(tenantId: string, empreendimentoId: string) {
    const existingSnapshot = await prisma.complianceSnapshot.findFirst({
      where: { tenantId, empreendimentoId },
      select: { id: true },
      orderBy: { calculadoEm: 'desc' },
    })

    if (existingSnapshot) return false

    await complianceQueue.add('calcular-compliance', {
      tenantId,
      empreendimentoId,
    })

    return true
  }

  private async ensurePortalBootstrap(args: {
    tenantId: string
    empreendimentoId: string
    empreendimentoNome: string
    contatoEmail?: string | null
    solicitadoPorId: string
  }) {
    const contatoEmail = args.contatoEmail?.trim().toLowerCase()
    if (!contatoEmail) {
      return {
        portalTokenCreated: false,
        portalInviteQueued: false,
      }
    }

    const existingToken = await prisma.tokenPortal.findFirst({
      where: {
        tenantId: args.tenantId,
        empreendimentoId: args.empreendimentoId,
        emailDestinatario: contatoEmail,
        usadoEm: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
      orderBy: { criadoEm: 'desc' },
    })

    if (existingToken) {
      return {
        portalTokenCreated: false,
        portalInviteQueued: false,
      }
    }

    const token = gerarPortalToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await prisma.tokenPortal.create({
      data: {
        tenantId: args.tenantId,
        empreendimentoId: args.empreendimentoId,
        solicitadoPorId: args.solicitadoPorId,
        emailDestinatario: contatoEmail,
        nomeContato: args.empreendimentoNome,
        token: hashPortalToken(token),
        expiresAt,
      },
    })

    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000'
    const link = `${webUrl}/portal/login?token=${token}`

    await emailQueue.add('convite-portal-auto', {
      tipo: 'magic_link',
      email: contatoEmail,
      link,
      empreendimento: args.empreendimentoNome,
      expiresIn: '30 dias',
    })

    return {
      portalTokenCreated: true,
      portalInviteQueued: true,
    }
  }

  private async resolveIntegrationActor(
    tenantId: string,
    operationalOwnerEmail?: string | null,
    responsavelTecnicoEmail?: string | null,
  ) {
    const preferredEmails = [operationalOwnerEmail, responsavelTecnicoEmail]
      .map((value) => value?.trim().toLowerCase())
      .filter(Boolean) as string[]

    if (preferredEmails.length > 0) {
      const preferred = await prisma.usuario.findFirst({
        where: {
          tenantId,
          ativo: true,
          email: { in: preferredEmails },
        },
        orderBy: { criadoEm: 'asc' },
        select: { id: true, nome: true, email: true, perfil: true },
      })

      if (preferred) return preferred
    }

    const fallback = await prisma.usuario.findFirst({
      where: {
        tenantId,
        ativo: true,
        perfil: { in: ['ADMIN_TENANT', 'COORDENADOR', 'SUPER_ADMIN', 'ANALISTA'] },
      },
      orderBy: [{ perfil: 'asc' }, { criadoEm: 'asc' }],
      select: { id: true, nome: true, email: true, perfil: true },
    })

    if (!fallback) {
      throw new UnprocessableError('Tenant de destino sem usuário ativo disponível para assumir a integração')
    }

    return fallback
  }

  private async findOrCreateEmpresa(
    tx: Prisma.TransactionClient,
    tenantId: string,
    body: CrmWinPayload,
  ) {
    const existing = await tx.empresa.findFirst({
      where: {
        tenantId,
        cnpj: body.company.cnpj,
      },
    })

    if (existing) {
      return { record: existing, created: false }
    }

    const created = await tx.empresa.create({
      data: {
        tenantId,
        nome: body.company.company_name,
        razaoSocial: body.company.legal_name,
        cnpj: body.company.cnpj,
      },
    })

    return { record: created, created: true }
  }

  private async findOrCreateEmpreendimento(
    tx: Prisma.TransactionClient,
    tenantId: string,
    empresaId: string,
    body: CrmWinPayload,
  ) {
    const existing = await tx.empreendimento.findFirst({
      where: {
        tenantId,
        empresaId,
        OR: [
          { nome: { equals: body.enterprise.enterprise_name, mode: 'insensitive' } },
          ...(body.company.cnpj ? [{ cnpj: body.company.cnpj }] : []),
        ],
      },
    })

    if (existing) {
      return { record: existing, created: false }
    }

    const created = await tx.empreendimento.create({
      data: {
        tenantId,
        empresaId,
        nome: body.enterprise.enterprise_name,
        nomeFantasia: body.company.company_name || body.enterprise.enterprise_name,
        cnpj: body.company.cnpj,
        bandeira: body.enterprise.brand || undefined,
        tipo: body.enterprise.enterprise_type,
        logradouro: body.enterprise.logradouro,
        numero: body.enterprise.numero,
        complemento: body.enterprise.complemento || undefined,
        bairro: body.enterprise.bairro,
        cidade: body.enterprise.cidade,
        estado: body.enterprise.estado,
        cep: body.enterprise.cep,
        responsavelTecnicoNome: body.operation.responsavel_tecnico_nome || undefined,
        responsavelTecnicoCrea: body.operation.responsavel_tecnico_crea || undefined,
        responsavelTecnicoEmail: body.operation.responsavel_tecnico_email || undefined,
        contatoEmail: body.company.primary_contact_email,
        contatoTelefone: body.company.primary_contact_phone,
        atividades: body.enterprise.atividades,
        dataInicioOperacao: body.enterprise.data_inicio_operacao
          ? new Date(`${body.enterprise.data_inicio_operacao}T00:00:00.000Z`)
          : undefined,
      },
    })

    return { record: created, created: true }
  }

  private async ensureEmpreendimentoAccess(
    tx: Prisma.TransactionClient,
    usuarioId: string,
    empreendimentoId: string,
  ) {
    const existing = await tx.empreendimentoAcesso.findUnique({
      where: {
        usuarioId_empreendimentoId: {
          usuarioId,
          empreendimentoId,
        },
      },
    })

    if (existing) {
      return { ...existing, created: false }
    }

    return tx.empreendimentoAcesso.create({
      data: {
        usuarioId,
        empreendimentoId,
      },
    })
  }

  private async findOrCreateTarefaInicial(
    tx: Prisma.TransactionClient,
    tenantId: string,
    criadorId: string,
    empreendimentoId: string,
    body: CrmWinPayload,
  ) {
    const existing = await tx.tarefa.findFirst({
      where: {
        tenantId,
        empreendimentoId,
        regraOrigemId: body.handoff_id,
      },
    })

    if (existing) return { record: existing, created: false }

    const responsavel = body.operation.operational_owner_email
      ? await tx.usuario.findFirst({
          where: {
            tenantId,
            ativo: true,
            email: body.operation.operational_owner_email,
          },
          select: { id: true },
        })
      : null

    const created = await tx.tarefa.create({
      data: {
        tenantId,
        empreendimentoId,
        titulo: body.operation.initial_task_title,
        descricao: body.operation.initial_task_description || undefined,
        prioridade: 'ALTA',
        origem: 'WORKFLOW',
        regraOrigemId: body.handoff_id,
        responsavelId: responsavel?.id || criadorId,
        criadorId,
        dataVencimento: body.operation.initial_due_date
          ? new Date(body.operation.initial_due_date)
          : undefined,
        status: 'PENDENTE',
        metadados: {
          sourceSystem: 'itecologica',
          handoffId: body.handoff_id,
          diagnosisCaseId: body.diagnosis.diagnosis_case_id,
          proposalExternalId: body.commercial.proposal_external_id,
          officialDiagnostic: body.diagnosis.official_diagnostic_result
            ? {
                artifactId: body.diagnosis.official_diagnostic_artifact_id ?? null,
                generatedAt: body.diagnosis.official_artifacts_generated_at ?? null,
                riskScore: body.diagnosis.official_diagnostic_result.riskScore ?? null,
                riskLevel: body.diagnosis.official_diagnostic_result.riskLevel ?? null,
                impactClass: body.diagnosis.official_diagnostic_result.impactClass ?? null,
                licensingType: body.diagnosis.official_diagnostic_result.licensingType ?? null,
                licensingAgency: body.diagnosis.official_diagnostic_result.licensingAgency ?? null,
              }
            : null,
          officialExecutionPlan: body.diagnosis.official_execution_plan
            ? {
                artifactId: body.diagnosis.official_execution_plan_artifact_id ?? null,
                generatedAt: body.diagnosis.official_artifacts_generated_at ?? null,
                summary:
                  typeof body.diagnosis.official_execution_plan.summary === 'object'
                    ? body.diagnosis.official_execution_plan.summary
                    : null,
              }
            : null,
        },
      },
    })

    return { record: created, created: true }
  }
}

export const integracoesItecologicaService = new IntegracoesItecologicaService()
