import { buildApp } from '../src/app.js'
import { prisma } from '../src/infra/database/prisma.js'
import { redis } from '../src/infra/cache/redis.js'

const payload = {
  cnaes: (process.env.DIAG_CNAES ?? '4731-8/00').split(',').map((codigo) => codigo.trim()).filter(Boolean),
  uf: process.env.DIAG_UF ?? 'SP',
  porte: (process.env.DIAG_PORTE ?? 'MEDIO') as 'MICRO' | 'PEQUENO' | 'MEDIO' | 'GRANDE' | 'MUITO_GRANDE',
  situacao: (process.env.DIAG_SITUACAO ?? 'IRREGULAR') as
    | 'PLANEJADO'
    | 'IMPLANTACAO'
    | 'OPERACAO'
    | 'IRREGULAR'
    | 'RENOVACAO',
  temOutorgaAnterior: process.env.DIAG_TEM_OUTORGA_ANTERIOR === 'true' ? true : false,
}

async function main() {
  const app = await buildApp()
  const falhas: string[] = []

  try {
    const semToken = await app.inject({
      method: 'POST',
      url: '/api/v1/comercial/diagnostico/cnae',
      payload,
    })

    console.log(`Protecao JWT: HTTP ${semToken.statusCode}`)
    if (semToken.statusCode !== 401) {
      falhas.push(`Protecao JWT esperava 401 e recebeu ${semToken.statusCode}`)
    }

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {
        email: process.env.DIAG_EMAIL ?? 'admin@postodemo.com.br',
        senha: process.env.DIAG_SENHA ?? 'Demo@1234',
      },
    })

    const loginData = loginRes.json()
    const token = loginData.data?.accessToken

    if (loginRes.statusCode !== 200 || !token) {
      console.error('Falha no login:', JSON.stringify(loginData, null, 2))
      process.exitCode = 1
      return
    }

    console.log('Login OK.')

    const catalogoRes = await app.inject({
      method: 'GET',
      url: '/api/v1/comercial/catalogo?limit=1',
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    const catalogoData = catalogoRes.json()
    const primeiroServico = catalogoData.data?.[0]
    const camposSensveis = [
      'custoInternoEstimado',
      'margemLucroAlvo',
      'valorReferenciaHora',
      'metadata',
      'atualizadoEm',
    ].filter((campo) => primeiroServico && campo in primeiroServico)

    console.log(
      `Catalogo publico sanitizado: ${camposSensveis.length === 0 ? 'OK' : `falhou (${camposSensveis.join(', ')})`}`
    )
    if (catalogoRes.statusCode !== 200) {
      falhas.push(`Catalogo autenticado esperava 200 e recebeu ${catalogoRes.statusCode}`)
    }
    if (camposSensveis.length > 0) {
      falhas.push(`Catalogo expôs campos sensiveis: ${camposSensveis.join(', ')}`)
    }

    const diagRes = await app.inject({
      method: 'POST',
      url: '/api/v1/comercial/diagnostico/cnae',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload,
    })

    const diagData = diagRes.json()

    console.log(`Diagnostico HTTP: ${diagRes.statusCode}`)
    if (diagRes.statusCode !== 200) {
      falhas.push(`Diagnostico esperava 200 e recebeu ${diagRes.statusCode}`)
    }
    if (!Array.isArray(diagData.data?.recomendacoes) || diagData.data.recomendacoes.length === 0) {
      falhas.push('Diagnostico nao retornou recomendacoes')
    }
    console.log(
      JSON.stringify(
        {
          cnae: diagData.data?.cnaePrincipal?.codigo,
          risco: diagData.data?.riscoGeral,
          servicos: diagData.data?.recomendacoes?.map((item: { codigo: string; nome: string; decisao: string }) => ({
            codigo: item.codigo,
            nome: item.nome,
            decisao: item.decisao,
          })),
          orcamento: diagData.data?.estimativaOrcamento,
          alertas: diagData.data?.alertas,
        },
        null,
        2
      )
    )

    if (falhas.length > 0) {
      console.error('Falhas encontradas na validacao:')
      for (const falha of falhas) {
        console.error(`- ${falha}`)
      }
      process.exitCode = 1
      return
    }

    console.log('Validacao OK.')
  } finally {
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
  }
}

main().catch((error) => {
  console.error('Falha ao executar validacao do diagnostico:', error)
  process.exitCode = 1
})
