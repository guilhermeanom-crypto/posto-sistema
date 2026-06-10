'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarTreinamentoAction } from '../actions'

interface TreinamentoTipo {
  id: string; nome: string; normativa: string; cargaHoraria: number
  periodicidadeMeses: number; obrigatorioParaCargos: string[]
}
interface Empreendimento { id: string; nome: string }
interface Funcionario { id: string; nome: string; cargo: string; empreendimentoId: string }

interface Props {
  tipos: TreinamentoTipo[]
  empreendimentos: Empreendimento[]
  funcionarios: Funcionario[]
}

export function NovoTreinamentoForm({ tipos, empreendimentos, funcionarios }: Props) {
  const [state, action, pending] = useActionState(criarTreinamentoAction, {})
  const router = useRouter()
  const [empSel, setEmpSel] = useState('')
  const [tipoSel, setTipoSel] = useState('')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (state?.ok) router.push('/sst/treinamentos')
  }, [state, router])

  const tipoObj = tipos.find((t) => t.id === tipoSel)
  const funcFiltrados = empSel
    ? funcionarios.filter((f) => f.empreendimentoId === empSel)
    : funcionarios

  // Auto-selecionar funcionários com cargo obrigatório
  useEffect(() => {
    if (tipoObj && tipoObj.obrigatorioParaCargos.length > 0 && empSel) {
      const obrigatorios = funcFiltrados.filter((f) =>
        tipoObj.obrigatorioParaCargos.some((c) => f.cargo.toLowerCase().includes(c.toLowerCase())),
      )
      setSelecionados(new Set(obrigatorios.map((f) => f.id)))
    }
  }, [tipoSel, empSel]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleFuncionario(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <form action={action} className="rounded-lg border bg-card p-5 space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Empreendimento *</label>
          <select name="empreendimentoId" required value={empSel} onChange={(e) => setEmpSel(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {empreendimentos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo de Treinamento *</label>
          <select name="tipoId" required value={tipoSel} onChange={(e) => setTipoSel(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.normativa} — {t.nome} ({t.cargaHoraria}h)</option>)}
          </select>
        </div>

        {tipoObj && (
          <div className="md:col-span-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <strong>{tipoObj.normativa}</strong> — {tipoObj.nome} · {tipoObj.cargaHoraria}h ·
            Reciclagem: {tipoObj.periodicidadeMeses > 0 ? `${tipoObj.periodicidadeMeses} meses` : 'Única'}
            {tipoObj.obrigatorioParaCargos.length > 0 && (
              <span> · Obrigatório para: <strong>{tipoObj.obrigatorioParaCargos.join(', ')}</strong></span>
            )}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Realização *</label>
          <input name="dataRealizacao" type="date" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Vencimento</label>
          <input name="dataVencimento" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Instrutor</label>
          <input name="instrutor" placeholder="Nome do instrutor" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Carga Horária Realizada</label>
          <input name="cargaHorariaRealizada" type="number" min={1} placeholder={tipoObj ? String(tipoObj.cargaHoraria) : ''} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Local</label>
          <input name="local" placeholder="Local do treinamento" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {/* Seleção de participantes */}
      {empSel && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Participantes ({selecionados.size} selecionados)</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelecionados(new Set(funcFiltrados.map((f) => f.id)))} className="text-xs text-primary hover:underline">Selecionar todos</button>
              <button type="button" onClick={() => setSelecionados(new Set())} className="text-xs text-muted-foreground hover:underline">Limpar</button>
            </div>
          </div>

          {funcFiltrados.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum funcionário ativo neste empreendimento.</p>
          ) : (
            <div className="rounded-md border max-h-64 overflow-y-auto divide-y">
              {funcFiltrados.map((f) => {
                const checked = selecionados.has(f.id)
                const obrigatorio = tipoObj?.obrigatorioParaCargos.some((c) => f.cargo.toLowerCase().includes(c.toLowerCase()))
                return (
                  <label key={f.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30 ${checked ? 'bg-primary/5' : ''}`}>
                    <input
                      type="checkbox"
                      name="participanteIds"
                      value={f.id}
                      checked={checked}
                      onChange={() => toggleFuncionario(f.id)}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">{f.nome}</span>
                      <span className="text-xs text-muted-foreground ml-2">{f.cargo}</span>
                    </div>
                    {obrigatorio && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">Obrigatório</span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {pending ? 'Registrando...' : 'Registrar Treinamento'}
        </button>
        <button type="button" onClick={() => router.push('/sst/treinamentos')} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
      </div>
    </form>
  )
}
