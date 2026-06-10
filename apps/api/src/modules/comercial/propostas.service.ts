import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../../infra/database/prisma.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { DiagnosticoService } from './diagnostico.service.js'
import { renderPropostaComercialPdf } from './propostas.pdf.js'
import type {
  AtualizarPropostaComercialInput,
  CriarPropostaComercialInput,
  FiltrosPropostaComercial,
  StatusPropostaComercial,
  PropostaComercialDetalhePublico,
  PropostaComercialResumoPublico,
} from './propostas.types.js'

interface ContextoUsuario {
  id: string
  tenantId: string
  perfil: string
  nome: string
  email: string
  ip: string
}

const PERFIS_COMERCIAIS = ['EXECUTIVO', 'COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN'] as const
const diagnosticoService = new DiagnosticoService()

interface PropostaListRow {
  id: string
  numero: string
  status: PropostaComercialResumoPublico['status']
  origem: PropostaComercialResumoPublico['origem']
  nome_lead: string | null
  empresa_lead: string | null
  municipio: string | null
  uf: string
  data_validade: Date
  total_minimo: unknown
  total_base: unknown
  total_maximo: unknown
  criado_em: Date
  atualizado_em: Date
  itens_quantidade: number
  risco_nivel: PropostaComercialResumoPublico['riscoNivel']
  cnae_principal_codigo: string
  lead_id: string | null
  lead_nome: string | null
  lead_empresa: string | null
  lead_numero: string | null
  empreendimento_id: string | null
  empreendimento_nome: string | null
  empreendimento_nome_fantasia: string | null
  empreendimento_cidade: string | null
  empreendimento_estado: string | null
}

interface PropostaDetailRow {
  id: string
  numero: string
  status: PropostaComercialDetalhePublico['status']
  origem: PropostaComercialDetalhePublico['origem']
  nome_lead: string | null
  empresa_lead: string | null
  email_contato: string | null
  telefone_contato: string | null
  observacoes_comerciais: string | null
  municipio: string | null
  uf: string
  data_validade: Date
  total_minimo: unknown
  total_base: unknown
  total_maximo: unknown
  criado_em: Date
  atualizado_em: Date
  itens_quantidade: number
  lead_id: string | null
  lead_nome: string | null
  lead_empresa: string | null
  lead_numero: string | null
  empreendimento_id: string | null
  empreendimento_nome: string | null
  empreendimento_nome_fantasia: string | null
  empreendimento_cidade: string | null
  empreendimento_estado: string | null
  criado_por_id: string
  criado_por_nome: string
  criado_por_email: string
  atualizado_por_id: string | null
  atualizado_por_nome: string | null
  atualizado_por_email: string | null
  diagnostico_id: string
  diagnostico_origem: PropostaComercialDetalhePublico['diagnostico']['origem']
  diagnostico_cnaes: string[]
  diagnostico_uf: string
  diagnostico_municipio: string | null
  diagnostico_porte: PropostaComercialDetalhePublico['diagnostico']['porte']
  diagnostico_situacao: PropostaComercialDetalhePublico['diagnostico']['situacao']
  diagnostico_tem_licenca_anterior: boolean
  diagnostico_tem_outorga_anterior: boolean
  diagnostico_cnae_principal_codigo: string
  diagnostico_cnae_principal_descricao: string
  diagnostico_potencial_poluidor: PropostaComercialDetalhePublico['diagnostico']['cnaePrincipal']['potencialPoluidor']
  diagnostico_risco_score: number
  diagnostico_risco_nivel: PropostaComercialDetalhePublico['diagnostico']['riscoGeral']['nivel']
  diagnostico_licenciamento_tipo: string
  diagnostico_orgao_competente: string
  diagnostico_esfera: PropostaComercialDetalhePublico['diagnostico']['enquadramento']['esfera']
  diagnostico_necessita_eia: boolean
  diagnostico_necessita_outorga: boolean
  diagnostico_necessita_monitoramento: boolean
  diagnostico_principais_impactos: string[]
  diagnostico_orcamento_minimo: unknown
  diagnostico_orcamento_base: unknown
  diagnostico_orcamento_maximo: unknown
  diagnostico_alertas: string[]
  diagnostico_proximos_passos: string[]
  diagnostico_cobertura_limitada: boolean
  diagnostico_criado_em: Date
}

