import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../../infra/database/prisma.js'
import { ConflictError, NotFoundError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { entregavelQueue } from '../../infra/queue/bullmq.js'
import type {
  BuscarEntregavelPorIdInput,
  CancelarEntregavelInput,
  CriarEntregavelInput,
  EntregavelDetalhe,
  EntregavelKpis,
  EntregavelResumo,
  ListarEntregaveisInput,
  ListarEntregaveisResult,
  StatusEntregavel,
  TipoEntregavel,
} from './entregaveis.types.js'

interface EntregavelRow {
  id: string
  tenant_id: string
  numero: string
  status: StatusEntregavel
  tipo: TipoEntregavel
  ordem_servico_id: string
  contrato_id: string | null
  empreendimento_id: string
  criado_por_id: string
  atualizado_por_id: string | null
  titulo: string
  descricao: string | null
  s3_key: string | null
  nome_arquivo: string | null
  tamanho_bytes: number | null
  erro_msg: string | null
  gerado_em: Date | null
  cancelado_em: Date | null
  criado_em: Date
  atualizado_em: Date
  os_numero?: string | null
  empreendimento_nome?: string | null
}

function mapResumo(row: EntregavelRow): EntregavelResumo {
  return {
    id: row.id,
    numero: row.numero,
    status: row.status,
    tipo: row.tipo,
    ordemServicoId: row.ordem_servico_id,
    osNumero: row.os_numero ?? null,
    contratoId: row.contrato_id,
    empreendimentoId: row.empreendimento_id,
    empreendimentoNome: row.empreendimento_nome ?? null,
    titulo: row.titulo,
    s3Key: row.s3_key,
    nomeArquivo: row.nome_arquivo,
    tamanhoBytes: row.tamanho_bytes,
    geradoEm: row.gerado_em,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  }
}

function mapDetalhe(row: EntregavelRow): EntregavelDetalhe {
  return {
    ...mapResumo(row),
    descricao: row.descricao,
    erroMsg: row.erro_msg,
    canceladoEm: row.cancelado_em,
    criadoPorId: row.criado_por_id,
    atualizadoPorId: row.atualizado_por_id,
  }
}

function buildFiltrosSql(input: ListarEntregaveisInput) {
  const conditions: Prisma.Sql[] = [Prisma.sql`ent.tenant_id = ${input.tenantId}`]

  if (input.status) {
    conditions.push(Prisma.sql`ent.status = CAST(${input.status} AS "StatusEntregavel")`)
  }
  if (input.tipo) {
    conditions.push(Prisma.sql`ent.tipo = CAST(${input.tipo} AS "TipoEntregavel")`)
  }
  if (input.ordemServicoId) {
    conditions.push(Prisma.sql`ent.ordem_servico_id = ${input.ordemServicoId}`)
  }
  if (input.contratoId) {
    conditions.push(Prisma.sql`ent.contrato_id = ${input.contratoId}`)
  }
  if (input.empreendimentoId) {
    conditions.push(Prisma.sql`ent.empreendimento_id = ${input.empreendimentoId}`)
  }
  if (input.busca) {
    const termo = `%${input.busca}%`
    conditions.push(
      Prisma.sql`(ent.numero ILIKE ${termo} OR ent.titulo ILIKE ${termo} OR e.nome ILIKE ${termo})`,
    )
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
}

export class EntregaveisService {
  async criar(input: CriarEntregavelInput): Promise<EntregavelDetalhe> {
    const usuario = await prisma.usuario.findFirst({
      where: { id: input.usuarioId, tenantId: input.tenantId, ativo: true },
      select: { id: true, nome: true, email: true, perfil: true },
    })
    if (!usuario) throw new NotFoundError('Usuário', input.usuarioId)

    const os = await prisma.ordemServico.findFirst({
      where: { id: input.ordemServicoId, tenantId: input.tenantId },
      select: { id: true, contratoId: true, empreendimentoId: true },
    })
    if (!os) throw new NotFoundError('Ordem de serviço', input.ordemServicoId)

    const novoNumero = `ENT-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`

    const criado = await prisma.entregavel.create({
      data: {
        tenantId: input.tenantId,
        numero: novoNumero,
        status: 'PENDENTE',
        tipo: input.tipo,
        ordemServicoId: os.id,
        contratoId: os.contratoId ?? null,
        empreendimentoId: os.empreendimentoId,
        criadoPorId: input.usuarioId,
        titulo: input.titulo,
        descricao: input.descricao ?? null,
      },
      select: { id: true },
    })

    await entregavelQueue.add('gerar-entregavel', {
      entregavelId: criado.id,
      tenantId: input.tenantId,
    })

    await registrarAuditoria({
      tenantId: input.tenantId,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      usuarioPerfil: usuario.perfil,
      acao: 'ENTREGAVEL_CRIADO',
      entidadeTipo: 'Entregavel',
      entidadeId: criado.id,
      dadosDepois: {
        numero: novoNumero,
        ordemServicoId: os.id,
        tipo: input.tipo,
      },
    })

    return this.buscarPorId({ tenantId: input.tenantId, id: criado.id })
  }

  async listar(input: ListarEntregaveisInput): Promise<ListarEntregaveisResult> {
    const whereSql = buildFiltrosSql(input)
    const offset = (input.page - 1) * input.limit

    const [countRows, rows] = await Promise.all([
      prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM entregaveis ent
        LEFT JOIN empreendimentos e ON e.id = ent.empreendimento_id
        ${whereSql}
      `),
      prisma.$queryRaw<EntregavelRow[]>(Prisma.sql`
        SELECT
          ent.id,
          ent.tenant_id,
          ent.numero,
          ent.status,
          ent.tipo,
          ent.ordem_servico_id,
          ent.contrato_id,
          ent.empreendimento_id,
          ent.criado_por_id,
          ent.atualizado_por_id,
          ent.titulo,
          ent.descricao,
          ent.s3_key,
          ent.nome_arquivo,
          ent.tamanho_bytes,
          ent.erro_msg,
          ent.gerado_em,
          ent.cancelado_em,
          ent.criado_em,
          ent.atualizado_em,
          os.numero AS os_numero,
          e.nome AS empreendimento_nome
        FROM entregaveis ent
        LEFT JOIN ordens_servico os ON os.id = ent.ordem_servico_id
        LEFT JOIN empreendimentos e ON e.id = ent.empreendimento_id
        ${whereSql}
        ORDER BY ent.criado_em DESC
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

  async buscarPorId(input: BuscarEntregavelPorIdInput): Promise<EntregavelDetalhe> {
    const rows = await prisma.$queryRaw<EntregavelRow[]>(Prisma.sql`
      SELECT
        ent.*,
        os.numero AS os_numero,
        e.nome AS empreendimento_nome
      FROM entregaveis ent
      LEFT JOIN ordens_servico os ON os.id = ent.ordem_servico_id
      LEFT JOIN empreendimentos e ON e.id = ent.empreendimento_id
      WHERE ent.tenant_id = ${input.tenantId} AND ent.id = ${input.id}
      LIMIT 1
    `)

    if (rows.length === 0) {
      throw new NotFoundError('Entregável', input.id)
    }

    return mapDetalhe(rows[0]!)
  }

  async cancelar(input: CancelarEntregavelInput): Promise<EntregavelDetalhe> {
    const usuario = await prisma.usuario.findFirst({
      where: { id: input.usuarioId, tenantId: input.tenantId, ativo: true },
      select: { id: true, nome: true, email: true, perfil: true },
    })
    if (!usuario) throw new NotFoundError('Usuário', input.usuarioId)

    const entregavel = await prisma.entregavel.findFirst({
      where: { id: input.id, tenantId: input.tenantId },
      select: { id: true, status: true },
    })
    if (!entregavel) throw new NotFoundError('Entregável', input.id)

    if (['GERANDO', 'DISPONIVEL'].includes(entregavel.status)) {
      throw new ConflictError(
        `Não é possível cancelar um entregável com status ${entregavel.status}.`,
      )
    }

    const agora = new Date()
    await prisma.entregavel.update({
      where: { id: input.id },
      data: {
        status: 'CANCELADO',
        canceladoEm: agora,
        atualizadoPorId: input.usuarioId,
      },
    })

    await registrarAuditoria({
      tenantId: input.tenantId,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      usuarioPerfil: usuario.perfil,
      acao: 'ENTREGAVEL_CANCELADO',
      entidadeTipo: 'Entregavel',
      entidadeId: input.id,
      dadosAntes: { status: entregavel.status },
      dadosDepois: { status: 'CANCELADO', canceladoEm: agora },
    })

    return this.buscarPorId({ tenantId: input.tenantId, id: input.id })
  }

  async kpis(tenantId: string): Promise<EntregavelKpis> {
    const rows = await prisma.$queryRaw<
      Array<{
        total_pendentes: bigint
        total_disponiveis: bigint
        total_cadastrados: bigint
      }>
    >(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('PENDENTE', 'GERANDO'))::bigint AS total_pendentes,
        COUNT(*) FILTER (WHERE status = 'DISPONIVEL')::bigint AS total_disponiveis,
        COUNT(*)::bigint AS total_cadastrados
      FROM entregaveis
      WHERE tenant_id = ${tenantId}
    `)

    const row = rows[0]
    return {
      totalPendentes: Number(row?.total_pendentes ?? 0),
      totalDisponiveis: Number(row?.total_disponiveis ?? 0),
      totalCadastrados: Number(row?.total_cadastrados ?? 0),
    }
  }
}

export const entregaveisService = new EntregaveisService()
