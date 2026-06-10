import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import * as readline from 'node:readline'

// ─────────────────────────────────────────────────────────────────────────────
// RESET DE SENHA
// Uso: pnpm --filter api reset-password
//   ou: EMAIL=admin@postodemo.com.br NOVA_SENHA=MinhaS3nha! pnpm --filter api reset-password
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

function perguntar(rl: readline.Interface, pergunta: string): Promise<string> {
  return new Promise((resolve) => rl.question(pergunta, resolve))
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  try {
    // Lê email e senha do env ou pede interativamente
    const email = process.env.EMAIL ?? (await perguntar(rl, 'E-mail do usuário: '))
    const novaSenha = process.env.NOVA_SENHA ?? (await perguntar(rl, 'Nova senha (mín. 8 caracteres): '))

    if (!email || !novaSenha) {
      console.error('❌ E-mail e senha são obrigatórios.')
      process.exit(1)
    }

    if (novaSenha.length < 8) {
      console.error('❌ A senha deve ter pelo menos 8 caracteres.')
      process.exit(1)
    }

    const usuario = await prisma.usuario.findFirst({ where: { email } })
    if (!usuario) {
      console.error(`❌ Usuário não encontrado: ${email}`)
      process.exit(1)
    }

    const senhaHash = await argon2.hash(novaSenha, { type: argon2.argon2id })
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senhaHash, tentativasLoginFalhas: 0, bloqueadoAte: null },
    })

    console.log(`✅ Senha de ${email} atualizada com sucesso.`)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('❌ Erro:', e)
  process.exit(1)
})
