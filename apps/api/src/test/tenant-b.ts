import argon2 from 'argon2'
import { prisma } from '../infra/database/prisma.js'
import { loginDemo, type TestApp } from './helpers.js'

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURE DE SEGUNDO TENANT (isolamento cross-tenant)
// Cria, de forma idempotente, um tenant B completo (empresa + empreendimento +
// admin + tipo de documento) para escrever testes que provem que o tenant A não
// acessa/altera recursos do tenant B. A senha é a mesma do seed (Demo@1234), então
// `loginDemo(app, email)` autentica o admin do tenant B.
// ─────────────────────────────────────────────────────────────────────────────

const TENANT_B_SLUG = 'tenant-b-isolation'
const TENANT_B_EMAIL = 'admin@tenantb.test'

export interface TenantBContext {
  tenantId: string
  empresaId: string
  empreendimentoId: string
  usuarioId: string
  tipoDocumentoId: string
  token: string
}

export async function setupTenantB(app: TestApp): Promise<TenantBContext> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_B_SLUG },
    update: {},
    create: {
      nome: 'Tenant B (Isolamento)',
      slug: TENANT_B_SLUG,
      plano: 'ENTERPRISE',
      ativo: true,
      limiteEmpreendimentos: 100,
    },
  })

  const empresa = await prisma.empresa.upsert({
    where: { tenantId_cnpj: { tenantId: tenant.id, cnpj: '99999999000199' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Empresa Tenant B',
      razaoSocial: 'Empresa Tenant B LTDA',
      cnpj: '99999999000199',
      ativo: true,
    },
  })

  const senhaHash = await argon2.hash('Demo@1234', { type: argon2.argon2id })
  const usuario = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: TENANT_B_EMAIL } },
    update: { senhaHash, ativo: true },
    create: {
      tenantId: tenant.id,
      nome: 'Admin Tenant B',
      email: TENANT_B_EMAIL,
      senhaHash,
      perfil: 'ADMIN_TENANT',
      ativo: true,
    },
  })

  let empreendimento = await prisma.empreendimento.findFirst({
    where: { tenantId: tenant.id, empresaId: empresa.id },
    select: { id: true },
  })
  if (!empreendimento) {
    empreendimento = await prisma.empreendimento.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        nome: 'Posto Tenant B',
        logradouro: 'Rua B',
        numero: '100',
        bairro: 'Centro',
        cidade: 'Goiânia',
        estado: 'GO',
        cep: '74000000',
        atividades: [],
      },
      select: { id: true },
    })
  }

  const tipoDocumento = await prisma.tipoDocumento.upsert({
    where: { tenantId_nome: { tenantId: tenant.id, nome: 'Tipo Doc Tenant B' } },
    update: {},
    create: { tenantId: tenant.id, nome: 'Tipo Doc Tenant B', categoria: 'OUTROS' },
  })

  const token = await loginDemo(app, TENANT_B_EMAIL)

  return {
    tenantId: tenant.id,
    empresaId: empresa.id,
    empreendimentoId: empreendimento.id,
    usuarioId: usuario.id,
    tipoDocumentoId: tipoDocumento.id,
    token,
  }
}
