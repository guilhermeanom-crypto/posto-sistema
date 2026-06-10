import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'border border-border text-foreground',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
}

type Variant = keyof typeof variants

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

// Mapa de status → variant
export function statusProcessoBadge(status: string): Variant {
  const map: Record<string, Variant> = {
    EM_ELABORACAO: 'secondary',
    AGUARDANDO_DOCUMENTOS: 'warning',
    PRONTO_PROTOCOLO: 'info',
    PROTOCOLADO: 'info',
    EM_ANALISE: 'info',
    EXIGENCIA_DOCUMENTAL: 'warning',
    EM_VISTORIA: 'info',
    DEFERIDO: 'success',
    INDEFERIDO: 'destructive',
    EM_RECURSO: 'warning',
    SUSPENSO: 'warning',
    CANCELADO: 'outline',
    VENCIDO: 'destructive',
    EM_RENOVACAO: 'info',
    ARQUIVADO: 'outline',
  }
  return map[status] ?? 'outline'
}

export function statusDocumentoBadge(status: string): Variant {
  const map: Record<string, Variant> = {
    PENDENTE: 'secondary',
    ENVIADO: 'info',
    EM_ANALISE: 'info',
    APROVADO: 'success',
    REJEITADO: 'destructive',
    VENCIDO: 'destructive',
    A_RENOVAR: 'warning',
    SUBSTITUIDO: 'outline',
    DISPENSADO: 'outline',
  }
  return map[status] ?? 'outline'
}

export function statusTarefaBadge(status: string): Variant {
  const map: Record<string, Variant> = {
    PENDENTE: 'secondary',
    EM_ANDAMENTO: 'info',
    AGUARDANDO_APROVACAO: 'warning',
    APROVADA: 'success',
    CONCLUIDA: 'success',
    CANCELADA: 'outline',
    BLOQUEADA: 'destructive',
    ESCALONADA: 'warning',
  }
  return map[status] ?? 'outline'
}

export function prioridadeBadge(prioridade: string): Variant {
  const map: Record<string, Variant> = {
    CRITICA: 'destructive',
    ALTA: 'warning',
    MEDIA: 'info',
    BAIXA: 'secondary',
  }
  return map[prioridade] ?? 'outline'
}

export function statusCondicionanteBadge(status: string): Variant {
  const map: Record<string, Variant> = {
    PENDENTE: 'secondary',
    EM_CUMPRIMENTO: 'info',
    AGUARDANDO_EVIDENCIA: 'warning',
    CUMPRIDA: 'success',
    VENCIDA: 'destructive',
    DISPENSADA: 'outline',
  }
  return map[status] ?? 'outline'
}

export function nivelAlertaBadge(nivel: string): Variant {
  const map: Record<string, Variant> = {
    CRITICO: 'destructive',
    ALTO: 'warning',
    MEDIO: 'info',
    INFORMATIVO: 'secondary',
  }
  return map[nivel] ?? 'outline'
}

export function statusComplianceBadge(status: string): Variant {
  const map: Record<string, Variant> = {
    REGULAR: 'success',
    ATENCAO: 'warning',
    CRITICO: 'destructive',
    EMERGENCIA: 'destructive',
  }
  return map[status] ?? 'outline'
}

export function labelStatus(status: string): string {
  const map: Record<string, string> = {
    // Processo
    EM_ELABORACAO: 'Em elaboração',
    AGUARDANDO_DOCUMENTOS: 'Ag. documentos',
    PRONTO_PROTOCOLO: 'Pronto p/ protocolo',
    PROTOCOLADO: 'Protocolado',
    EM_ANALISE: 'Em análise',
    EXIGENCIA_DOCUMENTAL: 'Exigência documental',
    EM_VISTORIA: 'Em vistoria',
    DEFERIDO: 'Deferido',
    INDEFERIDO: 'Indeferido',
    EM_RECURSO: 'Em recurso',
    SUSPENSO: 'Suspenso',
    CANCELADO: 'Cancelado',
    VENCIDO: 'Vencido',
    EM_RENOVACAO: 'Em renovação',
    ARQUIVADO: 'Arquivado',
    // Documento
    PENDENTE: 'Pendente',
    ENVIADO: 'Enviado',
    APROVADO: 'Aprovado',
    REJEITADO: 'Rejeitado',
    A_RENOVAR: 'A renovar',
    SUBSTITUIDO: 'Substituído',
    DISPENSADO: 'Dispensado',
    // Tarefa
    EM_ANDAMENTO: 'Em andamento',
    AGUARDANDO_APROVACAO: 'Ag. aprovação',
    APROVADA: 'Aprovada',
    CONCLUIDA: 'Concluída',
    BLOQUEADA: 'Bloqueada',
    ESCALONADA: 'Escalonada',
    // Condicionante
    EM_CUMPRIMENTO: 'Em cumprimento',
    AGUARDANDO_EVIDENCIA: 'Ag. evidência',
    CUMPRIDA: 'Cumprida',
    DISPENSADA: 'Dispensada',
    // Prioridade
    CRITICA: 'Crítica',
    ALTA: 'Alta',
    MEDIA: 'Média',
    BAIXA: 'Baixa',
    // Compliance
    REGULAR: 'Regular',
    ATENCAO: 'Atenção',
    CRITICO: 'Crítico',
    EMERGENCIA: 'Emergência',
    // Alerta nível
    INFORMATIVO: 'Informativo',
    MEDIO: 'Médio',
  }
  return map[status] ?? status
}
