import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import * as readline from 'node:readline'

// ─────────────────────────────────────────────────────────────────────────────
// CRIAR SUPER_ADMIN (bootstrap de produção)
// Sem um SUPER_ADMIN não há como provisionar o primeiro tenant real (o seed é só demo).
// Uso (não-interativo, recomendado em prod):
//   SUPERADMIN_EMAIL=admin@empresa.com SUPERADMIN_SENHA='S3nhaForte12+' \
//   SUPERADMIN_NOME='Fulano' pnpm --filter @repo/api create-superadmin
// Idempotente: roda de novo só atualiza a senha/perfil.
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

async function main() {
  const precisaPrompt = !process.env.SUPERADMIN_EMAIL || !process.env.SUPERADMIN_SENHA
  const rl = precisaPrompt
    ? readline.createInterface({ input: process.stdin, output: process.stdout })
    : null
  const perguntar = (q: string): Promise<string> =>
    rl ? new Promise((res) => rl.question(q, res)) : Promise.resolve('')

  try {
    const email = (process.env.SUPERADMIN_EMAIL ?? (await perguntar('E-mail do SUPER_ADMIN: ')))
      .trim()
      .toLowerCase()
    const senha = process.env.SUPERADMIN_SENHA ?? (await perguntar('Senha (mín. 12 caracteres): '))
    const nome = (process.env.SUPERADMIN_NOME ?? (rl ? await perguntar('Nome: ') : '')) || 'Super Admin'

    if (!email || !senha) {
      console.error('❌ E-mail e senha são obrigatórios.')
      process.exit(1)
    }
    if (senha.length < 12) {
      console.error('❌ A senha do SUPER_ADMIN deve ter pelo menos 12 caracteres.')
      process.exit(1)
    }

    // Tenant "sistema" hospeda o super admin (Usuario.tenantId é obrigatório no schema).
    // O perfil SUPER_ADMIN é o que concede administração de TODOS os tenants.
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'sistema' },
      update: {},
      create: {
        nome: 'Sistema',
        slug: 'sistema',
        plano: 'ENTERPRISE',
        ativo: true,
        limiteEmpreendimentos: 0,
      },
    })

    const senhaHash = await argon2.hash(senha, { type: argon2.argon2id })
    const usuario = await prisma.usuario.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      update: {
        senhaHash,
        perfil: 'SUPER_ADMIN',
        ativo: true,
        tentativasLoginFalhas: 0,
        bloqueadoAte: null,
      },
      create: {
        tenantId: tenant.id,
        nome,
        email,
        senhaHash,
        perfil: 'SUPER_ADMIN',
        ativo: true,
      },
    })

    console.log(`✅ SUPER_ADMIN pronto: ${usuario.email}`)
    console.log(`   tenant "sistema": ${tenant.id}`)
    console.log('   Agora faça login e provisione o primeiro tenant real em /tenants.')
  } finally {
    rl?.close()
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Falha ao criar SUPER_ADMIN:', err)
  process.exit(1)
})
