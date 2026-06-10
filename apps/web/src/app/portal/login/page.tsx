import type { Metadata } from 'next'
import { AccessExperienceShell } from '@/components/access/access-experience-shell'
import { PortalLoginForm } from './login-form'

export const metadata: Metadata = { title: 'Acesso ao Portal' }

export default function PortalLoginPage() {
  return (
    <AccessExperienceShell
      activeSurface="portal"
      eyebrow="canal externo · cliente e parceiro"
      title="O portal do cliente com a mesma experiência ampla e orientada por contexto."
      description="Em vez de uma tela isolada, o acesso ao portal nasce da mesma linguagem do site: visão institucional, foco em documentação e jornada clara para parceiros e empreendimentos."
      chips={['Documentos', 'Checklists', 'Mensagens', 'Status regulatório', 'Entregas']}
      stats={[
        { value: '18', label: 'documentos ativos' },
        { value: '7', label: 'pendências resolvidas' },
        { value: '2', label: 'uploads hoje' },
        { value: '24h', label: 'última atualização' },
      ]}
      formTitle="Portal do cliente"
      formDescription="Acesse para enviar documentos, responder checklists e acompanhar o retorno técnico da equipe Hábilis."
      supportTitle="Mesma assinatura, públicos diferentes"
      supportText="O portal mantém a clareza comercial do site, mas organiza a operação externa com linguagem mais objetiva para cliente e parceiro."
    >
      <PortalLoginForm />
    </AccessExperienceShell>
  )
}
