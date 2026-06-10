import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'
import { prisma } from '../infra/prisma.js'
import { enviarTexto } from './zapi.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// AGENTE WHATSAPP — dois modos: compliance (clientes) e comercial (prospects)
// ─────────────────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

// ─── MODO COMPLIANCE — clientes cadastrados ───────────────────────────────────

async function buscarContextoCliente(numero: string) {
  const contato = await prisma.contatoWhatsApp.findFirst({
    where: { numero, ativo: true },
    include: {
      empreendimento: {
        select: { id: true, nome: true, cidade: true, estado: true },
      },
      tenant: { select: { id: true, nome: true } },
    },
  })
  if (!contato) return null

  const empId = contato.empreendimentoId
  const tenantId = contato.tenantId
  const hoje = new Date()
  const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30)

  const [licencasVencendo, autosAtivos, alertasRecentes, scoresRisco] = await Promise.all([
    empId ? prisma.licencaAmbiental.findMany({
      where: { empreendimentoId: empId, dataVencimento: { lte: em30 } },
      select: { tipo: true, dataVencimento: true, status: true },
      take: 5,
    }) : [],

    empId ? prisma.autoInfracao.findMany({
      where: { empreendimentoId: empId, status: { notIn: ['ENCERRADO', 'PAGO'] } },
      select: { orgao: true, numeroAuto: true, prazoDefesa: true, status: true },
      take: 5,
    }) : [],

    prisma.alerta.findMany({
      where: { tenantId, empreendimentoId: empId ?? undefined, criadoEm: { gte: new Date(Date.now() - 7 * 86400000) } },
      select: { titulo: true, nivel: true, criadoEm: true },
      orderBy: { criadoEm: 'desc' },
      take: 5,
    }),

    empId ? prisma.scoreRisco.findMany({
      where: { empreendimentoId: empId },
      select: { orgao: true, score: true, nivel: true },
    }) : [],
  ])

  return { contato, licencasVencendo, autosAtivos, alertasRecentes, scoresRisco }
}

function formatarContextoCliente(ctx: NonNullable<Awaited<ReturnType<typeof buscarContextoCliente>>>): string {
  const emp = ctx.contato.empreendimento
  const lines: string[] = []

  if (emp) lines.push(`Posto: ${emp.nome} — ${emp.cidade}/${emp.estado}`)

  if (ctx.licencasVencendo.length > 0) {
    lines.push('\nLicenças vencendo em 30 dias:')
    for (const l of ctx.licencasVencendo) {
      const d = new Date(l.dataVencimento).toLocaleDateString('pt-BR')
      lines.push(`  • ${l.tipo}: vence ${d} [${l.status}]`)
    }
  }

  if (ctx.autosAtivos.length > 0) {
    lines.push('\nAutos de infração em aberto:')
    for (const a of ctx.autosAtivos) {
      const d = new Date(a.prazoDefesa).toLocaleDateString('pt-BR')
      lines.push(`  • ${a.orgao} — Auto ${a.numeroAuto} — prazo ${d} [${a.status}]`)
    }
  }

  if (ctx.scoresRisco.length > 0) {
    lines.push('\nScore de risco por órgão:')
    for (const s of ctx.scoresRisco) {
      lines.push(`  • ${s.orgao}: ${s.score}/100 [${s.nivel}]`)
    }
  }

  if (ctx.alertasRecentes.length > 0) {
    lines.push('\nAlertas recentes (7 dias):')
    for (const a of ctx.alertasRecentes) {
      lines.push(`  • [${a.nivel}] ${a.titulo}`)
    }
  }

  return lines.join('\n') || 'Nenhum dado disponível.'
}

async function gerarRespostaCompliance(mensagemUsuario: string, contexto: string): Promise<string> {
  const system = `Você é o assistente de conformidade regulatória do sistema Hábilis Posto.
Você recebe mensagens de representantes de postos de combustíveis pelo WhatsApp.
Responda de forma clara, objetiva e amigável. Use linguagem simples.
Máximo de 3 parágrafos curtos. Não use markdown.

Contexto atual do posto:
${contexto}

Capacidades:
- Informar status de licenças ambientais, alvarás, documentos SST
- Informar sobre autos de infração e prazos de defesa
- Informar scores de risco de fiscalização por órgão
- Alertar sobre vencimentos próximos
- Responder dúvidas gerais sobre conformidade de postos

Se não souber algo ou não tiver dados, diga honestamente.`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system,
    messages: [{ role: 'user', content: mensagemUsuario }],
  })

  const block = msg.content.find((b) => b.type === 'text')
  return block && block.type === 'text' ? block.text : 'Desculpe, não consegui processar sua mensagem. Tente novamente.'
}