interface PropostaItemRow {
  id: string
  ordem: number
  origem: PropostaComercialDetalhePublico['itens'][number]['origem']
  decisao: PropostaComercialDetalhePublico['itens'][number]['decisao']
  codigo_servico: string
  nome_servico: string
  categoria_servico: string
  justificativa: string | null
  quantidade: number
  preco_minimo_unitario: unknown
  preco_base_unitario: unknown
  preco_maximo_unitario: unknown
  preco_aplicado_unitario: unknown
  valor_minimo_linha: unknown
  valor_base_linha: unknown
  valor_maximo_linha: unknown
  valor_aplicado_linha: unknown
  observacao_linha: string | null
  editavel: boolean
  ativo: boolean
}

interface PropostaUpdateRow {
  id: string
  status: StatusPropostaComercial
  data_validade: Date
  observacoes_comerciais: string | null
}

const STATUS_TRANSITIONS: Record<StatusPropostaComercial, StatusPropostaComercial[]> = {
  RASCUNHO: ['PRONTA', 'CANCELADA'],
  PRONTA: ['RASCUNHO', 'ENVIADA', 'CANCELADA'],
  ENVIADA: ['EM_NEGOCIACAO', 'APROVADA', 'REJEITADA', 'EXPIRADA', 'CANCELADA'],
  EM_NEGOCIACAO: ['APROVADA', 'REJEITADA', 'EXPIRADA', 'CANCELADA'],
  APROVADA: [],
  REJEITADA: [],
  EXPIRADA: [],
  CANCELADA: [],
}

function decimalToNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber()
  }
  return Number(value ?? 0)
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0)
}

