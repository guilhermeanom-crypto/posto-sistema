'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarASOAction } from './actions'

export function CriarASOForm() {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarASOAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) { setAberto(false); router.refresh() }
  }, [state, router])

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
      + Novo ASO
    </button>
  )

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Novo ASO</h3>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-sm">Cancelar</button>
      </div>
      <form action={action} className="grid gap-3 md:grid-cols-2">
        <input type="hidden" name="empreendimentoId" value="" />

        <div className="space-y-1">
          <label className="text-sm font-medium">Nome do Funcionário *</label>
          <input name="funcionarioNome" required placeholder="Nome completo" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">CPF</label>
          <input name="funcionarioCPF" placeholder="000.000.000-00" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Cargo</label>
          <input name="cargo" placeholder="Ex: Frentista" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo *</label>
          <select name="tipo" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            <option value="ADMISSIONAL">Admissional</option>
            <option value="PERIODICO">Periódico</option>
            <option value="DEMISSIONAL">Demissional</option>
            <option value="RETORNO">Retorno ao Trabalho</option>
            <option value="MUDANCA_FUNCAO">Mudança de Função</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data do Exame *</label>
          <input name="dataExame" type="date" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Vencimento</label>
          <input name="dataVencimento" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Aptidão *</label>
          <select name="aptidao" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            <option value="APTO">Apto</option>
            <option value="INAPTO">Inapto</option>
            <option value="APTO_RESTRICOES">Apto com Restrições</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Médico Responsável</label>
          <input name="medicoResponsavel" placeholder="Dr(a). Nome CRM" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {state?.error && <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>}

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pending ? 'Salvando...' : 'Salvar ASO'}
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