// ─── MODO COMERCIAL — prospects sem cadastro ──────────────────────────────────

type LeadInfo = {
  id: string
  nome: string | null
  empresa: string | null
  quantidadePostos: number | null
  desafios: string | null
  status: string
}

function montarPromptComercial(lead: LeadInfo, historico: Array<{ direcao: string; conteudo: string }>): string {
  // Monta histórico de conversa formatado
  const histStr = historico.map(m =>
    `${m.direcao === 'RECEBIDA' ? 'Prospect' : 'Assistente'}: ${m.conteudo}`
  ).join('\n')

  // Determina o que ainda falta coletar
  const falta: string[] = []
  if (!lead.nome) falta.push('nome completo do responsável')
  if (!lead.empresa) falta.push('nome da empresa/rede de postos')
  if (lead.quantidadePostos === null) falta.push('quantidade de postos na rede')
  if (!lead.desafios) falta.push('principais desafios de conformidade regulatória que enfrentam hoje')

  const infoColetada = [
    lead.nome ? `Nome: ${lead.nome}` : null,
    lead.empresa ? `Empresa: ${lead.empresa}` : null,
    lead.quantidadePostos !== null ? `Postos: ${lead.quantidadePostos}` : null,
    lead.desafios ? `Desafios: ${lead.desafios}` : null,
  ].filter(Boolean).join('\n')

  return `Você é um consultor comercial da Hábilis Posto, plataforma de gestão de conformidade regulatória para redes de postos de combustíveis.

Sua missão é qualificar este prospect de forma natural e consultiva, sem ser insistente. Colete as informações necessárias ao longo da conversa.

Informações já coletadas:
${infoColetada || '(nenhuma ainda)'}

Informações que ainda precisam ser coletadas (colete uma por vez, naturalmente):
${falta.length > 0 ? falta.map(f => `- ${f}`).join('\n') : '(todas coletadas — conclua apresentando os próximos passos)'}

Histórico da conversa:
${histStr || '(início da conversa)'}

Regras:
- Apresente-se brevemente na primeira mensagem
- Faça perguntas de forma consultiva, mostrando interesse genuíno no problema do cliente
- Nunca faça mais de uma pergunta por mensagem
- Quando todas as informações estiverem coletadas, agradeça, resuma o que entendeu e informe que um consultor entrará em contato em breve
- Não use markdown. Máximo de 3 parágrafos curtos por resposta
- Seja caloroso, profissional e direto ao ponto`
}

async function gerarRespostaComercial(
  lead: LeadInfo,
  historico: Array<{ direcao: string; conteudo: string }>,
  mensagemUsuario: string,
): Promise<string> {
  const system = montarPromptComercial(lead, historico)

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system,
    messages: [{ role: 'user', content: mensagemUsuario }],
  })

  const block = msg.content.find((b) => b.type === 'text')
  return block && block.type === 'text' ? block.text : 'Olá! Sou consultor da Hábilis Posto. Como posso ajudar?'
}

// Extrai informações da conversa e atualiza o lead no banco
async function atualizarInfoLead(
  lead: LeadInfo,
  historico: Array<{ direcao: string; conteudo: string }>,
  ultimaMensagem: string,
): Promise<void> {
  // Usa Claude para extrair dados estruturados da conversa completa
  const todasMensagens = [
    ...historico.map(m => `${m.direcao === 'RECEBIDA' ? 'Prospect' : 'Assistente'}: ${m.conteudo}`),
    `Prospect: ${ultimaMensagem}`,
  ].join('\n')

  const extractionMsg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `Analise a conversa e extraia as informações do prospect em JSON.
Retorne APENAS o JSON, sem markdown, sem texto adicional.
Formato: {"nome": string|null, "empresa": string|null, "quantidadePostos": number|null, "desafios": string|null, "qualificado": boolean}
- nome: nome completo do responsável, se mencionado
- empresa: nome da empresa ou rede de postos, se mencionado
- quantidadePostos: número de postos na rede, se mencionado
- desafios: resumo dos principais desafios de conformidade mencionados
- qualificado: true se todas as informações foram coletadas e o prospect demonstrou interesse`,
    messages: [{ role: 'user', content: todasMensagens }],
  })

  const block = extractionMsg.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') return

  try {
    const dados = JSON.parse(block.text) as {
      nome?: string | null
      empresa?: string | null
      quantidadePostos?: number | null
      desafios?: string | null
      qualificado?: boolean
    }

    const update: Record<string, unknown> = {}
    if (dados.nome && !lead.nome) update.nome = dados.nome
    if (dados.empresa && !lead.empresa) update.empresa = dados.empresa
    if (dados.quantidadePostos !== null && dados.quantidadePostos !== undefined && lead.quantidadePostos === null) {
      update.quantidadePostos = dados.quantidadePostos
    }
    if (dados.desafios && !lead.desafios) update.desafios = dados.desafios
    if (dados.qualificado && lead.status !== 'QUALIFICADO') update.status = 'QUALIFICADO'
    else if (lead.status === 'NOVO') update.status = 'EM_CONVERSA'

    if (Object.keys(update).length > 0) {
      await prisma.leadWhatsApp.update({ where: { id: lead.id }, data: update })
    }
  } catch {
    // JSON inválido — ignora, não bloqueia o fluxo
  }
}