function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function slugifyFilePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function buildNumeroProposta() {
  const year = new Date().getUTCFullYear()
  return `PROP-${year}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function textArraySql(values: string[]) {
  return values.length > 0
    ? Prisma.sql`ARRAY[${Prisma.join(values)}]`
    : Prisma.sql`ARRAY[]::text[]`
}

function buildWhereSql(ctx: ContextoUsuario, filtros: FiltrosPropostaComercial) {
  const conditions: Prisma.Sql[] = [Prisma.sql`p.tenant_id = ${ctx.tenantId}`]

  if (filtros.status) {
    conditions.push(Prisma.sql`p.status = CAST(${filtros.status} AS "StatusPropostaComercial")`)
  }
  if (filtros.leadWhatsAppId) {
    conditions.push(Prisma.sql`p.lead_whatsapp_id = ${filtros.leadWhatsAppId}`)
  }
  if (filtros.empreendimentoId) {
    conditions.push(Prisma.sql`p.empreendimento_id = ${filtros.empreendimentoId}`)
  }
  if (filtros.busca) {
    const buscaLike = `%${filtros.busca}%`
    conditions.push(
      Prisma.sql`(
        p.numero ILIKE ${buscaLike}
        OR COALESCE(p.nome_lead, '') ILIKE ${buscaLike}
        OR COALESCE(p.empresa_lead, '') ILIKE ${buscaLike}
      )`,
    )
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
}

export class PropostasService {
  async criar(ctx: ContextoUsuario, input: CriarPropostaComercialInput): Promise<PropostaComercialDetalhePublico> {
    this.assertComercialAccess(ctx)

    const [lead, empreendimento, politica] = await Promise.all([
      input.leadWhatsAppId
        ? prisma.leadWhatsApp.findFirst({
            where: { id: input.leadWhatsAppId, tenantId: ctx.tenantId },
            select: { id: true, nome: true, empresa: true, numero: true },
          })
        : Promise.resolve(null),
      input.empreendimentoId
        ? prisma.empreendimento.findFirst({
            where: { id: input.empreendimentoId, tenantId: ctx.tenantId },
            select: {
              id: true,
              nome: true,
              nomeFantasia: true,
              cnpj: true,
              cidade: true,
              estado: true,
              contatoEmail: true,
              contatoTelefone: true,
            },
          })
        : Promise.resolve(null),
      prisma.politicaPrecificacaoDiagnostico.findUnique({
        where: { tenantId: ctx.tenantId },
        select: { validadePropostaDias: true },
      }),
    ])

    if (input.leadWhatsAppId && !lead) throw new NotFoundError('Lead', input.leadWhatsAppId)
    if (input.empreendimentoId && !empreendimento) throw new NotFoundError('Empreendimento', input.empreendimentoId)

    const diagnostico = await diagnosticoService.gerarDiagnostico(input.diagnostico)
    if (diagnostico.recomendacoes.length === 0) {
      throw new ValidationError('O diagnóstico não retornou serviços recomendados para gerar proposta')
    }

    const duplicateCodes = findDuplicates((input.itens ?? []).map((item) => item.codigo))
    if (duplicateCodes.length > 0) {
      throw new ValidationError('Há códigos de serviço duplicados na proposta', { codigos: duplicateCodes })
    }

    const recomendacoesSelecionadas =
      input.itens && input.itens.length > 0
        ? input.itens.map((item) => {
            const recomendacao = diagnostico.recomendacoes.find((entry) => entry.codigo === item.codigo)
            if (!recomendacao) {
              throw new ValidationError(`O serviço '${item.codigo}' não faz parte do diagnóstico informado`)
            }

            const precoAplicadoUnitario = item.precoAplicadoUnitario ?? recomendacao.precoEstimado
            // Só valida a faixa quando o catálogo tem uma faixa configurada (precoMaximo > 0).
            // Serviços sem preço cadastrado (precoMaximo = 0) não devem bloquear a proposta
            // com mensagem enganosa de "fora da faixa".
            const temFaixaConfigurada = recomendacao.precoMaximo > 0
            if (
              temFaixaConfigurada &&
              (precoAplicadoUnitario < recomendacao.precoMinimo ||
                precoAplicadoUnitario > recomendacao.precoMaximo)
            ) {
              throw new ValidationError(
                `O preço aplicado para '${item.codigo}' precisa ficar dentro da faixa do catálogo`,
                {
                  codigo: [item.codigo],
                },
              )
            }

            return {
              recomendacao,
              quantidade: item.quantidade ?? 1,
              precoAplicadoUnitario,
            }
          })
        : diagnostico.recomendacoes.map((recomendacao) => ({
            recomendacao,
            quantidade: 1,
            precoAplicadoUnitario: recomendacao.precoEstimado,
          }))

    const dataValidade = input.dataValidade
      ? new Date(`${input.dataValidade}T00:00:00.000Z`)
      : addDays(new Date(), politica?.validadePropostaDias ?? 30)

    const contato = {
      nomeLead: input.contato?.nome ?? lead?.nome ?? empreendimento?.nomeFantasia ?? empreendimento?.nome ?? null,
      empresaLead: input.contato?.empresa ?? lead?.empresa ?? empreendimento?.nome ?? null,
      documentoLead: input.contato?.documento ?? empreendimento?.cnpj ?? null,
      emailContato: input.contato?.email ?? empreendimento?.contatoEmail ?? null,
      telefoneContato: input.contato?.telefone ?? empreendimento?.contatoTelefone ?? null,
      municipio: input.diagnostico.municipio ?? empreendimento?.cidade ?? null,
      uf: input.diagnostico.uf ?? empreendimento?.estado ?? 'BR',
    }

    const itensPersistidos = recomendacoesSelecionadas.map(({ recomendacao, quantidade, precoAplicadoUnitario }, index) => ({
      ordem: index + 1,
      origem: 'TRIAGEM_CNAE' as const,
      decisao: recomendacao.decisao,
      codigoServico: recomendacao.codigo,
      nomeServico: recomendacao.nome,
      categoriaServico: recomendacao.categoria,
      justificativa: recomendacao.justificativa,
      quantidade,
      precoMinimoUnitario: recomendacao.precoMinimo,
      precoBaseUnitario: recomendacao.precoEstimado,
      precoMaximoUnitario: recomendacao.precoMaximo,
      precoAplicadoUnitario,
      valorMinimoLinha: recomendacao.precoMinimo * quantidade,
      valorBaseLinha: recomendacao.precoEstimado * quantidade,
      valorMaximoLinha: recomendacao.precoMaximo * quantidade,
      valorAplicadoLinha: precoAplicadoUnitario * quantidade,
      observacaoLinha: null,
      editavel: true,
      ativo: true,
      snapshotCatalogo: {
        servicoId: recomendacao.servicoId,
        codigo: recomendacao.codigo,
        nome: recomendacao.nome,
        categoria: recomendacao.categoria,
        precoMinimo: recomendacao.precoMinimo,
        precoBase: recomendacao.precoEstimado,
        precoMaximo: recomendacao.precoMaximo,
      },
      servicoCatalogoId: recomendacao.servicoId,
    }))

    const totais = {
      subtotalMinimo: sum(itensPersistidos.map((item) => item.valorMinimoLinha)),
      subtotalBase: sum(itensPersistidos.map((item) => item.valorBaseLinha)),
      subtotalMaximo: sum(itensPersistidos.map((item) => item.valorMaximoLinha)),
    }

    const propostaId = await prisma.$transaction(async (tx) => {
      const diagnosticoId = randomUUID()
      const propostaId = randomUUID()

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO diagnosticos_comerciais (
          id, tenant_id, criado_por_id, lead_whatsapp_id, empreendimento_id, origem, cnaes, uf, municipio,
          porte, situacao, tem_licenca_anterior, tem_outorga_anterior, cnae_principal_codigo,
          cnae_principal_descricao, risco_score, risco_nivel, potencial_poluidor, licenciamento_tipo,
          orgao_competente, esfera, necessita_eia, necessita_outorga, necessita_monitoramento,
          principais_impactos, orcamento_minimo, orcamento_base, orcamento_maximo, alertas,
          proximos_passos, cobertura_limitada, input_snapshot, resultado_snapshot
        )
        VALUES (
          ${diagnosticoId},
          ${ctx.tenantId},
          ${ctx.id},
          ${lead?.id ?? null},
          ${empreendimento?.id ?? null},
          CAST(${'TRIAGEM_CNAE'} AS "OrigemPropostaComercial"),
          ${textArraySql(input.diagnostico.cnaes)},
          ${input.diagnostico.uf},
          ${input.diagnostico.municipio ?? null},
          CAST(${input.diagnostico.porte} AS "PorteDiagnosticoComercial"),
          CAST(${input.diagnostico.situacao} AS "SituacaoDiagnosticoComercial"),
          ${input.diagnostico.temLicencaAnterior ?? false},
          ${input.diagnostico.temOutorgaAnterior ?? false},
          ${diagnostico.cnaePrincipal.codigo},
          ${diagnostico.cnaePrincipal.descricao},
          ${diagnostico.riscoGeral.score},
          CAST(${diagnostico.riscoGeral.nivel} AS "NivelRiscoComercial"),
          CAST(${diagnostico.cnaePrincipal.potencialPoluidor} AS "PotencialPoluidorComercial"),
          ${diagnostico.enquadramento.licenciamentoTipo},
          ${diagnostico.enquadramento.orgaoCompetente},
          CAST(${diagnostico.enquadramento.esfera} AS "EsferaRegulatoria"),
          ${diagnostico.obrigatoriedades.necessitaEIA},
          ${diagnostico.obrigatoriedades.necessitaOutorga},
          ${diagnostico.obrigatoriedades.necessitaMonitoramento},
          ${textArraySql(diagnostico.obrigatoriedades.principaisImpactos)},
          ${diagnostico.estimativaOrcamento.minimo},
          ${diagnostico.estimativaOrcamento.recomendado},
          ${diagnostico.estimativaOrcamento.maximo},
          ${textArraySql(diagnostico.alertas)},
          ${textArraySql(diagnostico.proximosPassos)},
          ${diagnostico.cnaePrincipal.descricao.includes('não mapeada')},
          CAST(${JSON.stringify(input.diagnostico)} AS jsonb),
          CAST(${JSON.stringify(diagnostico)} AS jsonb)
        )
      `)

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO propostas_comerciais (
          id, tenant_id, diagnostico_id, lead_whatsapp_id, empreendimento_id, criado_por_id, numero, origem,
          status, nome_lead, empresa_lead, documento_lead, email_contato, telefone_contato, municipio, uf,
          subtotal_minimo, subtotal_base, subtotal_maximo, desconto_valor, acrescimo_valor,
          total_minimo, total_base, total_maximo, moeda, data_validade, observacoes_comerciais, catalogo_snapshot_em,
          criado_em, atualizado_em
        )
        VALUES (
          ${propostaId},
          ${ctx.tenantId},
          ${diagnosticoId},
          ${lead?.id ?? null},
          ${empreendimento?.id ?? null},
          ${ctx.id},
          ${buildNumeroProposta()},
          CAST(${'TRIAGEM_CNAE'} AS "OrigemPropostaComercial"),
          CAST(${'RASCUNHO'} AS "StatusPropostaComercial"),
          ${contato.nomeLead},
          ${contato.empresaLead},
          ${contato.documentoLead},
          ${contato.emailContato},
          ${contato.telefoneContato},
          ${contato.municipio},
          ${contato.uf},
          ${totais.subtotalMinimo},
          ${totais.subtotalBase},
          ${totais.subtotalMaximo},
          ${0},
          ${0},
          ${totais.subtotalMinimo},
          ${totais.subtotalBase},
          ${totais.subtotalMaximo},
          ${'BRL'},
          ${dataValidade},
          ${input.observacoesComerciais ?? null},
          ${new Date()},
          ${new Date()},
          ${new Date()}
        )
      `)

      for (const item of itensPersistidos) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO itens_proposta (
            id, tenant_id, proposta_id, servico_catalogo_id, ordem, origem, decisao, codigo_servico, nome_servico,
            categoria_servico, justificativa, quantidade, preco_minimo_unitario, preco_base_unitario,
            preco_maximo_unitario, preco_aplicado_unitario, valor_minimo_linha, valor_base_linha,
            valor_maximo_linha, valor_aplicado_linha, observacao_linha, editavel, ativo, snapshot_catalogo,
            criado_em, atualizado_em
          )
          VALUES (
            ${randomUUID()},
            ${ctx.tenantId},
            ${propostaId},
            ${item.servicoCatalogoId},
            ${item.ordem},
            CAST(${item.origem} AS "OrigemPropostaComercial"),
            CAST(${item.decisao} AS "DecisaoItemProposta"),
            ${item.codigoServico},
            ${item.nomeServico},
            ${item.categoriaServico},
            ${item.justificativa},
            ${item.quantidade},
            ${item.precoMinimoUnitario},
            ${item.precoBaseUnitario},
            ${item.precoMaximoUnitario},
            ${item.precoAplicadoUnitario},
            ${item.valorMinimoLinha},
            ${item.valorBaseLinha},
            ${item.valorMaximoLinha},
            ${item.valorAplicadoLinha},
            ${item.observacaoLinha},
            ${item.editavel},
            ${item.ativo},
            CAST(${JSON.stringify(item.snapshotCatalogo)} AS jsonb),
            ${new Date()},
            ${new Date()}
          )
        `)
      }

      return propostaId
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      usuarioEmail: ctx.email,
      usuarioPerfil: ctx.perfil,
      acao: 'proposta_comercial.criada',
      entidadeTipo: 'proposta_comercial',
      entidadeId: propostaId,
      dadosDepois: {
        origem: 'TRIAGEM_CNAE',
        status: 'RASCUNHO',
        itensQuantidade: itensPersistidos.length,
        totalBase: totais.subtotalBase,
      },
      ipOrigem: ctx.ip,
      contexto: {
        leadWhatsAppId: lead?.id,
        empreendimentoId: empreendimento?.id,
      },
    })

    return this.buscarPorId(ctx, propostaId)
  }

  async listar(
    ctx: ContextoUsuario,
    filtros: FiltrosPropostaComercial,
  ): Promise<{ items: PropostaComercialResumoPublico[]; total: number; page: number; limit: number }> {
    this.assertComercialAccess(ctx)

    const where = buildWhereSql(ctx, filtros)
    const offset = (filtros.page - 1) * filtros.limit

    const [countRows, propostas] = await prisma.$transaction([
      prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM propostas_comerciais p
        ${where}
      `),
      prisma.$queryRaw<PropostaListRow[]>(Prisma.sql`
        SELECT
          p.id,
          p.numero,
          p.status,
          p.origem,
          p.nome_lead,
          p.empresa_lead,
          p.municipio,
          p.uf,
          p.data_validade,
          p.total_minimo,
          p.total_base,
          p.total_maximo,
          p.criado_em,
          p.atualizado_em,
          d.risco_nivel,
          d.cnae_principal_codigo,
          lw.id AS lead_id,
          lw.nome AS lead_nome,
          lw.empresa AS lead_empresa,
          lw.numero AS lead_numero,
          e.id AS empreendimento_id,
          e.nome AS empreendimento_nome,
          e.nome_fantasia AS empreendimento_nome_fantasia,
          e.cidade AS empreendimento_cidade,
          e.estado AS empreendimento_estado,
          COALESCE(ip.count_itens, 0)::int AS itens_quantidade
        FROM propostas_comerciais p
        INNER JOIN diagnosticos_comerciais d ON d.id = p.diagnostico_id
        LEFT JOIN leads_whatsapp lw ON lw.id = p.lead_whatsapp_id
        LEFT JOIN empreendimentos e ON e.id = p.empreendimento_id
        LEFT JOIN (
          SELECT proposta_id, COUNT(*) AS count_itens
          FROM itens_proposta
          GROUP BY proposta_id
        ) ip ON ip.proposta_id = p.id
        ${where}
        ORDER BY p.criado_em DESC
        OFFSET ${offset}
        LIMIT ${filtros.limit}
      `),
    ])

    const total = Number(countRows[0]?.total ?? 0n)

    return {
      items: propostas.map((proposta) => ({
        id: proposta.id,
        numero: proposta.numero,
        status: proposta.status,
        origem: proposta.origem,
        nomeLead: proposta.nome_lead,
        empresaLead: proposta.empresa_lead,
        municipio: proposta.municipio,
        uf: proposta.uf,
        dataValidade: proposta.data_validade,
        totalMinimo: decimalToNumber(proposta.total_minimo),
        totalBase: decimalToNumber(proposta.total_base),
        totalMaximo: decimalToNumber(proposta.total_maximo),
        itensQuantidade: proposta.itens_quantidade,
        riscoNivel: proposta.risco_nivel,
        cnaePrincipalCodigo: proposta.cnae_principal_codigo,
        criadoEm: proposta.criado_em,
        atualizadoEm: proposta.atualizado_em,
        lead: proposta.lead_id
          ? {
              id: proposta.lead_id,
              nome: proposta.lead_nome,
              empresa: proposta.lead_empresa,
              numero: proposta.lead_numero ?? '',
            }
          : null,
        empreendimento: proposta.empreendimento_id
          ? {
              id: proposta.empreendimento_id,
              nome: proposta.empreendimento_nome ?? '',
              nomeFantasia: proposta.empreendimento_nome_fantasia,
              cidade: proposta.empreendimento_cidade ?? '',
              estado: proposta.empreendimento_estado ?? '',
            }
          : null,
      })),
      total,
      page: filtros.page,
      limit: filtros.limit,
    }
  }

  async atualizar(
    ctx: ContextoUsuario,
    id: string,
    input: AtualizarPropostaComercialInput,
  ): Promise<PropostaComercialDetalhePublico> {
    this.assertComercialAccess(ctx)

    const rows = await prisma.$queryRaw<PropostaUpdateRow[]>(Prisma.sql`
      SELECT
        p.id,
        p.status,
        p.data_validade,
        p.observacoes_comerciais
      FROM propostas_comerciais p
      WHERE p.id = ${id} AND p.tenant_id = ${ctx.tenantId}
      LIMIT 1
    `)

    const proposta = rows[0]
    if (!proposta) throw new NotFoundError('Proposta comercial', id)

    if (input.status && input.status !== proposta.status && !this.canTransitionStatus(proposta.status, input.status)) {
      throw new ValidationError(
        `Transição de status inválida: ${proposta.status} não pode ir para ${input.status}`,
        {
          statusAtual: [proposta.status],
          statusDestino: [input.status],
        },
      )
    }

    const nextStatus = input.status ?? proposta.status
    const nextDataValidade = input.dataValidade
      ? new Date(`${input.dataValidade}T00:00:00.000Z`)
      : proposta.data_validade
    const nextObservacoesComerciais = input.observacoesComerciais !== undefined
      ? normalizeNullableText(input.observacoesComerciais)
      : proposta.observacoes_comerciais
    const updatedAt = new Date()

    await prisma.$executeRaw(Prisma.sql`
      UPDATE propostas_comerciais
      SET
        status = CAST(${nextStatus} AS "StatusPropostaComercial"),
        data_validade = ${nextDataValidade},
        observacoes_comerciais = ${nextObservacoesComerciais},
        atualizado_por_id = ${ctx.id},
        atualizado_em = ${updatedAt}
      WHERE id = ${id} AND tenant_id = ${ctx.tenantId}
    `)

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      usuarioEmail: ctx.email,
      usuarioPerfil: ctx.perfil,
      acao: 'proposta_comercial.atualizada',
      entidadeTipo: 'proposta_comercial',
      entidadeId: id,
      dadosAntes: {
        status: proposta.status,
        dataValidade: proposta.data_validade,
        observacoesComerciais: proposta.observacoes_comerciais,
      },
      dadosDepois: {
        status: nextStatus,
        dataValidade: nextDataValidade,
        observacoesComerciais: nextObservacoesComerciais,
      },
      ipOrigem: ctx.ip,
    })

    return this.buscarPorId(ctx, id)
  }

  async gerarPdf(
    ctx: ContextoUsuario,
    id: string,
  ): Promise<{ fileName: string; content: Buffer }> {
    const proposta = await this.buscarPorId(ctx, id)
    const content = await renderPropostaComercialPdf(proposta)
    const safeNumero = slugifyFilePart(proposta.numero) || 'proposta-comercial'

    return {
      fileName: `${safeNumero}.pdf`,
      content,
    }
  }

  async buscarPorId(ctx: ContextoUsuario, id: string): Promise<PropostaComercialDetalhePublico> {
    this.assertComercialAccess(ctx)

    const [propostas, itens] = await prisma.$transaction([
      prisma.$queryRaw<PropostaDetailRow[]>(Prisma.sql`
        SELECT
          p.id,
          p.numero,
          p.status,
          p.origem,
          p.nome_lead,
          p.empresa_lead,
          p.email_contato,
          p.telefone_contato,
          p.observacoes_comerciais,
          p.municipio,
          p.uf,
          p.data_validade,
          p.total_minimo,
          p.total_base,
          p.total_maximo,
          p.criado_em,
          p.atualizado_em,
          COALESCE(ip.count_itens, 0)::int AS itens_quantidade,
          lw.id AS lead_id,
          lw.nome AS lead_nome,
          lw.empresa AS lead_empresa,
          lw.numero AS lead_numero,
          e.id AS empreendimento_id,
          e.nome AS empreendimento_nome,
          e.nome_fantasia AS empreendimento_nome_fantasia,
          e.cidade AS empreendimento_cidade,
          e.estado AS empreendimento_estado,
          uc.id AS criado_por_id,
          uc.nome AS criado_por_nome,
          uc.email AS criado_por_email,
          uu.id AS atualizado_por_id,
          uu.nome AS atualizado_por_nome,
          uu.email AS atualizado_por_email,
          d.id AS diagnostico_id,
          d.origem AS diagnostico_origem,
          d.cnaes AS diagnostico_cnaes,
          d.uf AS diagnostico_uf,
          d.municipio AS diagnostico_municipio,
          d.porte AS diagnostico_porte,
          d.situacao AS diagnostico_situacao,
          d.tem_licenca_anterior AS diagnostico_tem_licenca_anterior,
          d.tem_outorga_anterior AS diagnostico_tem_outorga_anterior,
          d.cnae_principal_codigo AS diagnostico_cnae_principal_codigo,
          d.cnae_principal_descricao AS diagnostico_cnae_principal_descricao,
          d.potencial_poluidor AS diagnostico_potencial_poluidor,
          d.risco_score AS diagnostico_risco_score,
          d.risco_nivel AS diagnostico_risco_nivel,
          d.licenciamento_tipo AS diagnostico_licenciamento_tipo,
          d.orgao_competente AS diagnostico_orgao_competente,
          d.esfera AS diagnostico_esfera,
          d.necessita_eia AS diagnostico_necessita_eia,
          d.necessita_outorga AS diagnostico_necessita_outorga,
          d.necessita_monitoramento AS diagnostico_necessita_monitoramento,
          d.principais_impactos AS diagnostico_principais_impactos,
          d.orcamento_minimo AS diagnostico_orcamento_minimo,
          d.orcamento_base AS diagnostico_orcamento_base,
          d.orcamento_maximo AS diagnostico_orcamento_maximo,
          d.alertas AS diagnostico_alertas,
          d.proximos_passos AS diagnostico_proximos_passos,
          d.cobertura_limitada AS diagnostico_cobertura_limitada,
          d.criado_em AS diagnostico_criado_em
        FROM propostas_comerciais p
        INNER JOIN diagnosticos_comerciais d ON d.id = p.diagnostico_id
        INNER JOIN usuarios uc ON uc.id = p.criado_por_id
        LEFT JOIN usuarios uu ON uu.id = p.atualizado_por_id
        LEFT JOIN leads_whatsapp lw ON lw.id = p.lead_whatsapp_id
        LEFT JOIN empreendimentos e ON e.id = p.empreendimento_id
        LEFT JOIN (
          SELECT proposta_id, COUNT(*) AS count_itens
          FROM itens_proposta
          GROUP BY proposta_id
        ) ip ON ip.proposta_id = p.id
        WHERE p.id = ${id} AND p.tenant_id = ${ctx.tenantId}
        LIMIT 1
      `),
      prisma.$queryRaw<PropostaItemRow[]>(Prisma.sql`
        SELECT
          id,
          ordem,
          origem,
          decisao,
          codigo_servico,
          nome_servico,
          categoria_servico,
          justificativa,
          quantidade,
          preco_minimo_unitario,
          preco_base_unitario,
          preco_maximo_unitario,
          preco_aplicado_unitario,
          valor_minimo_linha,
          valor_base_linha,
          valor_maximo_linha,
          valor_aplicado_linha,
          observacao_linha,
          editavel,
          ativo
        FROM itens_proposta
        WHERE proposta_id = ${id} AND tenant_id = ${ctx.tenantId}
        ORDER BY ordem ASC
      `),
    ])

    const proposta = propostas[0]
    if (!proposta) throw new NotFoundError('Proposta comercial', id)

    return {
      id: proposta.id,
      numero: proposta.numero,
      status: proposta.status,
      origem: proposta.origem,
      nomeLead: proposta.nome_lead,
      empresaLead: proposta.empresa_lead,
      municipio: proposta.municipio,
      uf: proposta.uf,
      dataValidade: proposta.data_validade,
      totalMinimo: decimalToNumber(proposta.total_minimo),
      totalBase: decimalToNumber(proposta.total_base),
      totalMaximo: decimalToNumber(proposta.total_maximo),
      itensQuantidade: proposta.itens_quantidade,
      riscoNivel: proposta.diagnostico_risco_nivel,
      cnaePrincipalCodigo: proposta.diagnostico_cnae_principal_codigo,
      criadoEm: proposta.criado_em,
      atualizadoEm: proposta.atualizado_em,
      lead: proposta.lead_id
        ? {
            id: proposta.lead_id,
            nome: proposta.lead_nome,
            empresa: proposta.lead_empresa,
            numero: proposta.lead_numero ?? '',
          }
        : null,
      empreendimento: proposta.empreendimento_id
        ? {
            id: proposta.empreendimento_id,
            nome: proposta.empreendimento_nome ?? '',
            nomeFantasia: proposta.empreendimento_nome_fantasia,
            cidade: proposta.empreendimento_cidade ?? '',
            estado: proposta.empreendimento_estado ?? '',
          }
        : null,
      emailContato: proposta.email_contato,
      telefoneContato: proposta.telefone_contato,
      observacoesComerciais: proposta.observacoes_comerciais,
      criadoPor: {
        id: proposta.criado_por_id,
        nome: proposta.criado_por_nome,
        email: proposta.criado_por_email,
      },
      atualizadoPor: proposta.atualizado_por_id
        ? {
            id: proposta.atualizado_por_id,
            nome: proposta.atualizado_por_nome ?? '',
            email: proposta.atualizado_por_email ?? '',
          }
        : null,
      diagnostico: {
        id: proposta.diagnostico_id,
        origem: proposta.diagnostico_origem,
        cnaes: proposta.diagnostico_cnaes,
        uf: proposta.diagnostico_uf,
        municipio: proposta.diagnostico_municipio,
        porte: proposta.diagnostico_porte,
        situacao: proposta.diagnostico_situacao,
        temLicencaAnterior: proposta.diagnostico_tem_licenca_anterior,
        temOutorgaAnterior: proposta.diagnostico_tem_outorga_anterior,
        cnaePrincipal: {
          codigo: proposta.diagnostico_cnae_principal_codigo,
          descricao: proposta.diagnostico_cnae_principal_descricao,
          potencialPoluidor: proposta.diagnostico_potencial_poluidor,
        },
        riscoGeral: {
          score: proposta.diagnostico_risco_score,
          nivel: proposta.diagnostico_risco_nivel,
        },
        enquadramento: {
          licenciamentoTipo: proposta.diagnostico_licenciamento_tipo,
          orgaoCompetente: proposta.diagnostico_orgao_competente,
          esfera: proposta.diagnostico_esfera,
        },
        obrigatoriedades: {
          necessitaEIA: proposta.diagnostico_necessita_eia,
          necessitaOutorga: proposta.diagnostico_necessita_outorga,
          necessitaMonitoramento: proposta.diagnostico_necessita_monitoramento,
          principaisImpactos: proposta.diagnostico_principais_impactos,
        },
        estimativaOrcamento: {
          minimo: decimalToNumber(proposta.diagnostico_orcamento_minimo),
          recomendado: decimalToNumber(proposta.diagnostico_orcamento_base),
          maximo: decimalToNumber(proposta.diagnostico_orcamento_maximo),
        },
        alertas: proposta.diagnostico_alertas,
        proximosPassos: proposta.diagnostico_proximos_passos,
        coberturaLimitada: proposta.diagnostico_cobertura_limitada,
        criadoEm: proposta.diagnostico_criado_em,
      },
      itens: itens.map((item) => ({
        id: item.id,
        ordem: item.ordem,
        origem: item.origem,
        decisao: item.decisao,
        codigoServico: item.codigo_servico,
        nomeServico: item.nome_servico,
        categoriaServico: item.categoria_servico,
        justificativa: item.justificativa,
        quantidade: item.quantidade,
        precoMinimoUnitario: decimalToNumber(item.preco_minimo_unitario),
        precoBaseUnitario: decimalToNumber(item.preco_base_unitario),
        precoMaximoUnitario: decimalToNumber(item.preco_maximo_unitario),
        precoAplicadoUnitario: decimalToNumber(item.preco_aplicado_unitario),
        valorMinimoLinha: decimalToNumber(item.valor_minimo_linha),
        valorBaseLinha: decimalToNumber(item.valor_base_linha),
        valorMaximoLinha: decimalToNumber(item.valor_maximo_linha),
        valorAplicadoLinha: decimalToNumber(item.valor_aplicado_linha),
        observacaoLinha: item.observacao_linha,
        editavel: item.editavel,
        ativo: item.ativo,
      })),
    }
  }

  private assertComercialAccess(ctx: ContextoUsuario) {
    if (!PERFIS_COMERCIAIS.includes(ctx.perfil as (typeof PERFIS_COMERCIAIS)[number])) {
      throw new ForbiddenError('Apenas perfis comerciais podem acessar propostas comerciais')
    }
  }

  private canTransitionStatus(atual: StatusPropostaComercial, proximo: StatusPropostaComercial) {
    return STATUS_TRANSITIONS[atual].includes(proximo)
  }
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }

  return [...duplicates]
}

export const propostasService = new PropostasService()
