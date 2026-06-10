import * as cheerio from 'cheerio'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'
import { prisma } from '../infra/prisma.js'

// ─────────────────────────────────────────────────────────────────────────────
// MONITOR DO DIÁRIO OFICIAL
// Busca publicações no DOU federal relevantes para postos de combustíveis,
// classifica com Claude e armazena as relevantes para notificação.
// ─────────────────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

// Keywords monitoradas
const KEYWORDS = [
  'posto de combustível',
  'postos de combustíveis',
  'CETESB',
  'estanqueidade',
  'tanque combustível',
  'tanque de armazenamento',
  'ANP',
  'revendedor varejista',
  'distribuidor de combustíveis',
  'CONAMA',
  'área contaminada',
  'passivo ambiental',
  'INMETRO combustível',
  'bomba abastecimento',
  'ABNT NBR 13783',
  'ABNT NBR 15078',
]

// ─── fetch + parse DOU federal ───────────────────────────────────────────────

interface RawPublicacao {
  titulo: string
  conteudo?: string
  url?: string
  secao?: string
  keywordsMatch: string[]
}

async function buscarPublicacoesDOU(data: Date): Promise<RawPublicacao[]> {
  const dateStr = data.toISOString().slice(0, 10).split('-').reverse().join('-') // DD-MM-YYYY
  const queryStr = 'posto+combustivel+CETESB+ANP+estanqueidade+CONAMA'
  const url = `https://www.in.gov.br/consulta/-/buscar/dou?q=${queryStr}&s=todos&exactDate=${dateStr}&_buscaDO_WAR_do2portlet_delta=30`

  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PostoComplianceMonitor/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) {
      console.warn(`[do] DOU retornou status ${res.status}`)
      return []
    }
    html = await res.text()
  } catch (err) {
    console.warn('[do] Falha ao acessar DOU federal:', err instanceof Error ? err.message : err)
    return []
  }

  const $ = cheerio.load(html)
  const publicacoes: RawPublicacao[] = []

  // Estrutura do DOU: resultados em .resultado-dou ou similar
  // Tentamos múltiplos seletores para resiliência a mudanças no layout
  const seletores = [
    '.resultado-dou',
    '.resultado',
    'article.resultado',
    '.resultados article',
    'li.resultado',
  ]

  let encontrou = false
  for (const sel of seletores) {
    const els = $(sel)
    if (els.length > 0) {
      encontrou = true
      els.each((_, el) => {
        const titulo = $(el).find('a, h3, h4, .title, .titulo').first().text().trim()
        const resumo = $(el).find('p, .resumo, .descricao').first().text().trim()
        const link = $(el).find('a').first().attr('href')
        const secao = $(el).find('.secao, .section').first().text().trim()

        if (!titulo) return

        const textoCompleto = `${titulo} ${resumo}`.toLowerCase()
        const matched = KEYWORDS.filter((kw) => textoCompleto.includes(kw.toLowerCase()))

        if (matched.length > 0) {
          publicacoes.push({
            titulo,
            conteudo: resumo || undefined,
            url: link ? (link.startsWith('http') ? link : `https://www.in.gov.br${link}`) : undefined,
            secao: secao || undefined,
            keywordsMatch: matched,
          })
        }
      })
      break
    }
  }

  if (!encontrou) {
    // Fallback: busca genérica em links com texto relevante
    $('a').each((_, el) => {
      const texto = $(el).text().trim()
      if (!texto || texto.length < 20) return
      const textoLower = texto.toLowerCase()
      const matched = KEYWORDS.filter((kw) => textoLower.includes(kw.toLowerCase()))
      if (matched.length > 0) {
        const href = $(el).attr('href')
        publicacoes.push({
          titulo: texto.slice(0, 500),
          url: href ? (href.startsWith('http') ? href : `https://www.in.gov.br${href}`) : undefined,
          keywordsMatch: matched,
        })
      }
    })
  }

  return publicacoes
}

// ─── classificação com Claude ─────────────────────────────────────────────────

