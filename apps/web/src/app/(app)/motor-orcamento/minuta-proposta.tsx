'use client'

import { useRef, useState, useTransition } from 'react'
import { ArrowRight, Building2, Calendar, CheckCircle2, FileText, Loader2, X } from 'lucide-react'
import { emitirPropostaModeloAction } from './actions'

interface MinutaItem {
  modulo: string
  descricao: string
  horas?: number
  valor?: number
}

interface MinutaPropostaProps {
  /** JSON string com o payload completo enviado para o action. */
  payload: string | null
  /** Rota de retorno após emissão. */
  returnTo: string
  /** Dados visuais para a minuta. */
  display: {
    cliente: string
    empreendimento: string
    cidade: string
    estado: string
    codigoInterno?: string | null
    cnpj?: string | null
    bandeira?: string | null
    totalEstimado: number
    totalServicos: number
    horasTotais: number
    ticketMedio: number
    validadeDias: number
    itens: MinutaItem[]
  } | null
  disabled?: boolean
}

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MinutaProposta({ payload, returnTo, display, disabled }: MinutaPropostaProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const disabledAll = disabled || !payload || !display

  function confirmar() {
    if (!formRef.current) return
    startTransition(() => {
      formRef.current!.requestSubmit()
    })
  }

  return (
    <>
      {/* Form oculto que dispara o server action quando o usuário confirma */}
      <form ref={formRef} action={emitirPropostaModeloAction} style={{ display: 'none' }}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="payload" value={payload ?? ''} />
      </form>

      <button
        type="button"
        disabled={disabledAll}
        onClick={() => setOpen(true)}
        className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all ${
          disabledAll ? 'cursor-not-allowed bg-orange-400/70' : 'bg-orange-500 hover:bg-orange-600'
        }`}
      >
        <FileText className="h-3.5 w-3.5" />
        Emitir proposta
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      {open && display ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
          onClick={() => !pending && setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho da minuta */}
            <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-gradient-to-r from-orange-50 via-amber-50/40 to-emerald-50/30 px-6 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-green-600 text-sm font-black text-white shadow-sm">
                  H
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    Minuta de proposta
                  </p>
                  <p className="text-sm font-bold tracking-tight text-foreground truncate">
                    Hábilis Consultoria Posto Compliance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                aria-label="Fechar minuta"
                className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="px-6 py-6 space-y-6">
              {/* Identificação */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Identificação do posto
                </p>
                <div className="mt-3 rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold tracking-tight">{display.empreendimento}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {display.cidade}/{display.estado}
                        {display.bandeira ? ` · ${display.bandeira}` : ''}
                        {display.codigoInterno ? ` · cód. ${display.codigoInterno}` : ''}
                      </p>
                      {display.cnpj ? (
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">CNPJ: {display.cnpj}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              {/* Resumo financeiro + validade */}
              <section className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Valor total estimado
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-orange-600 tabular-nums">
                    {fmtMoney(display.totalEstimado)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Ticket médio {fmtMoney(display.ticketMedio)}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Escopo
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight tabular-nums text-foreground">
                    {display.totalServicos}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    serviços · {display.horasTotais.toFixed(0)} h estimadas
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Validade
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight tabular-nums text-foreground">
                    {display.validadeDias}d
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" /> contados da emissão
                  </p>
                </div>
              </section>

              {/* Itens do escopo */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Itens do escopo
                </p>
                <div className="mt-3 rounded-xl border bg-card overflow-hidden">
                  <ul className="divide-y">
                    {display.itens.slice(0, 12).map((it, i) => (
                      <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-[10px] font-bold text-primary tabular-nums flex-shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold tracking-tight text-foreground truncate">
                            {it.descricao}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                            {it.modulo}
                          </p>
                        </div>
                        {typeof it.horas === 'number' ? (
                          <span className="text-[11px] tabular-nums text-muted-foreground">{it.horas} h</span>
                        ) : null}
                        {typeof it.valor === 'number' ? (
                          <span className="w-24 text-right text-xs font-semibold tabular-nums text-foreground">
                            {fmtMoney(it.valor)}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {display.itens.length > 12 ? (
                    <p className="border-t bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
                      + {display.itens.length - 12} itens adicionais incluídos no escopo
                    </p>
                  ) : null}
                </div>
              </section>

              {/* Status */}
              <section className="rounded-xl border bg-emerald-50/40 border-emerald-200 px-4 py-3 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-emerald-900">
                  <p className="font-semibold">Status: pronta para emissão</p>
                  <p className="text-emerald-700/90 mt-0.5">
                    Ao confirmar, a proposta é registrada em <strong>Comercial · Propostas</strong> com número, validade e link para envio ao cliente.
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/30 hover:text-primary"
              >
                Voltar e ajustar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs font-bold disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Emitindo...
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5" /> Confirmar e emitir
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}
