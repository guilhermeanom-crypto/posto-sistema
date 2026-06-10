import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { MessageSquare, Bot, User } from 'lucide-react'
import { MensagemForm } from './mensagem-form'

export const metadata: Metadata = { title: 'Mensagens' }

interface Mensagem {
  id: string
  tipoAutor: 'SISTEMA' | 'REPRESENTANTE' | 'CONSULTOR'
  texto: string
  lida: boolean
  criadoEm: string
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default async function PortalMensagensPage() {
  const token = await getAccessToken()

  let mensagens: Mensagem[] = []

  if (token) {
    try {
      const res = await api.get<{ data: Mensagem[] }>('/portal/mensagens', token)
      mensagens = res.data
    } catch { /* exibe vazio */ }
  }

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {/* Cabeçalho */}
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Mensagens
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Canal de comunicação com a equipe Hábilis
        </p>
      </div>

      {/* Feed de mensagens */}
      <div className="flex-1 space-y-3 rounded-xl border bg-card p-4">
        {mensagens.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-muted-foreground">Envie uma mensagem para falar com sua equipe de consultoria.</p>
          </div>
        )}

        {mensagens.map((m) => {
          const isRepresentante = m.tipoAutor === 'REPRESENTANTE'
          const isSistema = m.tipoAutor === 'SISTEMA'

          if (isSistema) {
            return (
              <div key={m.id} className="flex justify-center">
                <div className="flex items-center gap-1.5 bg-muted text-muted-foreground text-[10px] px-3 py-1 rounded-full">
                  <Bot className="h-3 w-3" />
                  {m.texto}
                  <span className="opacity-60 ml-1">{formatDateTime(m.criadoEm)}</span>
                </div>
              </div>
            )
          }

          return (
            <div
              key={m.id}
              className={`flex gap-2 ${isRepresentante ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isRepresentante ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {isRepresentante ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              {/* Balão */}
              <div className={`max-w-[75%] space-y-0.5 ${isRepresentante ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isRepresentante ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                  {m.texto}
                </div>
                <p className="text-[10px] text-muted-foreground px-1">
                  {isRepresentante ? 'Você' : 'Hábilis'} · {formatDateTime(m.criadoEm)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Formulário de envio */}
      <MensagemForm />
    </div>
  )
}
