import { ConflictError } from '../../shared/errors/app-errors.js'
import { registrarAuditoria } from '../../shared/middleware/audit.js'
import { prisma } from '../../infra/database/prisma.js'

// ─────────────────────────────────────────────────────────────────────────────
// EMPRESAS SERVICE
// A Empresa é a "matriz" sob a qual vivem os empreendimentos (postos). Sem ela
// não é possível cadastrar nenhum posto — por isso este CRUD é pré-requisito do
// onboarding self-service de um tenant novo.
// ─────────────────────────────────────────────────────────────────────────────

interface ContextoUsuario {
  id: string
  tenantId: string
  perfil: string
  nome: string
  email: string
  ip: string
}

export interface CriarEmpresaInput {
  nome: string
  razaoSocial: string
  cnpj: string
  inscricaoEstadual?: string | null
  inscricaoMunicipal?: string | null
}

export class EmpresasService {
  async listar(ctx: ContextoUsuario) {
    return prisma.empresa.findMany({
      where: { tenantId: ctx.tenantId, ativo: true },
      orderBy: { nome: 'asc' },
      include: { _count: { select: { empreendimentos: true } } },
    })
  }

  async criar(ctx: ContextoUsuario, data: CriarEmpresaInput) {
    const cnpjLimpo = data.cnpj.replace(/\D/g, '')

    const existente = await prisma.empresa.findFirst({
      where: { tenantId: ctx.tenantId, cnpj: cnpjLimpo },
      select: { id: true },
    })
    if (existente) {
      throw new ConflictError(`CNPJ ${data.cnpj} já cadastrado neste tenant`)
    }

    const empresa = await prisma.empresa.create({
      data: {
        tenantId: ctx.tenantId,
        nome: data.nome,
        razaoSocial: data.razaoSocial,
        cnpj: cnpjLimpo,
        inscricaoEstadual: data.inscricaoEstadual ?? null,
        inscricaoMunicipal: data.inscricaoMunicipal ?? null,
        ativo: true,
      },
    })

    await registrarAuditoria({
      tenantId: ctx.tenantId,
      usuarioId: ctx.id,
      usuarioNome: ctx.nome,
      usuarioEmail: ctx.email,
      acao: 'empresa.criada',
      entidadeTipo: 'empresa',
      entidadeId: empresa.id,
      dadosDepois: empresa,
      ipOrigem: ctx.ip,
    })

    return empresa
  }
}

export const empresasService = new EmpresasService()
