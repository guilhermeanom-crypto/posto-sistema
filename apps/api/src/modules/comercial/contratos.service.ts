import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../../infra/database/prisma.js'
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import type {
  AtualizarContratoInput,
  BuscarContratoPorIdInput,
  ContratoDetalhe,
  ContratoItemSnapshot,
  ContratoKpis,
  ContratoResumo,
  CriarContratoInput,
  ListarContratosInput,
  ListarContratosResult,
  StatusContrato,
} from './contratos.types.js'

const STATUS_TRANSITIONS: Record<StatusContrato, StatusContrato[]> = {
  RASCUNHO: ['ATIVO', 'CANCELADO'],
  ATIVO: ['SUSPENSO', 'ENCERRADO', 'CANCELADO'],
  SUSPENSO: ['ATIVO', 'ENCERRADO', 'CANCELADO'],
  ENCERRADO: [],
  CANCELADO: [],
}

function gerarNumeroContrato() {
  const ano = new Date().getUTCFullYear()
  return `CT-${ano}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  return Number(value.toString())
}

function decimalToNumberOrNull(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  return Number(value.toString())
}

function dateOnly(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw new ConflictError('Data informada inválida')
  }
  return date
}

interface ContratoRow {
  id: string
  tenant_id: string
  numero: string
  status: StatusContrato
  handoff_comercial_id: string
  proposta_comercial_id: string
  empreendimento_id: string | null
  criado_por_id: string
  atualizado_por_id: string | null
  objeto: string
  observacoes_contratuais: string | null
  observacoes_internas: string | null
  data_inicio_vigencia: Date
  data_fim_vigencia: Date | null
  dia_vencimento: number
  valor_mensal: Prisma.Decimal
  valor_total_estimado: Prisma.Decimal | null
  moeda: string
  itens_snapshot: ContratoItemSnapshot[]
  motivo_encerramento: string | null
  ativado_em: Date | null
  suspenso_em: Date | null
  encerrado_em: Date | null
  cancelado_em: Date | null
  criado_em: Date
  atualizado_em: Date
  empreendimento_nome?: string | null
  empreendimento_cidade?: string | null
  empreendimento_estado?: string | null
  nome_lead?: string | null
  empresa_lead?: string | null
}

function mapContratoResumo(row: ContratoRow): ContratoResumo {
  return {
    id: row.id,
    numero: row.numero,
    status: row.status,
    handoffComercialId: row.handoff_comercial_id,
    propostaComercialId: row.proposta_comercial_id,
    empreendimentoId: row.empreendimento_id,
    empreendimentoNome: row.empreendimento_nome ?? null,
    empreendimentoCidade: row.empreendimento_cidade ?? null,
    empreendimentoEstado: row.empreendimento_estado ?? null,
    nomeLead: row.nome_lead ?? null,
    empresaLead: row.empresa_lead ?? null,
    objeto: row.objeto,
    dataInicioVigencia: row.data_inicio_vigencia,
    dataFimVigencia: row.data_fim_vigencia,
    diaVencimento: row.dia_vencimento,
    valorMensal: decimalToNumber(row.valor_mensal),
    valorTotalEstimado: decimalToNumberOrNull(row.valor_total_estimado),
    moeda: row.moeda,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  }
}

function mapContratoDetalhe(row: ContratoRow): ContratoDetalhe {
  return {
    ...mapContratoResumo(row),
    observacoesContratuais: row.observacoes_contratuais,
    observacoesInternas: row.observacoes_internas,
    motivoEncerramento: row.motivo_encerramento,
    itensSnapshot: Array.isArray(row.itens_snapshot) ? row.itens_snapshot : [],
    ativadoEm: row.ativado_em,
    suspensoEm: row.suspenso_em,
    encerradoEm: row.encerrado_em,
    canceladoEm: row.cancelado_em,
    criadoPorId: row.criado_por_id,
    atualizadoPorId: row.atualizado_por_id,
  }
}

function buildFiltrosSql(input: Pick<ListarContratosInput, 'tenantId' | 'status' | 'empreendimentoId' | 'handoffComercialId' | 'busca'>) {
  const conditions: Prisma.Sql[] = [Prisma.sql`c.tenant_id = ${input.tenantId}`]

  if (input.status) {
    conditions.push(Prisma.sql`c.status = CAST(${input.status} AS "StatusContrato")`)
  }
  if (input.empreendimentoId) {
    conditions.push(Prisma.sql`c.empreendimento_id = ${input.empreendimentoId}`)
  }
  if (input.handoffComercialId) {
    conditions.push(Prisma.sql`c.handoff_comercial_id = ${input.handoffComercialId}`)
  }
  if (input.busca) {
    const padrao = `%${input.busca}%`
    conditions.push(
      Prisma.sql`(c.numero ILIKE ${padrao} OR e.nome ILIKE ${padrao} OR e.nome_fantasia ILIKE ${padrao} OR h.nome_lead ILIKE ${padrao} OR h.empresa_lead ILIKE ${padrao})`,
    )
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
}

export class ContratosService {
  async criar(input: CriarContratoInput): Promise<ContratoDetalhe> {
    const usuario = await prisma.usuario.findFirst({
      where: { id: input.usuarioId, tenantId: input.tenantId, ativo: true },
      select: { id: true, nome: true, email: true, perfil: true },
    })

    if (!usuario) {
      throw new NotFoundError('Usuário', input.usuarioId)
    }

    const handoff = await prisma.handoffComercial.findFirst({
      where: { id: input.handoffComercialId, tenantId: input.tenantId },
      select: {
        id: true,
        propostaComercialId: true,
        empreendimentoId: true,
        status: true,
      },
    })

    if (!handoff) {
      throw new NotFoundError('Handoff comercial', input.handoffComercialId)
    }

    const contratoVigenteExistente = await prisma.contrato.findFirst({
      where: {
        tenantId: input.tenantId,
        handoffComercialId: input.handoffComercialId,
        status: { in: ['RASCUNHO', 'ATIVO', 'SUSPENSO'] },
      },
      select: { id: true, numero: true, status: true },
    })

    if (contratoVigenteExistente) {
      throw new ConflictError(
        `Já existe um contrato vigente (${contratoVigenteExistente.numero}, status ${contratoVigenteExistente.status}) para este handoff.`,
      )
    }

    const itensProposta = await prisma.itemProposta.findMany({
      where: {
        tenantId: input.tenantId,
        propostaId: handoff.propostaComercialId,
        ativo: true,
      },
      orderBy: { ordem: 'asc' },
      select: {
        id: true,
        codigoServico: true,
        nomeServico: true,
        categoriaServico: true,
        quantidade: true,
        precoAplicadoUnitario: true,
        valorAplicadoLinha: true,
      },
    })

    if (itensProposta.length === 0) {
      throw new ConflictError('A proposta vinculada ao handoff não possui itens ativos para contratualização.')
    }

    const itensSnapshot: ContratoItemSnapshot[] = itensProposta.map((item) => ({
      itemPropostaId: item.id,
      codigoServico: item.codigoServico,
      nomeServico: item.nomeServico,
      categoriaServico: item.categoriaServico,
      quantidade: item.quantidade,
      precoAplicadoUnitario: decimalToNumber(item.precoAplicadoUnitario),
      valorAplicadoLinha: decimalToNumber(item.valorAplicadoLinha),
    }))

    const valorMensal = itensSnapshot.reduce((acc, item) => acc + item.valorAplicadoLinha, 0)

    const dataInicio = dateOnly(input.dataInicioVigencia)
    const dataFim = input.dataFimVigencia ? dateOnly(input.dataFimVigencia) : null
    if (dataFim && dataFim <= dataInicio) {
      throw new ConflictError('A data fim de vigência deve ser posterior à data de início.')
    }

    const novoNumero = gerarNumeroContrato()

    const contratoCriado = await prisma.contrato.create({
      data: {
        tenantId: input.tenantId,
        numero: novoNumero,
        status: 'RASCUNHO',
        handoffComercialId: handoff.id,
        propostaComercialId: handoff.propostaComercialId,
        empreendimentoId: handoff.empreendimentoId,
        criadoPorId: input.usuarioId,
        objeto: input.objeto,
        observacoesContratuais: input.observacoesContratuais ?? null,
        observacoesInternas: input.observacoesInternas ?? null,
        dataInicioVigencia: dataInicio,
        dataFimVigencia: dataFim,
        diaVencimento: input.diaVencimento,
        valorMensal: valorMensal.toFixed(2),
        itensSnapshot: itensSnapshot as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    })

    await registrarAuditoria({
      tenantId: input.tenantId,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      usuarioPerfil: usuario.perfil,
      acao: 'CONTRATO_CRIADO',
      entidadeTipo: 'Contrato',
      entidadeId: contratoCriado.id,
      dadosDepois: {
        numero: novoNumero,
        handoffComercialId: handoff.id,
        valorMensal: valorMensal.toFixed(2),
        itensQuantidade: itensSnapshot.length,
      },
    })

    return this.buscarPorId({ tenantId: input.tenantId, id: contratoCriado.id })
  }

  async listar(input: ListarContratosInput): Promise<ListarContratosResult> {
    const whereSql = buildFiltrosSql(input)
    const offset = (input.page - 1) * input.limit

    const [countRows, rows] = await Promise.all([
      prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM contratos c
        LEFT JOIN empreendimentos e ON e.id = c.empreendimento_id
        LEFT JOIN handoffs_comerciais h ON h.id = c.handoff_comercial_id
        ${whereSql}
      `),
      prisma.$queryRaw<ContratoRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.tenant_id,
          c.numero,
          c.status,
          c.handoff_comercial_id,
          c.proposta_comercial_id,
          c.empreendimento_id,
          c.criado_por_id,
          c.atualizado_por_id,
          c.objeto,
          c.observacoes_contratuais,
          c.observacoes_internas,
          c.data_inicio_vigencia,
          c.data_fim_vigencia,
          c.dia_vencimento,
          c.valor_mensal,
          c.valor_total_estimado,
          c.moeda,
          c.itens_snapshot,
          c.motivo_encerramento,
          c.ativado_em,
          c.suspenso_em,
          c.encerrado_em,
          c.cancelado_em,
          c.criado_em,
          c.atualizado_em,
          e.nome AS empreendimento_nome,
          e.cidade AS empreendimento_cidade,
          e.estado AS empreendimento_estado,
          h.nome_lead,
          h.empresa_lead
        FROM contratos c
        LEFT JOIN empreendimentos e ON e.id = c.empreendimento_id
        LEFT JOIN handoffs_comerciais h ON h.id = c.handoff_comercial_id
        ${whereSql}
        ORDER BY c.criado_em DESC
        LIMIT ${input.limit}
        OFFSET ${offset}
      `),
    ])

    return {
      items: rows.map(mapContratoResumo),
      page: input.page,
      limit: input.limit,
      total: Number(countRows[0]?.total ?? 0),
    }
  }

  async buscarPorId(input: BuscarContratoPorIdInput): Promise<ContratoDetalhe> {
    const rows = await prisma.$queryRaw<ContratoRow[]>(Prisma.sql`
      SELECT
        c.id,
        c.tenant_id,
        c.numero,
        c.status,
        c.handoff_comercial_id,
        c.proposta_comercial_id,
        c.empreendimento_id,
        c.criado_por_id,
        c.atualizado_por_id,
        c.objeto,
        c.observacoes_contratuais,
        c.observacoes_internas,
        c.data_inicio_vigencia,
        c.data_fim_vigencia,
        c.dia_vencimento,
        c.valor_mensal,
        c.valor_total_estimado,
        c.moeda,
        c.itens_snapshot,
        c.motivo_encerramento,
        c.ativado_em,
        c.suspenso_em,
        c.encerrado_em,
        c.cancelado_em,
        c.criado_em,
        c.atualizado_em,
        e.nome AS empreendimento_nome,
        e.cidade AS empreendimento_cidade,
        e.estado AS empreendimento_estado,
        h.nome_lead,
        h.empresa_lead
      FROM contratos c
      LEFT JOIN empreendimentos e ON e.id = c.empreendimento_id
      LEFT JOIN handoffs_comerciais h ON h.id = c.handoff_comercial_id
      WHERE c.tenant_id = ${input.tenantId}
        AND c.id = ${input.id}
      LIMIT 1
    `)

    if (rows.length === 0) {
      throw new NotFoundError('Contrato', input.id)
    }

    return mapContratoDetalhe(rows[0]!)
  }

  async atualizar(input: AtualizarContratoInput): Promise<ContratoDetalhe> {
    const usuario = await prisma.usuario.findFirst({
      where: { id: input.usuarioId, tenantId: input.tenantId, ativo: true },
      select: { id: true, nome: true, email: true, perfil: true },
    })

    if (!usuario) {
      throw new NotFoundError('Usuário', input.usuarioId)
    }

    const contratoAtual = await prisma.contrato.findFirst({
      where: { id: input.id, tenantId: input.tenantId },
      select: {
        id: true,
        status: true,
        dataFimVigencia: true,
        observacoesContratuais: true,
        observacoesInternas: true,
        motivoEncerramento: true,
      },
    })

    if (!contratoAtual) {
      throw new NotFoundError('Contrato', input.id)
    }

    const data: Prisma.ContratoUpdateInput = {
      atualizadoPor: { connect: { id: input.usuarioId } },
    }

    if (input.data.status && input.data.status !== contratoAtual.status) {
      const transicoes = STATUS_TRANSITIONS[contratoAtual.status]
      if (!transicoes.includes(input.data.status)) {
        throw new ForbiddenError(
          `Transição de status inválida: ${contratoAtual.status} -> ${input.data.status}.`,
        )
      }
      data.status = input.data.status

      const agora = new Date()
      if (input.data.status === 'ATIVO') {
        data.ativadoEm = agora
      } else if (input.data.status === 'SUSPENSO') {
        data.suspensoEm = agora
      } else if (input.data.status === 'ENCERRADO') {
        data.encerradoEm = agora
      } else if (input.data.status === 'CANCELADO') {
        data.canceladoEm = agora
      }
    }

    if (input.data.dataFimVigencia !== undefined) {
      data.dataFimVigencia = input.data.dataFimVigencia ? dateOnly(input.data.dataFimVigencia) : null
    }
    if (input.data.observacoesContratuais !== undefined) {
      data.observacoesContratuais = input.data.observacoesContratuais ?? null
    }
    if (input.data.observacoesInternas !== undefined) {
      data.observacoesInternas = input.data.observacoesInternas ?? null
    }
    if (input.data.motivoEncerramento !== undefined) {
      data.motivoEncerramento = input.data.motivoEncerramento ?? null
    }

    await prisma.contrato.update({ where: { id: input.id }, data })

    await registrarAuditoria({
      tenantId: input.tenantId,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      usuarioPerfil: usuario.perfil,
      acao: 'CONTRATO_ATUALIZADO',
      entidadeTipo: 'Contrato',
      entidadeId: input.id,
      dadosAntes: {
        status: contratoAtual.status,
        dataFimVigencia: contratoAtual.dataFimVigencia,
        observacoesContratuais: contratoAtual.observacoesContratuais,
        observacoesInternas: contratoAtual.observacoesInternas,
        motivoEncerramento: contratoAtual.motivoEncerramento,
      },
      dadosDepois: input.data,
    })

    return this.buscarPorId({ tenantId: input.tenantId, id: input.id })
  }

  async kpis(tenantId: string): Promise<ContratoKpis> {
    const rows = await prisma.$queryRaw<Array<{ total_ativos: bigint; total_cadastrados: bigint; mrr: Prisma.Decimal | null }>>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'ATIVO')::bigint AS total_ativos,
        COUNT(*)::bigint AS total_cadastrados,
        COALESCE(SUM(valor_mensal) FILTER (WHERE status = 'ATIVO'), 0) AS mrr
      FROM contratos
      WHERE tenant_id = ${tenantId}
    `)

    const row = rows[0]
    return {
      totalAtivos: Number(row?.total_ativos ?? 0),
      totalCadastrados: Number(row?.total_cadastrados ?? 0),
      mrr: decimalToNumber(row?.mrr ?? 0),
      moeda: 'BRL',
    }
  }
}

export const contratosService = new ContratosService()
