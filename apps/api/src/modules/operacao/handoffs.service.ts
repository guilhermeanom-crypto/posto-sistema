import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../../infra/database/prisma.js'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import {
  assertPodeAceitarHandoffOperacional,
  assertTransicaoStatusPermitida,
} from './handoffs-rules.js'
import type {
  AtualizarHandoffComercialInput,
  BuscarHandoffComercialPorIdInput,
  CriarHandoffComercialInput,
  HandoffComercialCriado,
  HandoffComercialDetalhe,
  HandoffComercialResumo,
  ListarHandoffsComerciaisInput,
  ListarHandoffsComerciaisResult,
  OrigemSnapshotSaneadoHandoff,
  PrioridadeOperacionalHandoff,
  ServicosResumoHandoff,
  StatusHandoffComercial,
  StatusHandoffAtivo,
} from './handoffs.types.js'
import { STATUS_HANDOFF_ATIVOS } from './handoffs.types.js'

const PERFIS_SENSIVEIS_HANDOFF = [
  'COORDENADOR',
  'ADMIN_TENANT',
  'SUPER_ADMIN',
] as const

interface PropostaOrigemParaHandoff {
  id: string
  tenantId: string
  leadWhatsAppId: string | null
  empreendimentoId: string | null
  criadoPorId: string
  numero: string
  origem: 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL'
  status: string
  nomeLead: string | null
  empresaLead: string | null
  documentoLead: string | null
  emailContato: string | null
  telefoneContato: string | null
  municipio: string | null
  uf: string
  dataValidade: Date
  observacoesComerciais: string | null
  aprovadaEm: Date | null
  diagnostico: {
    cnaePrincipalCodigo: string
    cnaePrincipalDescricao: string
    riscoNivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
    riscoScore: number
    potencialPoluidor: 'BAIXO' | 'MEDIO' | 'ALTO'
    licenciamentoTipo: string
    orgaoCompetente: string
    esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL'
    alertas: string[]
    proximosPassos: string[]
  }
  itens: Array<{
    id: string
    nomeServico: string
    categoriaServico: string
    quantidade: number
    observacaoLinha: string | null
    ativo: boolean
  }>
}

interface HandoffAtivoExistenteRow {
  id: string
  status: StatusHandoffAtivo
}

interface HandoffInsertRow {
  id: string
  tenant_id: string
  proposta_comercial_id: string
  lead_whatsapp_id: string | null
  empreendimento_id: string | null
  criado_por_id: string
  responsavel_comercial_id: string
  responsavel_operacional_id: string | null
  status: StatusHandoffComercial
  status_proposta_origem: 'APROVADA'
  origem_proposta: 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL'
  numero_proposta: string
  data_aprovacao_proposta: Date | null
  data_validade_proposta: Date | null
  nome_lead: string | null
  empresa_lead: string | null
  documento_lead: string | null
  email_contato: string | null
  telefone_contato: string | null
  municipio: string | null
  uf: string | null
  cnae_principal_codigo: string | null
  cnae_principal_descricao: string | null
  risco_nivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' | null
  risco_score: number | null
  potencial_poluidor: 'BAIXO' | 'MEDIO' | 'ALTO' | null
  licenciamento_tipo: string | null
  orgao_competente: string | null
  esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | null
  alertas_resumo: string[]
  proximos_passos_resumo: string[]
  observacoes_liberadas: string | null
  servicos_resumo: ServicosResumoHandoff
  origem_snapshot_saneado: OrigemSnapshotSaneadoHandoff
  pendencias_operacionais: string[]
  observacoes_operacionais: string | null
  observacoes_planejamento: string | null
  prioridade_operacional: PrioridadeOperacionalHandoff | null
  necessidade_documentos: boolean | null
  necessidade_visita: boolean | null
  necessidade_terceiro: boolean | null
  assumido_em: Date | null
  concluido_em: Date | null
  cancelado_em: Date | null
  criado_em: Date
  atualizado_em: Date
}

