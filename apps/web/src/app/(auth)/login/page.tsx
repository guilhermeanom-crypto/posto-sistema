import type { Metadata } from 'next'
import { AccessExperienceShell } from '@/components/access/access-experience-shell'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <AccessExperienceShell
      activeSurface="sistema"
      eyebrow="plataforma operacional · central interna"
      title="Toda a operação no mesmo padrão visual do site, em tela cheia."
      description="A entrada interna passa a conversar com a narrativa institucional: leitura executiva, foco regulatório e navegação clara entre documentos, licenças, condicionantes, território e campo."
      chips={['Licenças', 'Condicionantes', 'Documentos', 'Território', 'Inteligência']}
      stats={[
        { value: '127', label: 'licenças ativas' },
        { value: '12', label: 'vencendo 30d' },
        { value: '+200', label: 'ativos monitorados' },
        { value: '94,2%', label: 'score médio' },
      ]}
      formTitle="Central executiva"
      formDescription="Entre com suas credenciais para abrir o cockpit operacional e continuar a gestão regulatória."
      supportTitle="Padrão único entre acessos"
      supportText="Sistema interno, portal do cliente e área de campo compartilham a mesma lógica de tela cheia, hierarquia visual e assinatura da marca."
    >
      <LoginForm />
    </AccessExperienceShell>
  )
}
