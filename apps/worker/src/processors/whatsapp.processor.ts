import { Worker } from 'bullmq'
import { redis } from '../infra/redis.js'
import { processarMensagemRecebida, enviarAlertaWhatsApp } from '../services/agente-whatsapp.service.js'
import { enviarTexto } from '../services/zapi.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP PROCESSOR
// ─────────────────────────────────────────────────────────────────────────────

export function criarWhatsAppWorker(concurrency = 3) {
  return new Worker(
    'whatsapp',
    async (job) => {
      switch (job.name) {
        // Mensagem recebida do webhook — processa com Claude e responde
        case 'mensagem-recebida': {
          const { numero, texto, tipo } = job.data as { numero: string; texto: string; tipo?: string }
          await processarMensagemRecebida({ numero, texto, tipo })
          break
        }

        // Alerta proativo — envia para contatos do empreendimento
        case 'enviar-alerta': {
          const { tenantId, empreendimentoId, mensagem } = job.data as {
            tenantId: string
            empreendimentoId: string | null
            mensagem: string
          }
          await enviarAlertaWhatsApp(tenantId, empreendimentoId, mensagem)
          break
        }

        // Envio simples de texto (para notificações diretas)
        case 'enviar-texto': {
          const { numero, mensagem } = job.data as { numero: string; mensagem: string }
          await enviarTexto(numero, mensagem)
          break
        }

        default:
          console.warn(`[whatsapp] Job desconhecido: ${job.name}`)
      }
    },
    { connection: redis, concurrency },
  )
}