interface HandoffSummaryRow {
  id: string
  proposta_comercial_id: string
  lead_whatsapp_id: string | null
  empreendimento_id: string | null
  criado_por_id: string
  responsavel_comercial_id: string
  responsavel_operacional_id: string | null
  status: StatusHandoffComercial
  status_proposta_origem: 'APROVADA'
  origem_proposta: 'TRIAGEM_CNAE' | 'CRM' | 'ONBOARDING' | 'MANUAL'
  numero_proposta: string
  nome_lead: string | null
  empresa_lead: string | null
  municipio: string | null
  uf: string | null
  prioridade_operacional: PrioridadeOperacionalHandoff | null
  necessidade_documentos: boolean | null
  necessidade_visita: boolean | null
  necessidade_terceiro: boolean | null
  cnae_principal_codigo: string | null
  cnae_principal_descricao: string | null
  risco_nivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' | null
  potencial_poluidor: 'BAIXO' | 'MEDIO' | 'ALTO' | null
  criado_em: Date
  atualizado_em: Date
}

interface CountRow {
  total: bigint | number
}

interface UsuarioContextoHandoff {
  id: string
  nome: string
  email: string
  perfil: string
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === undefined || value === null) return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

function textArraySql(values: string[]) {
  return values.length > 0
    ? Prisma.sql`ARRAY[${Prisma.join(values)}]`
    : Prisma.sql`ARRAY[]::text[]`
}

function normalizeStringArray(values: string[] | undefined) {
  if (!values) return undefined

  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function isPerfilSensivelParaHandoff(perfil: string) {
  return PERFIS_SENSIVEIS_HANDOFF.includes(perfil as (typeof PERFIS_SENSIVEIS_HANDOFF)[number])
}

function buildServicosResumo(proposta: PropostaOrigemParaHandoff): ServicosResumoHandoff {
  return proposta.itens
    .filter((item) => item.ativo)
    .map((item) => ({
      itemId: item.id,
      nome: item.nomeServico,
      categoria: item.categoriaServico,
      quantidade: item.quantidade,
      escopoAprovado: normalizeNullableText(item.observacaoLinha) ?? undefined,
    }))
}

function buildOrigemSnapshotSaneado(proposta: PropostaOrigemParaHandoff): OrigemSnapshotSaneadoHandoff {
  const observacoesLiberadas = normalizeNullableText(proposta.observacoesComerciais)

  return {
    schemaVersion: 1,
    proposta: {
      id: proposta.id,
      numero: proposta.numero,
      origem: proposta.origem,
      statusOrigem: 'APROVADA',
      dataAprovacao: toIsoDate(proposta.aprovadaEm),
      dataValidade: toIsoDate(proposta.dataValidade),
    },
    contato: {
      nomeLead: proposta.nomeLead,
      empresaLead: proposta.empresaLead,
      documentoLead: proposta.documentoLead,
      emailContato: proposta.emailContato,
      telefoneContato: proposta.telefoneContato,
      municipio: proposta.municipio,
      uf: proposta.uf,
    },
    referencias: {
      tenantId: proposta.tenantId,
      leadWhatsAppId: proposta.leadWhatsAppId,
      empreendimentoId: proposta.empreendimentoId,
      propostaComercialId: proposta.id,
    },
    diagnostico: {
      cnaePrincipalCodigo: proposta.diagnostico.cnaePrincipalCodigo,
      cnaePrincipalDescricao: proposta.diagnostico.cnaePrincipalDescricao,
      riscoNivel: proposta.diagnostico.riscoNivel,
      riscoScore: proposta.diagnostico.riscoScore,
      potencialPoluidor: proposta.diagnostico.potencialPoluidor,
      licenciamentoTipo: proposta.diagnostico.licenciamentoTipo,
      orgaoCompetente: proposta.diagnostico.orgaoCompetente,
      esfera: proposta.diagnostico.esfera,
      alertasResumo: proposta.diagnostico.alertas,
      proximosPassosResumo: proposta.diagnostico.proximosPassos,
    },
    comercial: {
      observacoesLiberadas,
    },
  }
}

function assertPropostaAprovada(proposta: PropostaOrigemParaHandoff) {
  if (proposta.status !== 'APROVADA') {
    throw new ConflictError('A proposta comercial precisa estar em APROVADA para gerar handoff.', 'PROPOSTA_NAO_APROVADA')
  }
}

async function assertSemHandoffAtivo(tx: Prisma.TransactionClient, tenantId: string, propostaComercialId: string) {
  const activeStatusSql = Prisma.join(
    STATUS_HANDOFF_ATIVOS.map((status) => Prisma.sql`CAST(${status} AS "StatusHandoffComercial")`),
  )

  const rows = await tx.$queryRaw<HandoffAtivoExistenteRow[]>(Prisma.sql`
    SELECT id, status
    FROM handoffs_comerciais
    WHERE tenant_id = ${tenantId}
      AND proposta_comercial_id = ${propostaComercialId}
      AND status IN (${activeStatusSql})
    LIMIT 1
  `)

  if (rows.length > 0) {
    throw new ConflictError(
      `Já existe um handoff ativo para a proposta informada (status atual: ${rows[0]!.status}).`,
      'HANDOFF_ATIVO_EXISTENTE',
    )
  }
}

function mapHandoffRow(row: HandoffInsertRow): HandoffComercialDetalhe {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    propostaComercialId: row.proposta_comercial_id,
    leadWhatsAppId: row.lead_whatsapp_id,
    empreendimentoId: row.empreendimento_id,
    criadoPorId: row.criado_por_id,
    responsavelComercialId: row.responsavel_comercial_id,
    responsavelOperacionalId: row.responsavel_operacional_id,
    status: row.status,
    statusPropostaOrigem: row.status_proposta_origem,
    origemProposta: row.origem_proposta,
    numeroProposta: row.numero_proposta,
    dataAprovacaoProposta: row.data_aprovacao_proposta,
    dataValidadeProposta: row.data_validade_proposta,
    nomeLead: row.nome_lead,
    empresaLead: row.empresa_lead,
    documentoLead: row.documento_lead,
    emailContato: row.email_contato,
    telefoneContato: row.telefone_contato,
    municipio: row.municipio,
    uf: row.uf,
    cnaePrincipalCodigo: row.cnae_principal_codigo,
    cnaePrincipalDescricao: row.cnae_principal_descricao,
    riscoNivel: row.risco_nivel,
    riscoScore: row.risco_score,
    potencialPoluidor: row.potencial_poluidor,
    licenciamentoTipo: row.licenciamento_tipo,
    orgaoCompetente: row.orgao_competente,
    esfera: row.esfera,
    alertasResumo: row.alertas_resumo,
    proximosPassosResumo: row.proximos_passos_resumo,
    observacoesLiberadas: row.observacoes_liberadas,
    servicosResumo: row.servicos_resumo,
    origemSnapshotSaneado: row.origem_snapshot_saneado,
    pendenciasOperacionais: row.pendencias_operacionais,
    observacoesOperacionais: row.observacoes_operacionais,
    observacoesPlanejamento: row.observacoes_planejamento,
    prioridadeOperacional: row.prioridade_operacional,
    necessidadeDocumentos: row.necessidade_documentos,
    necessidadeVisita: row.necessidade_visita,
    necessidadeTerceiro: row.necessidade_terceiro,
    assumidoEm: row.assumido_em,
    concluidoEm: row.concluido_em,
    canceladoEm: row.cancelado_em,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  }
}

