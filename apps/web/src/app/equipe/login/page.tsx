import type { Metadata } from 'next'
import { AccessExperienceShell } from '@/components/access/access-experience-shell'
import { EquipeLoginForm } from './login-form'

export const metadata: Metadata = { title: 'Acesso da Equipe' }

export default function EquipeLoginPage() {
  return (
    <AccessExperienceShell
      activeSurface="campo"
      eyebrow="execução em rota · vistoria e evidências"
      title="A área de campo também ocupa a tela inteira, sem perder agilidade."
      description="A interface da equipe herda a leitura visual do site, mas continua orientada para OS, checklist, evidências e deslocamento. O resultado é uma entrada mais forte, legível e coerente com o ecossistema Hábilis."
      chips={['Ordens de serviço', 'Checklist', 'Evidências', 'Pendências', 'Rota do dia']}
      stats={[
        { value: '8', label: 'OS em aberto' },
        { value: '26', label: 'evidências do dia' },
        { value: '82%', label: 'checklist médio' },
        { value: '3', label: 'paradas em rota' },
      ]}
      formTitle="Operação de campo"
      formDescription="Entre com sua matrícula para abrir o painel da equipe e continuar a jornada operacional em rota."
      supportTitle="Leitura rápida para quem está em execução"
      supportText="Mesmo em tela cheia, a prioridade continua sendo velocidade: status visível, contexto da rota e acesso direto ao formulário."
    >
      <EquipeLoginForm />
    </AccessExperienceShell>
  )
}