async function processarLead(tenantId: string, numero: string, texto: string): Promise<void> {
  // Busca ou cria o lead
  let lead = await prisma.leadWhatsApp.findFirst({ where: { tenantId, numero } })
  if (!lead) {
    lead = await prisma.leadWhatsApp.create({ data: { tenantId, numero, status: 'NOVO' } })
  }

  // Descartado — não responde mais
  if (lead.status === 'DESCARTADO') return

  // Busca histórico da conversa
  const historico = await prisma.mensagemLead.findMany({
    where: { leadId: lead.id },
    orderBy: { criadoEm: 'asc' },
    take: 20,
    select: { direcao: true, conteudo: true },
  })

  // Registra mensagem recebida
  await prisma.mensagemLead.create({
    data: { leadId: lead.id, direcao: 'RECEBIDA', conteudo: texto },
  })

  // Gera resposta comercial
  const leadInfo: LeadInfo = {
    id: lead.id,
    nome: lead.nome,
    empresa: lead.empresa,
    quantidadePostos: lead.quantidadePostos,
    desafios: lead.desafios,
    status: lead.status,
  }

  const resposta = await gerarRespostaComercial(leadInfo, historico, texto)
  await enviarTexto(numero, resposta)

  // Registra resposta enviada
  await prisma.mensagemLead.create({
    data: { leadId: lead.id, direcao: 'ENVIADA', conteudo: resposta },
  })

  // Extrai e atualiza informações do lead em background (não bloqueia resposta)
  atualizarInfoLead(leadInfo, historico, texto).catch((err) =>
    console.error('[wpp] Erro ao atualizar info do lead:', err instanceof Error ? err.message : err)
  )
}

// ─── ENTRADA PRINCIPAL ────────────────────────────────────────────────────────

export interface MensagemRecebida {
  numero: string
  texto: string
  tipo?: string // TEXTO | IMAGEM | DOCUMENTO
  tenantId?: string // necessário para criar leads comerciais; ausente = apenas compliance
}

export async function processarMensagemRecebida(msg: MensagemRecebida): Promise<void> {
  const { numero, texto, tenantId } = msg

  // Verifica se é cliente cadastrado
  const ctx = await buscarContextoCliente(numero)

  if (!ctx) {
    // Número não cadastrado → fluxo comercial (lead)
    if (!tenantId) {
      console.warn(`[wpp] Mensagem de número desconhecido ${numero} sem tenantId — lead não criado.`)
      return
    }
    await processarLead(tenantId, numero, texto)
    return
  }

  // Cliente cadastrado → fluxo de compliance
  await prisma.mensagemWhatsApp.create({
    data: {
      tenantId: ctx.contato.tenantId,
      numero,
      direcao: 'RECEBIDA',
      tipo: 'TEXTO',
      conteudo: texto,
    },
  })

  const contexto = formatarContextoCliente(ctx)
  const resposta = await gerarRespostaCompliance(texto, contexto)
  await enviarTexto(numero, resposta)

  await prisma.mensagemWhatsApp.create({
    data: {
      tenantId: ctx.contato.tenantId,
      numero,
      direcao: 'ENVIADA',
      tipo: 'TEXTO',
      conteudo: resposta,
    },
  })
}

// ─── ENVIO DE ALERTA PROATIVO ─────────────────────────────────────────────────

export async function enviarAlertaWhatsApp(
  tenantId: string,
  empreendimentoId: string | null,
  mensagem: string,
): Promise<void> {
  const contatos = await prisma.contatoWhatsApp.findMany({
    where: {
      tenantId,
      ...(empreendimentoId ? { empreendimentoId } : {}),
      ativo: true,
    },
    select: { numero: true },
  })

  for (const c of contatos) {
    try {
      await enviarTexto(c.numero, mensagem)
      await prisma.mensagemWhatsApp.create({
        data: { tenantId, numero: c.numero, direcao: 'ENVIADA', tipo: 'TEXTO', conteudo: mensagem },
      })
    } catch (err) {
      console.error(`[wpp] Falha ao enviar para ${c.numero}:`, err instanceof Error ? err.message : err)
    }
  }
}