interface Classificacao {
  relevante: boolean
  classificacao: string
  impacto: 'ALTO' | 'MEDIO' | 'BAIXO'
  resumo: string
}

async function classificarPublicacao(titulo: string, conteudo?: string): Promise<Classificacao> {
  const prompt = `Você é um especialista em regulação para postos de combustíveis no Brasil.
Analise a publicação do Diário Oficial abaixo e determine:
1. Se é relevante para operação de postos de combustíveis
2. O tipo de publicação
3. O nível de impacto para os postos
4. Um resumo executivo em até 3 frases

Retorne SOMENTE um JSON válido:
{
  "relevante": true/false,
  "classificacao": "LEGISLACAO | PORTARIA | RESOLUCAO | INSTRUCAO_NORMATIVA | DESPACHO | OUTROS",
  "impacto": "ALTO | MEDIO | BAIXO",
  "resumo": "resumo em até 3 frases explicando o impacto para postos de combustíveis"
}

Publicação:
TÍTULO: ${titulo}
${conteudo ? `CONTEÚDO: ${conteudo.slice(0, 1000)}` : ''}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content.find((b) => b.type === 'text')?.type === 'text'
      ? (msg.content.find((b) => b.type === 'text') as { type: 'text'; text: string }).text
      : '{}'
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { relevante: false, classificacao: 'OUTROS', impacto: 'BAIXO', resumo: '' }
  } catch {
    return { relevante: false, classificacao: 'OUTROS', impacto: 'BAIXO', resumo: '' }
  }
}

// ─── job principal ────────────────────────────────────────────────────────────

export async function monitorarDiarioOficial(): Promise<void> {
  const hoje = new Date()
  console.log(`[do] Iniciando monitoramento DOU — ${hoje.toISOString().slice(0, 10)}`)

  const publicacoes = await buscarPublicacoesDOU(hoje)
  console.log(`[do] ${publicacoes.length} publicação(ões) com keywords encontradas`)

  let novas = 0
  let relevantes = 0

  for (const pub of publicacoes) {
    // Evita duplicatas pelo URL
    const existe = pub.url
      ? await prisma.publicacaoDO.findFirst({ where: { fonte: 'DOU', dataPublicacao: hoje, url: pub.url } })
      : null

    if (existe) continue

    const classif = await classificarPublicacao(pub.titulo, pub.conteudo)

    await prisma.publicacaoDO.create({
      data: {
        fonte: 'DOU',
        dataPublicacao: hoje,
        secao: pub.secao,
        titulo: pub.titulo,
        conteudo: pub.conteudo,
        url: pub.url,
        keywordsMatch: pub.keywordsMatch,
        relevante: classif.relevante,
        classificacao: classif.classificacao,
        impacto: classif.impacto,
        resumoIA: classif.resumo,
      },
    })

    novas++
    if (classif.relevante) relevantes++
  }

  // Notifica tenants sobre publicações relevantes e de alto impacto
  const paraNotificar = await prisma.publicacaoDO.findMany({
    where: { relevante: true, impacto: 'ALTO', notificado: false },
  })

  if (paraNotificar.length > 0) {
    const tenants = await prisma.tenant.findMany({ select: { id: true } })

    for (const pub of paraNotificar) {
      for (const tenant of tenants) {
        await prisma.alerta.create({
          data: {
            tenantId: tenant.id,
            tipo: 'COMPLIANCE_CRITICO',
            nivel: 'ALTO',
            titulo: `Nova regulação: ${pub.classificacao ?? 'Publicação'} no DOU`,
            mensagem: pub.resumoIA ?? pub.titulo,
            entidadeTipo: 'PublicacaoDO',
            entidadeId: pub.id,
          },
        })
      }

      await prisma.publicacaoDO.update({ where: { id: pub.id }, data: { notificado: true } })
    }

    console.log(`[do] ${paraNotificar.length} alerta(s) criado(s) para ${tenants.length} tenant(s)`)
  }

  console.log(`[do] Concluído — ${novas} nova(s), ${relevantes} relevante(s)`)
}
