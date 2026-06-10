import Anthropic from '@anthropic-ai/sdk'
import { Queue } from 'bullmq'
import { prisma } from '../infra/prisma.js'
import { redis } from '../infra/redis.js'
import { env } from '../config/env.js'

// ─────────────────────────────────────────────────────────────────────────────
// DIGEST SEMANAL — resumo executivo por tenant, gerado com Claude
// Executado toda segunda-feira às 08:00 via scheduler
// ─────────────────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
const emailQueue = new Queue('email', { connection: redis })

interface TenantDigest {
  tenantNome: string
  totalPostos: number
  scoreGeral: number | null
  postosCriticos: { nome: string; score: number }[]
  vencimentos30d: { descricao: string; tipo: string; dias: number }[]
  alertasCriticos: number
  autosAbertos: number
  anomaliasVMP: number
}

async function coletarDadosTenant(tenantId: string): Promise<TenantDigest> {
  const hoje = new Date()
  const em30 = new Date(hoje); em30.setDate(hoje.getDate() + 30)
  const ha7d = new Date(hoje); ha7d.setDate(hoje.getDate() - 7)

  const [tenant, empreendimentos, alertasCriticos, autosAbertos, anomaliasVMP] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { nome: true } }),
    prisma.empreendimento.findMany({
      where: { tenantId, ativo: true },
      select: {
        id: true,
        nome: true,
        snapshotsCompliance: {
          orderBy: { calculadoEm: 'desc' },
          take: 1,
          select: { indiceConformidade: true },
        },
      },
    }),
    prisma.alerta.count({
      where: {
        tenantId,
        nivel: { in: ['CRITICO', 'ALTO'] as never[] },
        criadoEm: { gte: ha7d },
      },
    }),
    prisma.autoInfracao.count({
      where: {
        tenantId,
        status: { notIn: ['ENCERRADO', 'PAGO'] as never[] },
      },
    }),
    prisma.campanhaMonitoramento.count({
      where: {
        tenantId,
        resultado: 'NAO_CONFORME',
        dataColeta: { gte: new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1) },
      },
    }),
  ])

  // Calcula scores por empreendimento
  const postosCriticos = empreendimentos
    .map((e) => ({
      nome: e.nome,
      score: e.snapshotsCompliance[0]?.indiceConformidade
        ? Number(e.snapshotsCompliance[0].indiceConformidade)
        : null,
    }))
    .filter((e): e is { nome: string; score: number } => e.score !== null && e.score < 50)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)

  // Média só sobre empreendimentos que já têm snapshot de compliance —
  // antes os sem snapshot somavam 0 e puxavam a média artificialmente para baixo.
  const comSnapshot = empreendimentos.filter(
    (e) => e.snapshotsCompliance[0]?.indiceConformidade != null,
  )
  const scoreGeral =
    comSnapshot.length > 0
      ? Math.round(
          comSnapshot.reduce(
            (acc, e) => acc + Number(e.snapshotsCompliance[0]!.indiceConformidade),
            0,
          ) / comSnapshot.length,
        )
      : null

  // Vencimentos próximos (30 dias)
  const [processos, documentos, condicionantes] = await Promise.all([
    prisma.processo.findMany({
      where: { tenantId, dataVencimento: { lte: em30, gte: hoje }, status: { notIn: ['CANCELADO', 'ARQUIVADO'] as never[] } },
      select: { dataVencimento: true, numeroProtocolo: true, empreendimento: { select: { nome: true } } },
      orderBy: { dataVencimento: 'asc' },
      take: 5,
    }),
    prisma.documento.findMany({
      where: { tenantId, dataValidade: { lte: em30, gte: hoje }, status: { notIn: ['SUBSTITUIDO', 'DISPENSADO'] as never[] } },
      select: { dataValidade: true, nome: true, empreendimento: { select: { nome: true } } },
      orderBy: { dataValidade: 'asc' },
      take: 5,
    }),
    prisma.condicionante.findMany({
      where: { tenantId, proximoVencimento: { lte: em30, gte: hoje }, status: { notIn: ['CUMPRIDA', 'DISPENSADA'] as never[] } },
      select: { proximoVencimento: true, descricao: true, empreendimento: { select: { nome: true } } },
      orderBy: { proximoVencimento: 'asc' },
      take: 5,
    }),
  ])

  const vencimentos30d = [
    ...processos.map((p) => ({
      descricao: `Processo ${p.numeroProtocolo ?? '—'} (${p.empreendimento.nome})`,
      tipo: 'Processo',
      dias: Math.ceil(((p.dataVencimento?.getTime() ?? 0) - hoje.getTime()) / 86_400_000),
    })),
    ...documentos.map((d) => ({
      descricao: `${d.nome} (${d.empreendimento.nome})`,
      tipo: 'Documento',
      dias: Math.ceil(((d.dataValidade?.getTime() ?? 0) - hoje.getTime()) / 86_400_000),
    })),
    ...condicionantes.map((c) => ({
      descricao: `${c.descricao.slice(0, 60)}... (${c.empreendimento.nome})`,
      tipo: 'Condicionante',
      dias: Math.ceil(((c.proximoVencimento?.getTime() ?? 0) - hoje.getTime()) / 86_400_000),
    })),
  ].sort((a, b) => a.dias - b.dias).slice(0, 8)

  return {
    tenantNome: tenant?.nome ?? tenantId,
    totalPostos: empreendimentos.length,
    scoreGeral,
    postosCriticos,
    vencimentos30d,
    alertasCriticos,
    autosAbertos,
    anomaliasVMP,
  }
}

