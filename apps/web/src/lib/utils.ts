import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { StatusCompliance } from '@repo/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function complianceColor(status: string): string {
  switch (status) {
    case StatusCompliance.REGULAR:
      return 'text-green-600'
    case StatusCompliance.ATENCAO:
      return 'text-yellow-600'
    case StatusCompliance.CRITICO:
      return 'text-red-600'
    default:
      return 'text-muted-foreground'
  }
}

export function complianceBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case StatusCompliance.REGULAR:
      return 'default'
    case StatusCompliance.ATENCAO:
      return 'secondary'
    case StatusCompliance.CRITICO:
      return 'destructive'
    default:
      return 'outline'
  }
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
