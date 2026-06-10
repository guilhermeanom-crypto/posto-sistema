'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, MapPin, Users, Settings, CheckCircle2,
  ChevronRight, Plus, FileSpreadsheet,
} from 'lucide-react'
import { avancarEtapaAction } from './actions'
import { CSVImport } from './csv-import'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Empresa {
  id: string
  nome: string
  cnpj: string
}

interface Props {
  etapaInicial: number
  empresas: Empresa[]
  empreendimentosCount: number
  usuariosCount: number
}

const STEPS = [
  { numero: 1, label: 'Empresa',         icon: Building2 },
  { numero: 2, label: 'Postos',          icon: MapPin },
  { numero: 3, label: 'Usuários',        icon: Users },
  { numero: 4, label: 'Módulos',         icon: Settings },
  { numero: 5, label: 'Finalizar',       icon: CheckCircle2 },
]

const MODULOS = [
  { key: 'ambiental',    label: 'Licenças Ambientais',   sub: 'LA, AP, CAR' },
  { key: 'anp',          label: 'ANP / INMETRO',         sub: 'Bombas, calibração' },
  { key: 'sst',          label: 'SST',                   sub: 'ASO, CIPA, treinamentos' },
  { key: 'estanqueidade',label: 'Estanqueidade',         sub: 'Tanques, testes' },
  { key: 'logistica',    label: 'Logística Reversa',     sub: 'Resíduos, metas' },
  { key: 'monitoramento',label: 'Monitoramento',         sub: 'Poços, VMP' },
  { key: 'fiscalizacoes',label: 'Fiscalizações',         sub: 'Autos, recursos' },
  { key: 'checklists',   label: 'Checklists',            sub: 'Operacionais, rotinas' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────────────────────

function Stepper({ atual }: { atual: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done = step.numero < atual
        const active = step.numero === atual
        return (
          <div key={step.numero} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                done   ? 'border-emerald-500 bg-emerald-500 text-white' :
                active ? 'border-primary bg-primary text-primary-foreground' :
                         'border-muted bg-background text-muted-foreground'
              }`}>
                {done ? '✓' : step.numero}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                done ? 'text-emerald-600' : active ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mx-1 h-px flex-1 ${done ? 'bg-emerald-300' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Wizard
// ─────────────────────────────────────────────────────────────────────────────

export function OnboardingWizard({ etapaInicial, empresas, empreendimentosCount, usuariosCount }: Props) {
  const [etapa, setEtapa] = useState(etapaInicial)
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>(
    MODULOS.map((m) => m.key),
  )
  const [showCSV, setShowCSV] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const primeiraEmpresa = empresas[0]

  function avancar(proxEtapa: number, concluido = false) {
    startTransition(async () => {
      await avancarEtapaAction(proxEtapa, concluido)
      setEtapa(proxEtapa)
      if (concluido) router.push('/dashboard')
    })
  }

  function toggleModulo(key: string) {
    setModulosSelecionados((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Stepper atual={etapa} />

      {/* ── Step 1: Empresa ─────────────────────────────────────────── */}
      {etapa === 1 && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Empresa matriz</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre a empresa que será responsável pelos postos.
            </p>
          </div>

          {empresas.length > 0 ? (
            <div className="space-y-2">
              {empresas.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3.5">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{e.nome}</p>
                    <p className="text-xs text-muted-foreground font-mono">{e.cnpj}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                </div>
              ))}
              <Link
                href="/configuracoes/empresas/nova"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar outra empresa
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
              <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada</p>
              <Link
                href="/configuracoes/empresas/nova"
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Cadastrar empresa
              </Link>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              disabled={empresas.length === 0 || isPending}
              onClick={() => avancar(2)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Postos ──────────────────────────────────────────── */}
      {etapa === 2 && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          {showCSV && primeiraEmpresa && (
            <CSVImport empresaId={primeiraEmpresa.id} onClose={() => setShowCSV(false)} />
          )}

          <div>
            <h2 className="text-base font-semibold">Cadastro de postos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione os postos de combustível um a um ou faça importação em lote via CSV.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{empreendimentosCount}</p>
              <p className="text-xs text-muted-foreground">posto(s) cadastrado(s)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/empreendimentos/novo"
              className="flex flex-col items-center gap-2 rounded-xl border p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors text-center"
            >
              <Plus className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Adicionar um posto</p>
                <p className="text-xs text-muted-foreground">Formulário completo</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setShowCSV(true)}
              disabled={!primeiraEmpresa}
              className="flex flex-col items-center gap-2 rounded-xl border p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors text-center disabled:opacity-40"
            >
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Importar via CSV</p>
                <p className="text-xs text-muted-foreground">Vários postos de uma vez</p>
              </div>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => avancar(1)}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Voltar
            </button>
            <button
              disabled={isPending}
              onClick={() => avancar(3)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
            >
              {empreendimentosCount === 0 ? 'Pular' : 'Próximo'} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Usuários ────────────────────────────────────────── */}
      {etapa === 3 && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Equipe e acessos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Convide analistas, coordenadores e representantes de posto.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usuariosCount}</p>
              <p className="text-xs text-muted-foreground">usuário(s) ativo(s)</p>
            </div>
          </div>

          <Link
            href="/usuarios?novo=1"
            className="flex items-center gap-2 rounded-xl border border-dashed p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Convidar usuário</p>
              <p className="text-xs text-muted-foreground">Analista, coordenador, representante ou executivo</p>
            </div>
          </Link>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => avancar(2)} className="text-sm text-muted-foreground hover:underline">
              ← Voltar
            </button>
            <button
              disabled={isPending}
              onClick={() => avancar(4)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Módulos ─────────────────────────────────────────── */}
      {etapa === 4 && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold">Módulos ativos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione quais módulos fazem parte do escopo desta operação.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MODULOS.map(({ key, label, sub }) => {
              const ativo = modulosSelecionados.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleModulo(key)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    ativo
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-medium ${ativo ? 'text-primary' : 'text-foreground'}`}>
                      {label}
                    </p>
                    {ativo && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => avancar(3)} className="text-sm text-muted-foreground hover:underline">
              ← Voltar
            </button>
            <button
              disabled={isPending}
              onClick={() => avancar(5)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Finalizar ───────────────────────────────────────── */}
      {etapa === 5 && (
        <div className="rounded-2xl border bg-card p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Tudo pronto!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A configuração inicial está completa.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 text-left space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{empresas.length} empresa(s) cadastrada(s)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{empreendimentosCount} posto(s) cadastrado(s)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{usuariosCount} usuário(s) ativo(s)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{modulosSelecionados.length} módulo(s) ativo(s)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              disabled={isPending}
              onClick={() => avancar(5, true)}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : 'Ir para o Dashboard →'}
            </button>
            {primeiraEmpresa && empreendimentosCount > 0 && (
              <Link
                href="/empreendimentos"
                className="flex items-center justify-center gap-2 border rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Ver postos cadastrados
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