async function gerarNarrativaIA(digest: TenantDigest): Promise<string> {
  const prompt = `Você é um consultor de compliance ambiental e regulatório para postos de combustível.
Gere um resumo executivo CONCISO (3-4 parágrafos, tom profissional e direto) com base nos dados abaixo.
Destaque as prioridades da semana e as ações críticas necessárias.

DADOS DA SEMANA:
- Empresa: ${digest.tenantNome}
- Total de postos ativos: ${digest.totalPostos}
- Score geral de compliance: ${digest.scoreGeral !== null ? `${digest.scoreGeral}%` : 'não disponível'}
- Alertas críticos/altos (últimos 7 dias): ${digest.alertasCriticos}
- Autos de infração em aberto: ${digest.autosAbertos}
- Campanhas não conformes (últimos 3 meses): ${digest.anomaliasVMP}

${digest.postosCriticos.length > 0 ? `POSTOS CRÍTICOS (score < 50%):
${digest.postosCriticos.map((p) => `- ${p.nome}: ${p.score.toFixed(1)}%`).join('\n')}
` : ''}
${digest.vencimentos30d.length > 0 ? `VENCIMENTOS PRÓXIMOS (30 dias):
${digest.vencimentos30d.map((v) => `- [${v.tipo}] ${v.descricao} — em ${v.dias} dias`).join('\n')}
` : 'Nenhum vencimento crítico nos próximos 30 dias.'}

Responda em português, sem formatação markdown, apenas parágrafos.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  return content?.type === 'text' ? content.text : 'Resumo não disponível.'
}

function gerarHTMLDigest(digest: TenantDigest, narrativa: string): string {
  const scoreColor = digest.scoreGeral !== null
    ? digest.scoreGeral >= 70 ? '#16a34a' : digest.scoreGeral >= 40 ? '#d97706' : '#dc2626'
    : '#6b7280'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; }
  .header { background: #1e40af; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 20px; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
  .body { background: #f9fafb; padding: 24px; }
  .kpi-row { display: flex; gap: 12px; margin-bottom: 20px; }
  .kpi { flex: 1; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
  .kpi .val { font-size: 28px; font-weight: bold; }
  .kpi .lbl { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .section { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .section h3 { margin: 0 0 12px; font-size: 13px; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
  .narrativa { line-height: 1.6; font-size: 14px; white-space: pre-line; }
  .item { padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  .item:last-child { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: bold; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-yellow { background: #fef3c7; color: #d97706; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .footer { padding: 16px 24px; font-size: 11px; color: #9ca3af; text-align: center; }
  a { color: #1e40af; }
</style></head>
<body>
<div class="header">
  <h1>📊 Digest Semanal — ${digest.tenantNome}</h1>
  <p>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
</div>
<div class="body">
  <div class="kpi-row">
    <div class="kpi">
      <div class="val" style="color:${scoreColor}">${digest.scoreGeral !== null ? `${digest.scoreGeral}%` : '—'}</div>
      <div class="lbl">Score Geral</div>
    </div>
    <div class="kpi">
      <div class="val" style="color:${digest.alertasCriticos > 0 ? '#dc2626' : '#16a34a'}">${digest.alertasCriticos}</div>
      <div class="lbl">Alertas Críticos</div>
    </div>
    <div class="kpi">
      <div class="val" style="color:${digest.autosAbertos > 0 ? '#d97706' : '#16a34a'}">${digest.autosAbertos}</div>
      <div class="lbl">Autos em Aberto</div>
    </div>
    <div class="kpi">
      <div class="val">${digest.totalPostos}</div>
      <div class="lbl">Postos Ativos</div>
    </div>
  </div>

  <div class="section">
    <h3>Análise executiva</h3>
    <div class="narrativa">${narrativa}</div>
  </div>

  ${digest.vencimentos30d.length > 0 ? `
  <div class="section">
    <h3>⚠️ Vencimentos nos próximos 30 dias</h3>
    ${digest.vencimentos30d.map((v) => `
      <div class="item">
        <span class="badge ${v.dias <= 7 ? 'badge-red' : v.dias <= 15 ? 'badge-yellow' : 'badge-blue'}">${v.dias}d</span>
        &nbsp;${v.descricao}
      </div>
    `).join('')}
  </div>` : ''}

  ${digest.postosCriticos.length > 0 ? `
  <div class="section">
    <h3>🚨 Postos com score crítico (&lt;50%)</h3>
    ${digest.postosCriticos.map((p) => `
      <div class="item">${p.nome} — <strong style="color:#dc2626">${p.score.toFixed(1)}%</strong></div>
    `).join('')}
  </div>` : ''}
</div>
<div class="footer">
  <p><a href="${env.WEB_URL}">Acessar o sistema</a> · Hábilis RegPosto · Digest automático gerado por IA</p>
</div>
</body>
</html>`
}

