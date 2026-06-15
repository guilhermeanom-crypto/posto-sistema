import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Building2, MapPin, User, Fuel } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { NovoEmpreendimentoForm } from './novo-empreendimento-form'

export const metadata: Metadata = { title: 'Cadastrar Novo Posto' }

interface Empresa {
  id: string
  nome: string
  razaoSocial?: string
  cnpj?: string
}

export default async function NovoEmpreendimentoPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  let empresas: Empresa[] = []
  try {
    const res = await api.get<{ data: Empresa[] }>('/empresas', token)
    empresas = res.data ?? []
  } catch {
    // Sem empresas pré-carregadas o formulário oferece criar uma nova ali mesmo.
  }

  const STEPS = [
    { numero: 1, label: 'Identificação',    icone: Building2, ativo: true  },
    { numero: 2, label: 'Diagnóstico',      icone: Fuel,      ativo: false },
    { numero: 3, label: 'Plano de ação',    icone: MapPin,    ativo: false },
    { numero: 4, label: 'Confirmação',      icone: User,      ativo: false },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/empreendimentos"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Meus Postos
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Cadastrar novo posto</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha os dados básicos. Após salvar, o sistema fará o diagnóstico regulatório
            automático e criará o plano de regularização.
          </p>
        </div>
        <Link
          href="/empreendimentos"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary"
        >
          Ver Meus Postos
        </Link>
      </div>

      {/* Stepper visual */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => (
          <div key={step.numero} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  step.ativo
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {step.numero}
              </div>
              <span className={`text-xs font-medium ${step.ativo ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="mx-2 h-px flex-1 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Formulário */}
      <NovoEmpreendimentoForm empresas={empresas} />
    </div>
  )
}
