import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../../shared/middleware/authenticate.js'

// ─────────────────────────────────────────────────────────────────────────────
// CONHECIMENTO — Assistente Técnico Hábilis (busca em base estática)
// Nesta fase: KB local em JSON, busca por palavras-chave (sem IA externa).
// Aberto a qualquer perfil interno autenticado.
// ─────────────────────────────────────────────────────────────────────────────

type Responsabilidades = {
  habilis_assume: string
  habilis_executa: string
  habilis_gere: string
  cliente: string
  terceiros: string
  orgao: string
}

type KBItem = {
  id: string
  modulo: string
  categoria: string
  perguntas_chave: string[]
  resposta_objetiva: string
  checklist: string[]
  estudos_documentos: string[]
  responsabilidades: Responsabilidades
  terceiros_relacionados: string[]
  riscos: string[]
  fontes_internas: string[]
}

type PlaybookItem = {
  slug: string
  title: string
  short: string
  category: string
  summary: string
  page_count: number
  char_count: number
  archived: boolean
  checklist: string[]
  entregaveis: string[]
  terceiros: string[]
  riscos: string[]
  responsabilidades: string[]
  preview: string
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const KB: KBItem[] = JSON.parse(
  readFileSync(join(__dirname, 'habilis-postos-kb.json'), 'utf-8'),
)
const PLAYBOOKS: PlaybookItem[] = JSON.parse(
  readFileSync(join(__dirname, 'habilis-playbooks-auditados.json'), 'utf-8'),
)

const STOPWORDS = new Set([
  'para', 'com', 'uma', 'que', 'dos', 'das', 'por', 'qual', 'quais',
  'como', 'onde', 'quando', 'sobre', 'pelo', 'pela', 'ele', 'ela',
  'isso', 'esse', 'essa', 'tem', 'tem', 'são', 'sao', 'foi', 'pra',
])

function normalize(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function scoreItem(pergunta: string, item: KBItem): number {
  const qTokens = tokenize(pergunta)
  const haystack = normalize(
    [
      item.modulo,
      item.categoria,
      item.resposta_objetiva,
      ...(item.perguntas_chave ?? []),
      ...(item.checklist ?? []),
      ...(item.estudos_documentos ?? []),
      ...(item.terceiros_relacionados ?? []),
      ...(item.riscos ?? []),
      ...(item.fontes_internas ?? []),
    ].join(' '),
  )
  let score = 0
  for (const t of qTokens) {
    if (haystack.includes(t)) score += 2
    if (normalize(item.modulo).includes(t)) score += 3
    if (item.perguntas_chave.some((k) => normalize(k).includes(t))) score += 5
  }
  const phrase = normalize(pergunta)
  if (
    item.perguntas_chave.some((k) => phrase.includes(normalize(k)) || normalize(k).includes(phrase))
  ) {
    score += 18
  }
  return score
}

export const conhecimentoRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', authenticate)

  /**
   * GET /api/v1/conhecimento/modulos
   * Lista todos os módulos disponíveis na base (índice).
   */
  app.get(
    '/modulos',
    {
      schema: {
        tags: ['conhecimento'],
        summary: 'Lista os módulos da base Hábilis Postos',
      },
    },
    async (_request, reply) => {
      const modulos = KB.map((m) => ({
        id: m.id,
        modulo: m.modulo,
        categoria: m.categoria,
      }))
      return reply.status(200).send({ data: modulos, total: modulos.length })
    },
  )

  /**
   * GET /api/v1/conhecimento/modulos/:id
   * Retorna o conteúdo completo de um módulo.
   */
  app.get(
    '/modulos/:id',
    {
      schema: {
        params: z.object({ id: z.string().min(1) }),
        tags: ['conhecimento'],
        summary: 'Conteúdo completo de um módulo da base',
      },
    },
    async (request, reply) => {
      const item = KB.find((m) => m.id === request.params.id)
      if (!item) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Módulo não encontrado' } })
      return reply.status(200).send({ data: item })
    },
  )

  /**
   * GET /api/v1/conhecimento/playbooks
   * Lista resumida dos playbooks auditados incorporados ao sistema.
   */
  app.get(
    '/playbooks',
    {
      schema: {
        tags: ['conhecimento'],
        summary: 'Lista os playbooks auditados do Assistente Hábilis',
      },
    },
    async (_request, reply) => {
      const data = PLAYBOOKS.map((item) => ({
        slug: item.slug,
        title: item.title,
        short: item.short,
        category: item.category,
        summary: item.summary,
        preview: item.preview,
        page_count: item.page_count,
        char_count: item.char_count,
        archived: item.archived,
        checklist_count: item.checklist.length,
        checklist_preview: item.checklist.slice(0, 4),
        entregaveis_preview: item.entregaveis.slice(0, 4),
        terceiros_preview: item.terceiros.slice(0, 4),
        riscos_preview: item.riscos.slice(0, 4),
        terceiros_count: item.terceiros.length,
        riscos_count: item.riscos.length,
      }))

      return reply.status(200).send({ data, total: data.length })
    },
  )

  /**
   * GET /api/v1/conhecimento/playbooks/:slug
   * Retorna um playbook auditado completo.
   */
  app.get(
    '/playbooks/:slug',
    {
      schema: {
        params: z.object({ slug: z.string().min(1) }),
        tags: ['conhecimento'],
        summary: 'Conteúdo completo de um playbook auditado',
      },
    },
    async (request, reply) => {
      const item = PLAYBOOKS.find((m) => m.slug === request.params.slug)
      if (!item) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Playbook não encontrado' },
        })
      }
      return reply.status(200).send({ data: item })
    },
  )

  /**
   * POST /api/v1/conhecimento/perguntar
   * Recebe uma pergunta em texto livre e retorna até 3 módulos mais relevantes.
   * Busca por palavras-chave (sem IA externa).
   */
  app.post(
    '/perguntar',
    {
      schema: {
        body: z.object({
          pergunta: z.string().min(3).max(500),
          limite: z.number().int().min(1).max(5).optional(),
        }),
        tags: ['conhecimento'],
        summary: 'Consulta a base Hábilis Postos por palavras-chave',
      },
    },
    async (request, reply) => {
      const { pergunta, limite = 3 } = request.body

      const ranked = KB.map((item) => ({ item, score: scoreItem(pergunta, item) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limite)

      // Score normalizado para % (mesma fórmula do mockup HTML — proporcional ao melhor)
      const resultados = ranked.map(({ item, score }) => ({
        ...item,
        relevancia: Math.min(100, Math.round(score * 6)),
      }))

      return reply.status(200).send({
        data: resultados,
        meta: {
          pergunta,
          totalEncontrados: resultados.length,
          baseTamanho: KB.length,
          modo: 'keyword-search',
          ia_externa: false,
        },
      })
    },
  )
}
