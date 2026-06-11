'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { gerarTarefasOnboardingAction } from './actions'

interface ItemGap {
  codigo: string
  modulo: string
  descricao: string
  criticidade: string
  status: 'CONFORME' | 'A_RENOVAR' | 'SEM_DADOS' | 'NAO_APLICAVEL'
}

interface GapAnalysis {
  semDados: number
  aRenovar: number
  itens: ItemGap[]
}

interface Props {
  empreendimentoId: string
  gapAnalysis: GapAnalysis
}

const MODULO_LABEL: Record<string, string> = {
  AMBIENTAL: 'Ambiental',
  ANP: 'ANP / INMETRO',
  SST: 'Saúde e Segurança',
  URBANISTICO: 'Urbanístico / Bombeiros',
  MONITORAMENTO: 'Monitoramento',
  LOGISTICA_REVERSA: 'Logística Reversa',
}

const CRITICIDADE_ORDEM: Record<string, number> = { CRITICA: 0, ALTA: 1, MEDIA: 2 }

export function OnboardingWizard({ empreendimentoId, gapAnalysis }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Step 3: seleção de módulos e criticidade
  const [step, setStep] = useState<3 | 4>(3)
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>(
    [...new Set(gapAnalysis.itens.filter((i) => i.status !== 'NAO_APLICAVEL').map((i) => i.modulo))],
  )
  const [criticidadeSelecionada, setCriticidadeSelecionada] = useState<string[]>(['CRITICA', 'ALTA'])
  const [resultado, setResultado] = useState<{ tarefasCriadas: number; mensagem: string } | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const todosModulos = [...new Set(
    gapAnalysis.itens.filter((i) => i.status !== 'NAO_APLICAVEL').map((i) => i.modulo),
  )].sort()

  const itensQueSerao = gapAnalysis.itens.filter(
    (i) =>
      (i.status === 'SEM_DADOS' || i.status === 'A_RENOVAR') &&
      modulosSelecionados.includes(i.modulo) &&
      criticidadeSelecionada.includes(i.criticidade),
  )

  function toggleModulo(m: string) {
    setModulosSelecionados((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    )
  }

  function toggleCriticidade(c: string) {
    setCriticidadeSelecionada((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    )
  }

  async function gerarTarefas() {
    setErro(null)
    startTransition(async () => {
      const res = await gerarTarefasOnboardingAction(
        empreendimentoId,
        modulosSelecionados,
        criticidadeSelecionada,
      )
      if (res.error) {
        setErro(res.error)
        return
      }
      setResultado(res)
      setStep(4)
    })
  }

  if (gapAnalysis.semDados === 0 && gapAnalysis.aRenovar === 0) {
    return (
      <div className="rounded-lg border bg-emerald-50 border-emerald-200 px-6 py-8 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <p className="font-semibold text-emerald-800">Posto em conformidade!</p>
        <p className="text-sm text-emerald-700 mt-1">
          Todas as obrigações regulatórias têm evidência cadastrada.
        </p>
        <a
          href={`/empreendimentos/${empreendimentoId}`}
          className="mt-4 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          Ir para o hub do posto →
        </a>
      </div>
    )
  }

  // ── Step 3: Plano de ação ───────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-base">Gerar plano de regularização</h2>
            <p className="text-sm text-muted-foreground mt-1">
              O sistema criará tarefas para cada obrigação sem evidência.
              Selecione quais módulos e níveis de criticidade incluir.
            </p>
          </div>

          {/* Seleção de módulos */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Módulos</p>
            <div className="flex flex-wrap gap-2">
              {todosModulos.map((m) => {
                const count = gapAnalysis.itens.filter(
                  (i) => i.modulo === m && (i.status === 'SEM_DADOS' || i.status === 'A_RENOVAR'),
                ).length
                const ativo = modulosSelecionados.includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleModulo(m)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      ativo
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {MODULO_LABEL[m] ?? m} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Seleção de criticidade */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Criticidade</p>
            <div className="flex gap-2">
              {['CRITICA', 'ALTA', 'MEDIA'].map((c) => {
                const count = gapAnalysis.itens.filter(
                  (i) => i.criticidade === c && (i.status === 'SEM_DADOS' || i.status === 'A_RENOVAR'),
                ).length
                const ativo = criticidadeSelecionada.includes(c)
                const cor = c === 'CRITICA' ? 'red' : c === 'ALTA' ? 'orange' : 'yellow'
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCriticidade(c)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      ativo
                        ? `border-${cor}-500 bg-${cor}-50 text-${cor}-700`
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {c === 'CRITICA' ? 'Crítica' : c === 'ALTA' ? 'Alta' : 'Média'} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview das tarefas que serão geradas */}
          {itensQueSerao.length > 0 ? (
            <div className="rounded-md border bg-muted/20 p-3 space-y-1.5 max-h-52 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {itensQueSerao.length} tarefa(s) serão criadas:
              </p>
              {[...itensQueSerao]
                .sort((a, b) => (CRITICIDADE_ORDEM[a.criticidade] ?? 9) - (CRITICIDADE_ORDEM[b.criticidade] ?? 9))
                .map((i) => (
                  <div key={i.codigo} className="flex items-center gap-2 text-sm">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        i.criticidade === 'CRITICA' ? 'bg-red-500' : i.criticidade === 'ALTA' ? 'bg-orange-500' : 'bg-yellow-400'
                      }`}
                    />
                    <span className="text-muted-foreground text-xs truncate">{i.descricao}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Nenhum item selecionado para o plano.
            </p>
          )}

          {erro && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {erro}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <a
              href={`/empreendimentos/${empreendimentoId}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              Pular e ir para o hub →
            </a>
            <button
              type="button"
              disabled={isPending || itensQueSerao.length === 0}
              onClick={gerarTarefas}
              className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Gerando…' : `Gerar ${itensQueSerao.length} tarefa(s) →`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 4: Confirmação ─────────────────────────────────────────────────
  return (
    <div className="rounded-lg border bg-card p-8 text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
        ✓
      </div>
      <div>
        <h2 className="text-xl font-bold">Posto cadastrado com sucesso!</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {resultado?.mensagem ?? 'Plano de regularização gerado.'}
        </p>
      </div>

      {resultado && resultado.tarefasCriadas > 0 && (
        <div className="rounded-md border bg-muted/20 inline-block px-4 py-2 text-sm">
          <span className="font-semibold text-primary">{resultado.tarefasCriadas}</span> tarefa(s)
          criada(s) no plano de regularização
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <a
          href={`/empreendimentos/${empreendimentoId}`}
          className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => router.refresh()}
        >
          Ir para o hub do posto →
        </a>
        <Link
          href="/empreendimentos/novo"
          className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cadastrar outro posto
        </Link>
      </div>
    </div>
  )
}