function mapHandoffSummaryRow(row: HandoffSummaryRow): HandoffComercialResumo {
  return {
    id: row.id,
    propostaComercialId: row.proposta_comercial_id,
    leadWhatsAppId: row.lead_whatsapp_id,
    empreendimentoId: row.empreendimento_id,
    criadoPorId: row.criado_por_id,
    responsavelComercialId: row.responsavel_comercial_id,
    responsavelOperacionalId: row.responsavel_operacional_id,
    status: row.status,
    statusPropostaOrigem: row.status_proposta_origem,
    origemProposta: row.origem_proposta,
    numeroProposta: row.numero_proposta,
    nomeLead: row.nome_lead,
    empresaLead: row.empresa_lead,
    municipio: row.municipio,
    uf: row.uf,
    cnaePrincipalCodigo: row.cnae_principal_codigo,
    cnaePrincipalDescricao: row.cnae_principal_descricao,
    riscoNivel: row.risco_nivel,
    potencialPoluidor: row.potencial_poluidor,
    prioridadeOperacional: row.prioridade_operacional,
    necessidadeDocumentos: row.necessidade_documentos,
    necessidadeVisita: row.necessidade_visita,
    necessidadeTerceiro: row.necessidade_terceiro,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  }
}

function buildHandoffFiltersSql(input: Pick<ListarHandoffsComerciaisInput, 'tenantId' | 'status' | 'propostaComercialId' | 'empreendimentoId' | 'responsavelComercialId' | 'responsavelOperacionalId' | 'prioridadeOperacional' | 'comNecessidadeDocumentos' | 'comNecessidadeVisita' | 'comNecessidadeTerceiro' | 'apenasAtivos'>) {
  const conditions: Prisma.Sql[] = [Prisma.sql`tenant_id = ${input.tenantId}`]

  if (input.status) {
    conditions.push(Prisma.sql`status = CAST(${input.status} AS "StatusHandoffComercial")`)
  }
  if (input.propostaComercialId) {
    conditions.push(Prisma.sql`proposta_comercial_id = ${input.propostaComercialId}`)
  }
  if (input.empreendimentoId) {
    conditions.push(Prisma.sql`empreendimento_id = ${input.empreendimentoId}`)
  }
  if (input.responsavelComercialId) {
    conditions.push(Prisma.sql`responsavel_comercial_id = ${input.responsavelComercialId}`)
  }
  if (input.responsavelOperacionalId) {
    conditions.push(Prisma.sql`responsavel_operacional_id = ${input.responsavelOperacionalId}`)
  }
  if (input.prioridadeOperacional) {
    conditions.push(Prisma.sql`prioridade_operacional = ${input.prioridadeOperacional}`)
  }
  if (input.comNecessidadeDocumentos) {
    conditions.push(Prisma.sql`necessidade_documentos = TRUE`)
  }
  if (input.comNecessidadeVisita) {
    conditions.push(Prisma.sql`necessidade_visita = TRUE`)
  }
  if (input.comNecessidadeTerceiro) {
    conditions.push(Prisma.sql`necessidade_terceiro = TRUE`)
  }
  if (input.apenasAtivos) {
    conditions.push(
      Prisma.sql`status IN (${Prisma.join(
        STATUS_HANDOFF_ATIVOS.map(
          (status) => Prisma.sql`CAST(${status} AS "StatusHandoffComercial")`,
        ),
      )})`,
    )
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
}

export class HandoffsService {
  private async buscarUsuarioContexto(tenantId: string, usuarioId: string): Promise<UsuarioContextoHandoff> {
    const usuario = await prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        tenantId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
      },
    })

    if (!usuario) {
      throw new NotFoundError('Usuário', usuarioId)
    }

    return usuario
  }

  async criar(input: CriarHandoffComercialInput): Promise<HandoffComercialCriado> {
    const usuario = await this.buscarUsuarioContexto(input.tenantId, input.usuarioId)

    const proposta = await prisma.propostaComercial.findFirst({
      where: {
        id: input.propostaComercialId,
        tenantId: input.tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        leadWhatsAppId: true,
        empreendimentoId: true,
        criadoPorId: true,
        numero: true,
        origem: true,
        status: true,
        nomeLead: true,
        empresaLead: true,
        documentoLead: true,
        emailContato: true,
        telefoneContato: true,
        municipio: true,
        uf: true,
        dataValidade: true,
        observacoesComerciais: true,
        aprovadaEm: true,
        diagnostico: {
          select: {
            cnaePrincipalCodigo: true,
            cnaePrincipalDescricao: true,
            riscoNivel: true,
            riscoScore: true,
            potencialPoluidor: true,
            licenciamentoTipo: true,
            orgaoCompetente: true,
            esfera: true,
            alertas: true,
            proximosPassos: true,
          },
        },
        itens: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            nomeServico: true,
            categoriaServico: true,
            quantidade: true,
            observacaoLinha: true,
            ativo: true,
          },
        },
      },
    }) as PropostaOrigemParaHandoff | null

    if (!proposta) {
      throw new NotFoundError('Proposta comercial', input.propostaComercialId)
    }

    assertPropostaAprovada(proposta)

    const servicosResumo = buildServicosResumo(proposta)
    const origemSnapshotSaneado = buildOrigemSnapshotSaneado(proposta)
    const observacoesLiberadas = normalizeNullableText(proposta.observacoesComerciais)

    const created = await prisma.$transaction(async (tx) => {
      await assertSemHandoffAtivo(tx, input.tenantId, input.propostaComercialId)

      const rows = await tx.$queryRaw<HandoffInsertRow[]>(Prisma.sql`
        INSERT INTO handoffs_comerciais (
          id,
          tenant_id,
          proposta_comercial_id,
          lead_whatsapp_id,
          empreendimento_id,
          criado_por_id,
          responsavel_comercial_id,
          responsavel_operacional_id,
          status,
          status_proposta_origem,
          origem_proposta,
          numero_proposta,
          data_aprovacao_proposta,
          data_validade_proposta,
          nome_lead,
          empresa_lead,
          documento_lead,
          email_contato,
          telefone_contato,
          municipio,
          uf,
          cnae_principal_codigo,
          cnae_principal_descricao,
          risco_nivel,
          risco_score,
          potencial_poluidor,
          licenciamento_tipo,
          orgao_competente,
          esfera,
          alertas_resumo,
          proximos_passos_resumo,
          observacoes_liberadas,
          servicos_resumo,
          origem_snapshot_saneado,
          pendencias_operacionais,
          observacoes_operacionais,
          observacoes_planejamento,
          prioridade_operacional,
          necessidade_documentos,
          necessidade_visita,
          necessidade_terceiro,
          assumido_em,
          concluido_em,
          cancelado_em,
          atualizado_em
        )
        VALUES (
          ${randomUUID()},
          ${input.tenantId},
          ${proposta.id},
          ${proposta.leadWhatsAppId},
          ${proposta.empreendimentoId},
          ${input.usuarioId},
          ${proposta.criadoPorId},
          NULL,
          CAST(${'AGUARDANDO_HANDOFF'} AS "StatusHandoffComercial"),
          CAST(${'APROVADA'} AS "StatusPropostaComercial"),
          CAST(${proposta.origem} AS "OrigemPropostaComercial"),
          ${proposta.numero},
          ${proposta.aprovadaEm},
          ${proposta.dataValidade},
          ${proposta.nomeLead},
          ${proposta.empresaLead},
          ${proposta.documentoLead},
          ${proposta.emailContato},
          ${proposta.telefoneContato},
          ${proposta.municipio},
          ${proposta.uf},
          ${proposta.diagnostico.cnaePrincipalCodigo},
          ${proposta.diagnostico.cnaePrincipalDescricao},
          CAST(${proposta.diagnostico.riscoNivel} AS "NivelRiscoComercial"),
          ${proposta.diagnostico.riscoScore},
          CAST(${proposta.diagnostico.potencialPoluidor} AS "PotencialPoluidorComercial"),
          ${proposta.diagnostico.licenciamentoTipo},
          ${proposta.diagnostico.orgaoCompetente},
          CAST(${proposta.diagnostico.esfera} AS "EsferaRegulatoria"),
          ${textArraySql(proposta.diagnostico.alertas)},
          ${textArraySql(proposta.diagnostico.proximosPassos)},
          ${observacoesLiberadas},
          CAST(${JSON.stringify(servicosResumo)} AS jsonb),
          CAST(${JSON.stringify(origemSnapshotSaneado)} AS jsonb),
          ARRAY[]::text[],
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NOW()
        )
        RETURNING *
      `)

      return mapHandoffRow(rows[0]!)
    })

    await registrarAuditoria({
      tenantId: input.tenantId,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      usuarioPerfil: usuario.perfil,
      acao: 'handoff_comercial.criado',
      entidadeTipo: 'handoff_comercial',
      entidadeId: created.id,
      dadosDepois: {
        propostaComercialId: created.propostaComercialId,
        responsavelComercialId: created.responsavelComercialId,
        status: created.status,
      },
      contexto: {
        propostaComercialId: created.propostaComercialId,
        leadWhatsAppId: created.leadWhatsAppId,
        empreendimentoId: created.empreendimentoId,
      },
    })

    return created
  }

  async atualizar(input: AtualizarHandoffComercialInput): Promise<HandoffComercialDetalhe> {
    const usuario = await this.buscarUsuarioContexto(input.tenantId, input.usuarioId)
    const payload = input.data

    const updated = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<HandoffInsertRow[]>(Prisma.sql`
        SELECT *
        FROM handoffs_comerciais
        WHERE tenant_id = ${input.tenantId}
          AND id = ${input.id}
        LIMIT 1
      `)

      if (rows.length === 0) {
        throw new NotFoundError('Handoff comercial', input.id)
      }

      const atual = mapHandoffRow(rows[0]!)
      const proximoStatus = payload.status ?? atual.status
      const proximoResponsavelOperacionalId = payload.responsavelOperacionalId ?? atual.responsavelOperacionalId
      const proximasPendencias = normalizeStringArray(payload.pendenciasOperacionais) ?? atual.pendenciasOperacionais
      const proximasObservacoes = payload.observacoesOperacionais !== undefined
        ? normalizeNullableText(payload.observacoesOperacionais)
        : atual.observacoesOperacionais
      const proximasObservacoesPlanejamento = payload.observacoesPlanejamento !== undefined
        ? normalizeNullableText(payload.observacoesPlanejamento)
        : atual.observacoesPlanejamento
      const proximaPrioridadeOperacional = payload.prioridadeOperacional !== undefined
        ? payload.prioridadeOperacional ?? null
        : atual.prioridadeOperacional
      const proximaNecessidadeDocumentos = payload.necessidadeDocumentos !== undefined
        ? payload.necessidadeDocumentos
        : atual.necessidadeDocumentos
      const proximaNecessidadeVisita = payload.necessidadeVisita !== undefined
        ? payload.necessidadeVisita
        : atual.necessidadeVisita
      const proximaNecessidadeTerceiro = payload.necessidadeTerceiro !== undefined
        ? payload.necessidadeTerceiro
        : atual.necessidadeTerceiro

      const statusMudou = proximoStatus !== atual.status
      const responsavelOperacionalMudou = proximoResponsavelOperacionalId !== atual.responsavelOperacionalId
      const pendenciasMudaram = !arraysEqual(proximasPendencias, atual.pendenciasOperacionais)
      const observacoesMudaram = proximasObservacoes !== atual.observacoesOperacionais
      const observacoesPlanejamentoMudaram = proximasObservacoesPlanejamento !== atual.observacoesPlanejamento
      const prioridadeOperacionalMudou = proximaPrioridadeOperacional !== atual.prioridadeOperacional
      const necessidadeDocumentosMudou = proximaNecessidadeDocumentos !== atual.necessidadeDocumentos
      const necessidadeVisitaMudou = proximaNecessidadeVisita !== atual.necessidadeVisita
      const necessidadeTerceiroMudou = proximaNecessidadeTerceiro !== atual.necessidadeTerceiro

      if (
        !statusMudou &&
        !responsavelOperacionalMudou &&
        !pendenciasMudaram &&
        !observacoesMudaram &&
        !observacoesPlanejamentoMudaram &&
        !prioridadeOperacionalMudou &&
        !necessidadeDocumentosMudou &&
        !necessidadeVisitaMudou &&
        !necessidadeTerceiroMudou
      ) {
        return atual
      }

      assertPodeAceitarHandoffOperacional({
        statusAtual: atual.status,
        proximoStatus,
        responsavelOperacionalId: proximoResponsavelOperacionalId,
        pendenciasOperacionais: proximasPendencias,
      })

      if (statusMudou) {
        assertTransicaoStatusPermitida(atual.status, proximoStatus)

        if ((proximoStatus === 'CANCELADO' || proximoStatus === 'CONCLUIDO') && !isPerfilSensivelParaHandoff(usuario.perfil)) {
          throw new ForbiddenError('Somente Coordenador ou superior pode concluir ou cancelar um handoff comercial')
        }
      }

      if (responsavelOperacionalMudou) {
        if (!isPerfilSensivelParaHandoff(usuario.perfil)) {
          throw new ForbiddenError('Somente Coordenador ou superior pode atribuir responsável operacional')
        }

        const responsavelOperacional = await tx.usuario.findFirst({
          where: {
            id: proximoResponsavelOperacionalId ?? undefined,
            tenantId: input.tenantId,
            ativo: true,
          },
          select: { id: true },
        })

        if (!responsavelOperacional) {
          throw new NotFoundError('Usuário responsável operacional', proximoResponsavelOperacionalId ?? undefined)
        }
      }

      const setClauses: Prisma.Sql[] = []

      if (statusMudou) {
        setClauses.push(Prisma.sql`status = CAST(${proximoStatus} AS "StatusHandoffComercial")`)
      }

      if (responsavelOperacionalMudou) {
        setClauses.push(Prisma.sql`responsavel_operacional_id = ${proximoResponsavelOperacionalId}`)

        if (!atual.responsavelOperacionalId && proximoResponsavelOperacionalId) {
          setClauses.push(Prisma.sql`assumido_em = COALESCE(assumido_em, NOW())`)
        }
      }

      if (payload.pendenciasOperacionais !== undefined) {
        setClauses.push(Prisma.sql`pendencias_operacionais = ${textArraySql(proximasPendencias)}`)
      }

      if (payload.observacoesOperacionais !== undefined) {
        setClauses.push(Prisma.sql`observacoes_operacionais = ${proximasObservacoes}`)
      }

      if (payload.observacoesPlanejamento !== undefined) {
        setClauses.push(Prisma.sql`observacoes_planejamento = ${proximasObservacoesPlanejamento}`)
      }

      if (payload.prioridadeOperacional !== undefined) {
        setClauses.push(Prisma.sql`prioridade_operacional = ${proximaPrioridadeOperacional}`)
      }

      if (payload.necessidadeDocumentos !== undefined) {
        setClauses.push(Prisma.sql`necessidade_documentos = ${proximaNecessidadeDocumentos}`)
      }

      if (payload.necessidadeVisita !== undefined) {
        setClauses.push(Prisma.sql`necessidade_visita = ${proximaNecessidadeVisita}`)
      }

      if (payload.necessidadeTerceiro !== undefined) {
        setClauses.push(Prisma.sql`necessidade_terceiro = ${proximaNecessidadeTerceiro}`)
      }

      if (statusMudou && proximoStatus === 'CONCLUIDO') {
        setClauses.push(Prisma.sql`concluido_em = COALESCE(concluido_em, NOW())`)
      }

      if (statusMudou && proximoStatus === 'CANCELADO') {
        setClauses.push(Prisma.sql`cancelado_em = COALESCE(cancelado_em, NOW())`)
      }

      setClauses.push(Prisma.sql`atualizado_em = NOW()`)

      const updatedRows = await tx.$queryRaw<HandoffInsertRow[]>(Prisma.sql`
        UPDATE handoffs_comerciais
        SET ${Prisma.join(setClauses, ', ')}
        WHERE tenant_id = ${input.tenantId}
          AND id = ${input.id}
        RETURNING *
      `)

      const updated = mapHandoffRow(updatedRows[0]!)

      await registrarAuditoria({
        tenantId: input.tenantId,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        usuarioPerfil: usuario.perfil,
        acao: 'handoff_comercial.atualizado',
        entidadeTipo: 'handoff_comercial',
        entidadeId: updated.id,
        dadosAntes: {
          status: atual.status,
          responsavelOperacionalId: atual.responsavelOperacionalId,
          pendenciasOperacionais: atual.pendenciasOperacionais,
          observacoesOperacionais: atual.observacoesOperacionais,
          observacoesPlanejamento: atual.observacoesPlanejamento,
          prioridadeOperacional: atual.prioridadeOperacional,
          necessidadeDocumentos: atual.necessidadeDocumentos,
          necessidadeVisita: atual.necessidadeVisita,
          necessidadeTerceiro: atual.necessidadeTerceiro,
        },
        dadosDepois: {
          status: updated.status,
          responsavelOperacionalId: updated.responsavelOperacionalId,
          pendenciasOperacionais: updated.pendenciasOperacionais,
          observacoesOperacionais: updated.observacoesOperacionais,
          observacoesPlanejamento: updated.observacoesPlanejamento,
          prioridadeOperacional: updated.prioridadeOperacional,
          necessidadeDocumentos: updated.necessidadeDocumentos,
          necessidadeVisita: updated.necessidadeVisita,
          necessidadeTerceiro: updated.necessidadeTerceiro,
        },
        contexto: {
          propostaComercialId: updated.propostaComercialId,
        },
      })

      if (statusMudou) {
        await registrarAuditoria({
          tenantId: input.tenantId,
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          usuarioEmail: usuario.email,
          usuarioPerfil: usuario.perfil,
          acao: 'handoff_comercial.status_alterado',
          entidadeTipo: 'handoff_comercial',
          entidadeId: updated.id,
          dadosAntes: { status: atual.status },
          dadosDepois: { status: updated.status },
          contexto: {
            propostaComercialId: updated.propostaComercialId,
          },
        })
      }

      if (responsavelOperacionalMudou) {
        await registrarAuditoria({
          tenantId: input.tenantId,
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          usuarioEmail: usuario.email,
          usuarioPerfil: usuario.perfil,
          acao: 'handoff_comercial.responsavel_operacional_atribuido',
          entidadeTipo: 'handoff_comercial',
          entidadeId: updated.id,
          dadosAntes: { responsavelOperacionalId: atual.responsavelOperacionalId },
          dadosDepois: { responsavelOperacionalId: updated.responsavelOperacionalId },
          contexto: {
            propostaComercialId: updated.propostaComercialId,
          },
        })
      }

      if (pendenciasMudaram || observacoesMudaram) {
        await registrarAuditoria({
          tenantId: input.tenantId,
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          usuarioEmail: usuario.email,
          usuarioPerfil: usuario.perfil,
          acao: 'handoff_comercial.observacoes_operacionais_atualizadas',
          entidadeTipo: 'handoff_comercial',
          entidadeId: updated.id,
          dadosAntes: {
            pendenciasOperacionais: atual.pendenciasOperacionais,
            observacoesOperacionais: atual.observacoesOperacionais,
          },
          dadosDepois: {
            pendenciasOperacionais: updated.pendenciasOperacionais,
            observacoesOperacionais: updated.observacoesOperacionais,
          },
          contexto: {
            propostaComercialId: updated.propostaComercialId,
          },
        })
      }

      if (
        observacoesPlanejamentoMudaram ||
        prioridadeOperacionalMudou ||
        necessidadeDocumentosMudou ||
        necessidadeVisitaMudou ||
        necessidadeTerceiroMudou
      ) {
        await registrarAuditoria({
          tenantId: input.tenantId,
          usuarioId: usuario.id,
          usuarioNome: usuario.nome,
          usuarioEmail: usuario.email,
          usuarioPerfil: usuario.perfil,
          acao: 'handoff_comercial.preparacao_operacional_atualizada',
          entidadeTipo: 'handoff_comercial',
          entidadeId: updated.id,
          dadosAntes: {
            observacoesPlanejamento: atual.observacoesPlanejamento,
            prioridadeOperacional: atual.prioridadeOperacional,
            necessidadeDocumentos: atual.necessidadeDocumentos,
            necessidadeVisita: atual.necessidadeVisita,
            necessidadeTerceiro: atual.necessidadeTerceiro,
          },
          dadosDepois: {
            observacoesPlanejamento: updated.observacoesPlanejamento,
            prioridadeOperacional: updated.prioridadeOperacional,
            necessidadeDocumentos: updated.necessidadeDocumentos,
            necessidadeVisita: updated.necessidadeVisita,
            necessidadeTerceiro: updated.necessidadeTerceiro,
          },
          contexto: {
            propostaComercialId: updated.propostaComercialId,
            status: updated.status,
          },
        })
      }

      return updated
    })

    return updated
  }

  async listar(input: ListarHandoffsComerciaisInput): Promise<ListarHandoffsComerciaisResult> {
    const whereSql = buildHandoffFiltersSql(input)
    const offset = (input.page - 1) * input.limit

    const [countRows, rows] = await Promise.all([
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM handoffs_comerciais
        ${whereSql}
      `),
      prisma.$queryRaw<HandoffSummaryRow[]>(Prisma.sql`
        SELECT
          id,
          proposta_comercial_id,
          lead_whatsapp_id,
          empreendimento_id,
          criado_por_id,
          responsavel_comercial_id,
          responsavel_operacional_id,
          status,
          status_proposta_origem,
          origem_proposta,
          numero_proposta,
          nome_lead,
          empresa_lead,
          municipio,
          uf,
          cnae_principal_codigo,
          cnae_principal_descricao,
          risco_nivel,
          potencial_poluidor,
          prioridade_operacional,
          necessidade_documentos,
          necessidade_visita,
          necessidade_terceiro,
          criado_em,
          atualizado_em
        FROM handoffs_comerciais
        ${whereSql}
        ORDER BY criado_em DESC
        LIMIT ${input.limit}
        OFFSET ${offset}
      `),
    ])

    return {
      items: rows.map(mapHandoffSummaryRow),
      page: input.page,
      limit: input.limit,
      total: Number(countRows[0]?.total ?? 0),
    }
  }

  async buscarPorId(input: BuscarHandoffComercialPorIdInput): Promise<HandoffComercialDetalhe> {
    const rows = await prisma.$queryRaw<HandoffInsertRow[]>(Prisma.sql`
      SELECT *
      FROM handoffs_comerciais
      WHERE tenant_id = ${input.tenantId}
        AND id = ${input.id}
      LIMIT 1
    `)

    if (rows.length === 0) {
      throw new NotFoundError('Handoff comercial', input.id)
    }

    return mapHandoffRow(rows[0]!)
  }
}

export const handoffsService = new HandoffsService()
