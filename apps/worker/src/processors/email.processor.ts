import { Worker } from 'bullmq'
import { Resend } from 'resend'
import { redis } from '../infra/redis.js'
import { env } from '../config/env.js'

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL PROCESSOR
// ─────────────────────────────────────────────────────────────────────────────

const resend = new Resend(env.RESEND_API_KEY)

type EmailJobData =
  | { tipo: 'boas_vindas'; nome: string; email: string; senhaTemporaria: string }
  | { tipo: 'alerta_vencimento'; email: string; nome: string; itens: Array<{ descricao: string; vencimento: string }> }
  | { tipo: 'documento_rejeitado'; email: string; nome: string; documento: string; motivo: string }
  | { tipo: 'tarefa_atribuida'; email: string; nome: string; titulo: string; dataLimite?: string; empreendimento: string }
  | { tipo: 'magic_link'; email: string; link: string; empreendimento: string; expiresIn: string }
  | { tipo: 'recuperar_senha'; email: string; nome: string; link: string }
  | { tipo: 'relatorio_pronto'; email: string; nome: string; tipoRelatorio: string }
  | { tipo: 'digest_semanal'; email: string; nome: string; html: string; tenantNome: string }

async function enviarEmail(data: EmailJobData): Promise<void> {
  switch (data.tipo) {
    case 'boas_vindas':
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: 'Bem-vindo ao Posto Compliance',
        html: `<p>Olá, ${data.nome}!</p><p>Sua conta foi criada. Sua senha temporária é: <strong>${data.senhaTemporaria}</strong></p><p>Altere-a no primeiro acesso.</p>`,
      })
      break

    case 'alerta_vencimento':
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: '⚠️ Itens próximos do vencimento',
        html: `
          <p>Olá, ${data.nome}!</p>
          <p>Os seguintes itens estão próximos do vencimento:</p>
          <ul>${data.itens.map((i) => `<li>${i.descricao} — vence em ${i.vencimento}</li>`).join('')}</ul>
          <p><a href="${env.WEB_URL}">Acesse o sistema</a></p>
        `,
      })
      break

    case 'documento_rejeitado':
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `❌ Documento reprovado: ${data.documento}`,
        html: `<p>Olá, ${data.nome}!</p><p>O documento <strong>${data.documento}</strong> foi reprovado.</p><p>Motivo: ${data.motivo}</p>`,
      })
      break

    case 'tarefa_atribuida':
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `📋 Nova tarefa atribuída: ${data.titulo}`,
        html: `<p>Olá, ${data.nome}!</p><p>Você recebeu uma nova tarefa em <strong>${data.empreendimento}</strong>:</p><p><strong>${data.titulo}</strong>${data.dataLimite ? ` — prazo: ${data.dataLimite}` : ''}</p><p><a href="${env.WEB_URL}">Ver tarefa</a></p>`,
      })
      break

    case 'magic_link':
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `🔑 Seu link de acesso ao portal — ${data.empreendimento}`,
        html: `<p>Acesse o portal do ${data.empreendimento} clicando no link abaixo (válido por ${data.expiresIn}):</p><p><a href="${data.link}">Acessar portal</a></p>`,
      })
      break

    case 'recuperar_senha':
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: '🔒 Recuperação de senha',
        html: `<p>Olá, ${data.nome}!</p><p><a href="${data.link}">Clique aqui para redefinir sua senha</a> (válido por 1 hora).</p>`,
      })
      break

    case 'relatorio_pronto':
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: 'Seu relatório está pronto',
        html: `<p>Olá, ${data.nome}!</p><p>O relatório <strong>${data.tipoRelatorio}</strong> foi gerado com sucesso. Acesse o sistema para fazer o download.</p>`,
      })
      break

    case 'digest_semanal':
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: data.email,
        subject: `📊 Digest Semanal — ${data.tenantNome} — ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
        html: data.html,
      })
      break
  }
}

export function criarEmailWorker(concurrency = 5) {
  return new Worker<EmailJobData>(
    'email',
    async (job) => {
      console.log(`[email] Processando job ${job.id} — tipo: ${job.data.tipo}`)
      await enviarEmail(job.data)
      console.log(`[email] Job ${job.id} concluído`)
    },
    { connection: redis, concurrency },
  )
}
