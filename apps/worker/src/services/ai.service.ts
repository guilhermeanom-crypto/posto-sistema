import Anthropic from '@anthropic-ai/sdk'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { env } from '../config/env.js'
import { s3 } from '../infra/s3.js'

// ─────────────────────────────────────────────────────────────────────────────
// AI SERVICE — Claude API + S3 PDF download
// ─────────────────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

// ─── download PDF from S3 as base64 ──────────────────────────────────────────

async function baixarPDFBase64(chaveS3: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: chaveS3 })
  const res = await s3.send(cmd)
  const chunks: Uint8Array[] = []
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)
  return buffer.toString('base64')
}

// ─── prompt builder + Claude call ────────────────────────────────────────────

async function chamarClaude(prompt: string, pdfBase64?: string): Promise<string> {
  const content: Anthropic.MessageParam['content'] = []

  if (pdfBase64) {
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
    } as Anthropic.DocumentBlockParam)
  }

  content.push({ type: 'text', text: prompt })

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content }],
  })

  const block = msg.content.find((b) => b.type === 'text')
  return block && block.type === 'text' ? block.text : ''
}

function extrairJSON<T>(texto: string): T {
  const match = texto.match(/```json\s*([\s\S]*?)```/) ?? texto.match(/(\{[\s\S]*\})/)
  const raw = match ? match[1] ?? match[0] : texto
  return JSON.parse(raw.trim()) as T
}

// ─── ANÁLISE: Licença Ambiental ───────────────────────────────────────────────

export interface AnaliseLicenca {
  numero?: string
  orgaoEmissor?: string
  dataEmissao?: string
  dataVencimento?: string
  condicionantes: { numero: string; descricao: string; prazo?: string; periodicidade?: string }[]
  resumo: string
}

export async function analisarLicencaAmbiental(chaveS3: string): Promise<AnaliseLicenca> {
  const pdfBase64 = await baixarPDFBase64(chaveS3)

  const prompt = `Você é um especialista em licenciamento ambiental brasileiro.
Analise o documento de licença ambiental e extraia as informações estruturadas.
Retorne SOMENTE um JSON válido (sem markdown) com este formato:
{
  "numero": "número da licença",
  "orgaoEmissor": "nome do órgão",
  "dataEmissao": "YYYY-MM-DD ou null",
  "dataVencimento": "YYYY-MM-DD ou null",
  "condicionantes": [
    { "numero": "1.1", "descricao": "descrição completa", "prazo": "YYYY-MM-DD ou null", "periodicidade": "mensal/anual/única/null" }
  ],
  "resumo": "resumo executivo em 2-3 frases"
}`

  const texto = await chamarClaude(prompt, pdfBase64)
  return extrairJSON<AnaliseLicenca>(texto)
}

// ─── ANÁLISE: Auto de Infração ─────────────────────────────────────────────────

export interface AnaliseAutoInfracao {
  orgao?: string
  numeroAuto?: string
  artigo?: string
  descricaoInfracao?: string
  valorMulta?: number
  prazoDefesa?: string
  fundamentosLegais: string[]
  resumo: string
}

export async function analisarAutoInfracao(chaveS3: string): Promise<AnaliseAutoInfracao> {
  const pdfBase64 = await baixarPDFBase64(chaveS3)

  const prompt = `Você é um especialista em direito administrativo e ambiental brasileiro.
Analise o auto de infração e extraia as informações estruturadas.
Retorne SOMENTE um JSON válido (sem markdown) com este formato:
{
  "orgao": "nome do órgão autuador",
  "numeroAuto": "número do auto",
  "artigo": "artigo infringido",
  "descricaoInfracao": "descrição completa da infração",
  "valorMulta": 0.00,
  "prazoDefesa": "YYYY-MM-DD ou null",
  "fundamentosLegais": ["lei/regulamento 1", "lei/regulamento 2"],
  "resumo": "resumo executivo em 2-3 frases"
}`

  const texto = await chamarClaude(prompt, pdfBase64)
  return extrairJSON<AnaliseAutoInfracao>(texto)
}

// ─── GERAÇÃO: Defesa Técnica ──────────────────────────────────────────────────

export interface DadosAutoDefesa {
  numeroAuto: string
  orgao: string
  artigo?: string | null
  descricao: string
  valorMulta?: number | null
  prazoDefesa: string
  dataLavratura: string
  empreendimento: string
}

export async function gerarDefesaTecnica(dados: DadosAutoDefesa): Promise<string> {
  const valorStr = dados.valorMulta
    ? `R$ ${dados.valorMulta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : 'não especificado'

  const prompt = `Você é um advogado especialista em direito ambiental e administrativo brasileiro com vasta experiência em defesas contra autos de infração de órgãos como CETESB, ANP, IBAMA e Corpo de Bombeiros.

Elabore uma defesa técnica administrativa completa contra o seguinte auto de infração:

AUTO DE INFRAÇÃO:
- Número: ${dados.numeroAuto}
- Órgão autuador: ${dados.orgao}
- Empreendimento: ${dados.empreendimento}
- Data de lavratura: ${dados.dataLavratura}
- Artigo infringido: ${dados.artigo ?? 'não especificado'}
- Descrição da infração: ${dados.descricao}
- Valor da multa: ${valorStr}
- Prazo de defesa: ${dados.prazoDefesa}

A defesa deve conter:
1. **QUALIFICAÇÃO DO AUTUADO** — dados do estabelecimento
2. **DOS FATOS** — narrativa objetiva dos fatos, questionando a materialidade da infração
3. **DO DIREITO** — fundamentos jurídicos (princípio da legalidade, proporcionalidade, contraditório e ampla defesa)
4. **DA NULIDADE DO AUTO** (se aplicável) — vícios formais ou materiais
5. **DA DESPROPORCIONALIDADE DA PENALIDADE** — aplicação do princípio da razoabilidade
6. **DO PEDIDO** — requerimento de arquivamento ou redução da penalidade

Formato: Markdown. Tom: jurídico-técnico, formal, argumentativo. Extensão: completa e robusta.`

  return chamarClaude(prompt)
}
