import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../../infra/database/prisma.js'
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import type {
  AtualizarOrdemServicoInput,
  BuscarOrdemServicoPorIdInput,
  CriarOrdemServicoInput,
  ListarOrdensServicoInput,
  ListarOrdensServicoResult,
  OrdemServicoDetalhe,
  OrdemServicoKpis,
  OrdemServicoResumo,
  StatusOrdemServico,
} from './ordens-servico.types.js'
import { STATUS_OS_ABERTOS } from './ordens-servico.types.js'

const STATUS_TRANSITIONS: Record<StatusOrdemServico, StatusOrdemServico[]> = {
  PLANEJADA: ['EM_EXECUCAO', 'CANCELADA'],
  EM_EXECUCAO: ['AGUARDANDO_REVISAO', 'CONCLUIDA', 'CANCELADA'],
  AGUARDANDO_REVISAO: ['EM_EXECUCAO', 'CONCLUIDA', 'CANCELADA'],
  CONCLUIDA: [],
  CANCELADA: [],
}

function gerarNumeroOS() {
  const ano = new Date().getUTCFullYear()
  return `OS-${ano}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function parseData(value: string): Date {
  const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value)
  if (Number.isNaN(date.getTime())) {
    throw new ConflictError('Data informada inválida')
  }
  return date
}

interface OSRow {
  id: string
  tenant_id: string
  numero: string
  status: StatusOrdemServico
  tipo: OrdemServicoResumo['tipo']
  prioridade: OrdemServicoResumo['prioridade']
  contrato_id: string
  empreendimento_id: string
  responsavel_id: string | null
  criado_por_id: string
  atualizado_por_id: string | null
  titulo: string
  escopo: string
  local_execucao: string | null
  observacoes_execucao: string | null
  observacoes_internas: string | null
  motivo_cancelamento: string | null
  data_planejada: Date
  data_prevista_conclusao: Date | null
  data_inicio_execucao: Date | null
  data_conclusao: Date | null
  data_cancelamento: Date | null
  criado_em: Date
  atualizado_em: Date
  contrato_numero?: string | null
  empreendimento_nome?: string | null
  empreendimento_cidade?: string | null
  empreendimento_estado?: string | null
  responsavel_nome?: string | null
}

function mapResumo(row: OSRow): OrdemServicoResumo {
  return {
    id: row.id,
    numero: row.numero,
    status: row.status,
    tipo: row.tipo,
    prioridade: row.prioridade,
    contratoId: row.contrato_id,
    contratoNumero: row.contrato_numero ?? null,
    empreendimentoId: row.empreendimento_id,
    empreendimentoNome: row.empreendimento_nome ?? null,
    empreendimentoCidade: row.empreendimento_cidade ?? null,
    empreendimentoEstado: row.empreendimento_estado ?? null,
    responsavelId: row.responsavel_id,
    responsavelNome: row.responsavel_nome ?? null,
    titulo: row.titulo,
    dataPlanejada: row.data_planejada,
    dataPrevistaConclusao: row.data_prevista_conclusao,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  }
}

function mapDetalhe(row: OSRow): OrdemServicoDetalhe {
  return {
    ...mapResumo(row),
    escopo: row.escopo,
    localExecucao: row.local_execucao,
    observacoesExecucao: row.observacoes_execucao,
    observacoesInternas: row.observacoes_internas,
    motivoCancelamento: row.motivo_cancelamento,
    dataInicioExecucao: row.data_inicio_execucao,
    dataConclusao: row.data_conclusao,
    dataCancelamento: row.data_cancelamento,
    criadoPorId: row.criado_por_id,
    atualizadoPorId: row.atualizado_por_id,
  }
}

function buildFiltrosSql(
  input: Pick<
    ListarOrdensServicoInput,
    | 'tenantId'
    | 'usuarioId'
    | 'status'
    | 'prioridade'
    | 'tipo'
    | 'contratoId'
    | 'empreendimentoId'
    | 'responsavelId'
    | 'apenasMinhas'
    | 'apenasAbertas'
  >,
) {
  const conditions: Prisma.Sql[] = [Prisma.sql`os.tenant_id = ${input.tenantId}`]

  if (input.status) {
    conditions.push(Prisma.sql`os.status = CAST(${input.status} AS "StatusOrdemServico")`)
  }
  if (input.prioridade) {
    conditions.push(
      Prisma.sql`os.prioridade = CAST(${input.prioridade} AS "PrioridadeOrdemServico")`,
    )
  }
  if (input.tipo) {
    conditions.push(Prisma.sql`os.tipo = CAST(${input.tipo} AS "TipoOrdemServico")`)
  }
  if (input.contratoId) {
    conditions.push(Prisma.sql`os.contrato_id = ${input.contratoId}`)
  }
  if (input.empreendimentoId) {
    conditions.push(Prisma.sql`os.empreendimento_id = ${input.empreendimentoId}`)
  }
  if (input.responsavelId) {
    conditions.push(Prisma.sql`os.responsavel_id = ${input.responsavelId}`)
  }
  if (input.apenasMinhas) {
    conditions.push(Prisma.sql`os.responsavel_id = ${input.usuarioId}`)
  }
  if (input.apenasAbertas) {
    conditions.push(
      Prisma.sql`os.status IN (${Prisma.join(
        STATUS_OS_ABERTOS.map(
          (status) => Prisma.sql`CAST(${status} AS "StatusOrdemServico")`,
        ),
      )})`,
    )
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
}

export class OrdensServicoService {
  async criar(input: CriarOrdemServicoInput): Promise<OrdemServicoDetalhe> {
    const usuario = await prisma.usuario.findFirst({
      where: { id: input.usuarioId, tenantId: input.tenantId, ativo: true },
      select: { id: true, nome: true, email: true, perfil: true },
    })
    if (!usuario) throw new NotFoundError('Usuário', input.usuarioId)

    const contrato = await prisma.contrato.findFirst({
      where: { id: input.contratoId, tenantId: input.tenantId },
      select: { id: true, status: true, empreendimentoId: true },
    })
    if (!contrato) throw new NotFoundError('Contrato', input.contratoId)
    if (!['ATIVO', 'SUSPENSO'].includes(contrato.status)) {
      throw new ConflictError(
        `O contrato precisa estar ATIVO ou SUSPENSO para emitir OS (atual: ${contrato.status}).`,
      )
    }
    if (!contrato.empreendimentoId) {
      throw new ConflictError('Contrato sem empreendimento vinculado não pode gerar OS.')
    }

    if (input.responsavelId) {
      const responsavel = await prisma.usuario.findFirst({
        where: { id: input.responsavelId, tenantId: input.tenantId, ativo: true },
        select: { id: true },
      })
      if (!responsavel) {
        throw new NotFoundError('Usuário responsável', input.responsavelId)
      }
    }

    const dataPlanejada = parseData(input.dataPlanejada)
    const dataPrevistaConclusao = input.dataPrevistaConclusao
      ? parseData(input.dataPrevistaConclusao)
      : null
    if (dataPrevistaConclusao && dataPrevistaConclusao < dataPlanejada) {
      throw new ConflictError('A data prevista de conclusão deve ser igual ou posterior à data planejada.')
    }

    const novoNumero = gerarNumeroOS()

    const criada = await prisma.ordemServico.create({
      data: {
        tenantId: input.tenantId,
        numero: novoNumero,
        status: 'PLANEJADA',
        tipo: input.tipo,
        prioridade: input.prioridade ?? 'MEDIA',
        contratoId: contrato.id,
        empreendimentoId: contrato.empreendimentoId,
        responsavelId: input.responsavelId ?? null,
        criadoPorId: input.usuarioId,
        titulo: input.titulo,
        escopo: input.escopo,
        localExecucao: input.localExecucao ?? null,
        observacoesInternas: input.observacoesInternas ?? null,
        dataPlanejada,
        dataPrevistaConclusao,
      },
      select: { id: true },
    })

    await registrarAuditoria({
      tenantId: input.tenantId,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      usuarioPerfil: usuario.perfil,
      acao: 'ORDEM_SERVICO_CRIADA',
      entidadeTipo: 'OrdemServico',
      entidadeId: criada.id,
      dadosDepois: {
        numero: novoNumero,
        contratoId: contrato.id,
        tipo: input.tipo,
        prioridade: input.prioridade ?? 'MEDIA',
      },
    })

    return this.buscarPorId({ tenantId: input.tenantId, id: criada.id })
  }

  async listar(input: ListarOrdensServicoInput): Promise<ListarOrdensServicoResult> {
    const whereSql = buildFiltrosSql(input)
    const offset = (input.page - 1) * input.limit

    const [countRows, rows] = await Promise.all([
      prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM ordens_servico os
        ${whereSql}
      `),
      prisma.$queryRaw<OSRow[]>(Prisma.sql`
        SELECT
          os.id,
          os.tenant_id,
          os.numero,
          os.status,
          os.tipo,
          os.prioridade,
          os.contrato_id,
          os.empreendimento_id,
          os.responsavel_id,
          os.criado_por_id,
          os.atualizado_por_id,
          os.titulo,
          os.escopo,
          os.local_execucao,
          os.observacoes_execucao,
          os.observacoes_internas,
          os.motivo_cancelamento,
          os.data_planejada,
          os.data_prevista_conclusao,
          os.data_inicio_execucao,
          os.data_conclusao,
          os.data_cancelamento,
          os.criado_em,
          os.atualizado_em,
          c.numero AS contrato_numero,
          e.nome AS empreendimento_nome,
          e.cidade AS empreendimento_cidade,
          e.estado AS empreendimento_estado,
          u.nome AS responsavel_nome
        FROM ordens_servico os
        LEFT JOIN contratos c ON c.id = os.contrato_id
        LEFT JOIN empreendimentos e ON e.id = os.empreendimento_id
        LEFT JOIN usuarios u ON u.id = os.responsavel_id
        ${whereSql}
        ORDER BY os.data_planejada ASC, os.criado_em DESC
        LIMIT ${input.limit}
        OFFSET ${offset}
      `),
    ])

    return {
      items: rows.map(mapResumo),
      page: input.page,
      limit: input.limit,
      total: Number(countRows[0]?.total ?? 0),
    }
  }

  async buscarPorId(input: BuscarOrdemServicoPorIdInput): Promise<OrdemServicoDetalhe> {
    const rows = await prisma.$queryRaw<OSRow[]>(Prisma.sql`
      SELECT
        os.*,
        c.numero AS contrato_numero,
        e.nome AS empreendimento_nome,
        e.cidade AS empreendimento_cidade,
        e.estado AS empreendimento_estado,
        u.nome AS responsavel_nome
      FROM ordens_servico os
      LEFT JOIN contratos c ON c.id = os.contrato_id
      LEFT JOIN empreendimentos e ON e.id = os.empreendimento_id
      LEFT JOIN usuarios u ON u.id = os.responsavel_id
      WHERE os.tenant_id = ${input.tenantId} AND os.id = ${input.id}
      LIMIT 1
    `)

    if (rows.length === 0) {
      throw new NotFoundError('Ordem de serviço', input.id)
    }

    return mapDetalhe(rows[0]!)
  }

  async atualizar(input: AtualizarOrdemServicoInput): Promise<OrdemServicoDetalhe> {
    const usuario = await prisma.usuario.findFirst({
      where: { id: input.usuarioId, tenantId: input.tenantId, ativo: true },
      select: { id: true, nome: true, email: true, perfil: true },
    })
    if (!usuario) throw new NotFoundError('Usuário', input.usuarioId)

    const osAtual = await prisma.ordemServico.findFirst({
      where: { id: input.id, tenantId: input.tenantId },
      select: { id: true, status: true, responsavelId: true },
    })
    if (!osAtual) throw new NotFoundError('Ordem de serviço', input.id)

    if (input.data.responsavelId) {
      const responsavel = await prisma.usuario.findFirst({
        where: { id: input.data.responsavelId, tenantId: input.tenantId, ativo: true },
        select: { id: true },
      })
      if (!responsavel) {
        throw new NotFoundError('Usuário responsável', input.data.responsavelId)
      }
    }

    const data: Prisma.OrdemServicoUpdateInput = {
      atualizadoPor: { connect: { id: input.usuarioId } },
    }

    if (input.data.status && input.data.status !== osAtual.status) {
      const transicoes = STATUS_TRANSITIONS[osAtual.status]
      if (!transicoes.includes(input.data.status)) {
        throw new ForbiddenError(
          `Transição de status inválida: ${osAtual.status} -> ${input.data.status}.`,
        )
      }
      data.status = input.data.status

      const agora = new Date()
      if (input.data.status === 'EM_EXECUCAO' && !osAtual.responsavelId && !input.data.responsavelId) {
        throw new ConflictError('Atribua um responsável antes de iniciar a execução da OS.')
      }
      if (input.data.status === 'EM_EXECUCAO') data.dataInicioExecucao = agora
      if (input.data.status === 'CONCLUIDA') data.dataConclusao = agora
      if (input.data.status === 'CANCELADA') data.dataCancelamento = agora
    }

    if (input.data.prioridade !== undefined) data.prioridade = input.data.prioridade
    if (input.data.tipo !== undefined) data.tipo = input.data.tipo
    if (input.data.titulo !== undefined) data.titulo = input.data.titulo
    if (input.data.escopo !== undefined) data.escopo = input.data.escopo
    if (input.data.responsavelId !== undefined) {
      data.responsavel = input.data.responsavelId
        ? { connect: { id: input.data.responsavelId } }
        : { disconnect: true }
    }
    if (input.data.localExecucao !== undefined) {
      data.localExecucao = input.data.localExecucao ?? null
    }
    if (input.data.observacoesExecucao !== undefined) {
      data.observacoesExecucao = input.data.observacoesExecucao ?? null
    }
    if (input.data.observacoesInternas !== undefined) {
      data.observacoesInternas = input.data.observacoesInternas ?? null
    }
    if (input.data.motivoCancelamento !== undefined) {
      data.motivoCancelamento = input.data.motivoCancelamento ?? null
    }
    if (input.data.dataPlanejada !== undefined) {
      data.dataPlanejada = parseData(input.data.dataPlanejada)
    }
    if (input.data.dataPrevistaConclusao !== undefined) {
      data.dataPrevistaConclusao = input.data.dataPrevistaConclusao
        ? parseData(input.data.dataPrevistaConclusao)
        : null
    }

    await prisma.ordemServico.update({ where: { id: input.id }, data })

    await registrarAuditoria({
      tenantId: input.tenantId,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      usuarioPerfil: usuario.perfil,
      acao: 'ORDEM_SERVICO_ATUALIZADA',
      entidadeTipo: 'OrdemServico',
      entidadeId: input.id,
      dadosAntes: { status: osAtual.status, responsavelId: osAtual.responsavelId },
      dadosDepois: input.data,
    })

    return this.buscarPorId({ tenantId: input.tenantId, id: input.id })
  }

  async kpis(tenantId: string): Promise<OrdemServicoKpis> {
    const rows = await prisma.$queryRaw<
      Array<{
        total_abertas: bigint
        total_em_execucao: bigint
        total_criticas: bigint
        total_concluidas_mes: bigint
      }>
    >(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('PLANEJADA', 'EM_EXECUCAO', 'AGUARDANDO_REVISAO'))::bigint AS total_abertas,
        COUNT(*) FILTER (WHERE status = 'EM_EXECUCAO')::bigint AS total_em_execucao,
        COUNT(*) FILTER (WHERE prioridade = 'CRITICA' AND status IN ('PLANEJADA', 'EM_EXECUCAO', 'AGUARDANDO_REVISAO'))::bigint AS total_criticas,
        COUNT(*) FILTER (WHERE status = 'CONCLUIDA' AND data_conclusao >= date_trunc('month', NOW()))::bigint AS total_concluidas_mes
      FROM ordens_servico
      WHERE tenant_id = ${tenantId}
    `)

    const row = rows[0]
    return {
      totalAbertas: Number(row?.total_abertas ?? 0),
      totalEmExecucao: Number(row?.total_em_execucao ?? 0),
      totalCriticas: Number(row?.total_criticas ?? 0),
      totalConcluidasMes: Number(row?.total_concluidas_mes ?? 0),
    }
  }
}

export const ordensServicoService = new OrdensServicoService()
