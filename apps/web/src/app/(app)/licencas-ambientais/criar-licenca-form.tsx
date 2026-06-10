'use client'

import { useActionState, useState } from 'react'
import { criarLicencaAction } from './actions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const TIPOS = [
  { value: 'LO', label: 'LO — Licença de Operação' },
  { value: 'LI', label: 'LI — Licença de Instalação' },
  { value: 'LP', label: 'LP — Licença Prévia' },
  { value: 'LAO', label: 'LAO — Licença Ambiental de Operação' },
  { value: 'LAS', label: 'LAS — Licença Ambiental Simplificada' },
  { value: 'LAF', label: 'LAF — Licença Ambiental de Funcionamento' },
  { value: 'LAT', label: 'LAT — Licença Ambiental de Transporte' },
  { value: 'OUTRAS', label: 'Outras' },
]

export function CriarLicencaForm() {
  const [aberto, setAberto] = useState(false)
  const [state, action, pending] = useActionState(criarLicencaAction, null)
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
        + Nova Licença Ambiental
      </button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Nova Licença Ambiental</h2>
        <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground text-sm">
          Cancelar
        </button>
      </div>

      <form action={action} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo de Licença *</label>
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
          <label className="text-sm font-medium">Número da Licença *</label>
          <input
            name="numero"
            required
            placeholder="Ex: SMA Nº 01234/2024"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Órgão Emissor *</label>
          <input
            name="orgaoEmissor"
            required
            placeholder="Ex: CETESB"
            defaultValue="CETESB"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Responsável Técnico</label>
          <input
            name="responsavelTecnico"
            placeholder="Nome do RT (opcional)"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Emissão *</label>
          <input
            name="dataEmissao"
            type="date"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Vencimento *</label>
          <input
            name="dataVencimento"
            type="date"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <input
          type="hidden"
          name="empreendimentoId"
          value=""
          id="empreendimentoId-hidden"
        />

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Observações</label>
          <textarea
            name="observacoes"
            rows={2}
            placeholder="Informações adicionais..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
            {pending ? 'Salvando...' : 'Salvar Licença'}
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
