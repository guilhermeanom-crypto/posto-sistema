'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarAlvaraAction } from './actions'

const TIPOS = [
  { value: 'AVCB', label: 'AVCB — Auto de Vistoria do Corpo de Bombeiros' },
  { value: 'ALVARA_FUNCIONAMENTO', label: 'Alvará de Funcionamento' },
  { value: 'HABITE_SE', label: 'Habite-se' },
  { value: 'PPCI', label: 'PPCI — Plano de Prevenção Contra Incêndio' },
  { value: 'LICENCA_SANITARIA', label: 'Licença Sanitária' },
  { value: 'ALVARA_OBRAS', label: 'Alvará de Obras' },
  { value: 'OUTROS', label: 'Outros' },
]

export function CriarAlvaraForm() {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarAlvaraAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      setAberto(false)
      router.refresh()
    }
  }, [state, router])

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        + Novo Documento Urbano
      </button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Novo Documento Urbano</h2>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-sm">
          Cancelar
        </button>
      </div>

      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="empreendimentoId" value="" />

        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo de Documento *</label>
          <select
            name="tipo"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione...</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Número</label>
          <input
            name="numero"
            placeholder="Número do alvará (opcional)"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Órgão Emissor *</label>
          <input
            name="orgaoEmissor"
            required
            placeholder="Ex: Corpo de Bombeiros, Prefeitura..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Emissão</label>
          <input
            name="dataEmissao"
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Vencimento</label>
          <input
            name="dataVencimento"
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Observações</label>
          <input
            name="observacoes"
            placeholder="Observações opcionais..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {state?.error && (
          <p className="md:col-span-2 text-sm text-red-600">{state.error}</p>
        )}

        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Salvando...' : 'Salvar Documento'}
          </button>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
