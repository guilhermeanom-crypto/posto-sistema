/**
 * Seed dedicado ao Portal do Cliente (demo).
 *
 * Roda em cima do seed principal (que já criou tenant, empresa, empreendimentos
 * e tipos de documento básicos). Aqui apenas:
 *   1. Lê o JSON de documentos solicitados (apps/api/src/modules/portal/documentos.portal.seed.json)
 *   2. Upsert dos TipoDocumento por `codigo` (acrescentando momento + descricaoCliente)
 *   3. Cria/atualiza usuário REPRESENTANTE_POSTO de demonstração
 *   4. Liga ele ao primeiro empreendimento via EmpreendimentoAcesso
 *   5. Para cada TipoDocumento, garante um Documento PENDENTE para o empreendimento demo
 *
 * Pode ser rodado quantas vezes precisar — é idempotente.
 *
 * Como rodar:
 *   pnpm --filter @repo/api exec tsx prisma/seed-portal-demo.ts
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient, type CategoriaDocumento, type MomentoDocumento } from '@prisma/client'
import argon2 from 'argon2'

const __dirname = dirname(fileURLToPath(import.meta.url))

const prisma = new PrismaClient()

const SENHA_DEMO = process.env.SEED_ADMIN_PASSWORD ?? 'Demo@1234'
const EMAIL_REPRESENTANTE = 'representante@postodemo.com.br'

type SeedEntry = {
  codigo: string
  nome: string
  momento: 'ANTES_PROCESSO' | 'DURANTE_PROCESSO' | 'APOS_EMISSAO'
  categoria: CategoriaDocumento
  descricaoCliente: string
  obrigatorio: boolean
  aceitaJustificativa: boolean
  camposPreenchimento: Record<string, string>
}

async function main() {
  console.log('🌱 Seed Portal Cliente (demo)...')

  const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' } })
  if (!tenant) throw new Error('Tenant "demo" não encontrado. Rode o seed principal antes.')

  const empreendimento = await prisma.empreendimento.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { criadoEm: 'asc' },
  })
  if (!empreendimento) throw new Error('Nenhum empreendimento no tenant demo. Rode o seed principal antes.')

  console.log(`  ↳ Tenant: ${tenant.nome}`)
  console.log(`  ↳ Empreendimento demo: ${empreendimento.nome ?? empreendimento.codigoInterno}`)

  // 1) Carrega JSON
  const jsonPath = join(__dirname, '../src/modules/portal/documentos.portal.seed.json')
  const entries: SeedEntry[] = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  console.log(`  ↳ ${entries.length} documentos solicitados no JSON`)

  // 2) Upsert TipoDocumento por codigo
  const tiposPorCodigo = new Map<string, string>() // codigo → tipoDocumentoId
  for (const entry of entries) {
    const existente = await prisma.tipoDocumento.findFirst({
      where: { tenantId: tenant.id, codigo: entry.codigo },
    })

    const data = {
      tenantId: tenant.id,
      codigo: entry.codigo,
      nome: entry.nome,
      descricaoCliente: entry.descricaoCliente,
      momento: entry.momento as MomentoDocumento,
      categoria: entry.categoria,
      ativo: true,
    }

    const tipo = existente
      ? await prisma.tipoDocumento.update({ where: { id: existente.id }, data })
      : await prisma.tipoDocumento.create({ data })

    tiposPorCodigo.set(entry.codigo, tipo.id)
  }
  console.log(`  ✅ ${tiposPorCodigo.size} tipos de documento upserted`)

  // 3) Usuário REPRESENTANTE_POSTO demo
  const senhaHash = await argon2.hash(SENHA_DEMO, { type: argon2.argon2id })

  const representante = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: EMAIL_REPRESENTANTE } },
    update: { ativo: true },
    create: {
      tenantId: tenant.id,
      nome: 'Representante Posto Demo',
      email: EMAIL_REPRESENTANTE,
      senhaHash,
      perfil: 'REPRESENTANTE_POSTO',
      ativo: true,
    },
  })
  console.log(`  ✅ Usuário: ${representante.email}`)

  // 4) EmpreendimentoAcesso
  await prisma.empreendimentoAcesso.upsert({
    where: {
      usuarioId_empreendimentoId: {
        usuarioId: representante.id,
        empreendimentoId: empreendimento.id,
      },
    },
    update: {},
    create: {
      usuarioId: representante.id,
      empreendimentoId: empreendimento.id,
    },
  })
  console.log(`  ✅ Acesso vinculado ao empreendimento`)

  // 5) Documentos solicitados (1 por tipo, status PENDENTE se ainda não existir)
  let criados = 0
  let reaproveitados = 0
  for (const entry of entries) {
    const tipoId = tiposPorCodigo.get(entry.codigo)!
    const existente = await prisma.documento.findFirst({
      where: {
        tenantId: tenant.id,
        empreendimentoId: empreendimento.id,
        tipoDocumentoId: tipoId,
      },
    })

    if (existente) {
      reaproveitados++
      continue
    }

    await prisma.documento.create({
      data: {
        tenantId: tenant.id,
        empreendimentoId: empreendimento.id,
        tipoDocumentoId: tipoId,
        nome: entry.nome,
        descricao: entry.descricaoCliente,
        status: 'PENDENTE',
      },
    })
    criados++
  }
  console.log(`  ✅ Documentos solicitados: ${criados} criados, ${reaproveitados} reaproveitados`)

  console.log('\n🎉 Seed Portal Cliente concluído.')
  console.log(`\n   Login do portal: ${EMAIL_REPRESENTANTE}`)
  console.log(`   Senha:           ${SENHA_DEMO}`)
  console.log(`   Acesse:          http://localhost:3000/portal/login\n`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed Portal Cliente:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