export async function gerarDigestSemanal(): Promise<void> {
  console.log('[digest] Iniciando geração de digests semanais...')

  const tenants = await prisma.tenant.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
  })

  for (const tenant of tenants) {
    try {
      // Coleta dados
      const digest = await coletarDadosTenant(tenant.id)

      // Gera narrativa com IA
      const narrativa = await gerarNarrativaIA(digest)

      // HTML do email
      const html = gerarHTMLDigest(digest, narrativa)

      // Busca destinatários (EXECUTIVO + ADMIN_TENANT)
      const destinatarios = await prisma.usuario.findMany({
        where: {
          tenantId: tenant.id,
          ativo: true,
          perfil: { in: ['EXECUTIVO', 'ADMIN_TENANT', 'COORDENADOR'] as never[] },
        },
        select: { email: true, nome: true },
      })

      for (const dest of destinatarios) {
        await emailQueue.add('digest-semanal', {
          tipo: 'digest_semanal',
          email: dest.email,
          nome: dest.nome,
          html,
          tenantNome: tenant.nome,
        })
      }

      console.log(`[digest] Tenant ${tenant.nome}: ${destinatarios.length} email(s) enfileirado(s)`)
    } catch (err) {
      console.error(`[digest] Erro no tenant ${tenant.id}:`, (err as Error).message)
    }
  }

  console.log(`[digest] Digest semanal concluído para ${tenants.length} tenant(s)`)
}
