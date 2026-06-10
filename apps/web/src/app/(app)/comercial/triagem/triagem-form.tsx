'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  Building2,
  ChevronRight,
  ClipboardList,
  FileSearch,
  Fuel,
  MapPinned,
  Radar,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { executarTriagemAction, gerarPropostaAction } from './actions'
import {
  CONTEXTO_EXTRA_LABELS,
  DECISAO_LABEL,
  PORTE_OPTIONS,
  SITUACAO_OPTIONS,
  UFS,
  type TriagemActionState,
} from './shared'

const initialState: TriagemActionState = {}

function moeda(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function riscoVariant(nivel?: string): 'success' | 'info' | 'warning' | 'destructive' | 'outline' {
  if (nivel === 'CRITICO') return 'destructive'
  if (nivel === 'ALTO') return 'warning'
  if (nivel === 'MEDIO') return 'info'
  if (nivel === 'BAIXO') return 'success'
  return 'outline'
}

function decisaoVariant(decisao: string): 'success' | 'warning' | 'info' {
  if (decisao === 'OBRIGATORIO') return 'success'
  if (decisao === 'CONDICIONAL') return 'warning'
  return 'info'
}

export function TriagemForm() {
  const [state, action, pending] = useActionState(executarTriagemAction, initialState)
  const [proposalState, proposalAction, proposalPending] = useActionState(gerarPropostaAction, {
    propostaError: undefined,
    proposta: undefined,
  })

  const contextoSinalizado = Object.entries(state.contextoExtra ?? {}).filter(([, enabled]) => enabled)

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-sm">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.14),_transparent_50%)] lg:block" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <Radar className="h-3.5 w-3.5" />
              Comercial interno
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground">Triagem Comercial por CNAE</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Faça uma leitura rápida do lead, acione o diagnóstico regulatório existente da Onda 2.7
              e receba risco, serviços sugeridos, alertas e faixa preliminar de orçamento sem expor custo interno,
              margem ou metadata do catálogo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <HeroMiniCard
              icon={Fuel}
              title="Entrada enxuta"
              description="CNAE, porte, situação e histórico básico para pré-qualificar a oportunidade."
            />
            <HeroMiniCard
              icon={Sparkles}
              title="Saída prática"
              description="Score, riscos, cobertura e próximos passos para alinhar comercial e operação."
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <form action={action} className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl">Dados básicos da triagem</CardTitle>
              <CardDescription>
                O payload enviado segue estritamente o schema atual do backend. Os sinais complementares abaixo ajudam a leitura comercial,
                mas ainda não entram no request automatizado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {state.error && (
                <Alert variant="destructive">
                  <BadgeAlert className="h-4 w-4" />
                  <AlertTitle>Falha ao consultar o diagnóstico</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  id="cnaePrincipal"
                  label="CNAE principal"
                  required
                  hint="Você pode informar mais de um CNAE separado por vírgula."
                >
                  <input
                    id="cnaePrincipal"
                    name="cnaePrincipal"
                    required
                    defaultValue={state.payload?.cnaes?.join(', ') ?? '4731-8/00'}
                    placeholder="4731-8/00"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>

                <Field id="uf" label="UF" required>
                  <select
                    id="uf"
                    name="uf"
                    required
                    defaultValue={state.payload?.uf ?? 'GO'}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="municipio" label="Município" hint="Opcional no backend atual, mas útil para contextualizar a triagem.">
                  <input
                    id="municipio"
                    name="municipio"
                    defaultValue={state.payload?.municipio ?? 'Goiânia'}
                    placeholder="Goiânia"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>

                <Field id="porte" label="Porte" required>
                  <select
                    id="porte"
                    name="porte"
                    required
                    defaultValue={state.payload?.porte ?? 'MEDIO'}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {PORTE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="situacao" label="Situação" required className="md:col-span-2">
                  <select
                    id="situacao"
                    name="situacao"
                    required
                    defaultValue={state.payload?.situacao ?? 'IRREGULAR'}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {SITUACAO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Histórico regulatório e sinais comerciais</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <BooleanSelect
                    id="temLicencaAnterior"
                    name="temLicencaAnterior"
                    label="Possui licença?"
                    defaultValue={state.payload?.temLicencaAnterior ?? false}
                    helper="Campo enviado ao backend como temLicencaAnterior."
                  />
                  <BooleanSelect
                    id="licencaVencida"
                    name="licencaVencida"
                    label="Licença vencida?"
                    defaultValue={state.contextoExtra?.licencaVencida ?? false}
                    helper="Hoje influencia a leitura humana da triagem, não o payload."
                  />
                  <BooleanSelect
                    id="temOutorgaAnterior"
                    name="temOutorgaAnterior"
                    label="Tem outorga anterior?"
                    defaultValue={state.payload?.temOutorgaAnterior ?? false}
                    helper="Campo enviado ao backend como temOutorgaAnterior."
                  />
                  <BooleanSelect
                    id="possuiPgrs"
                    name="possuiPgrs"
                    label="Possui PGRS?"
                    defaultValue={state.contextoExtra?.possuiPgrs ?? false}
                    helper="Sinal complementar interno, sem envio automático ao backend."
                  />
                  <div className="md:col-span-2">
                    <BooleanSelect
                      id="possuiAutoInfracao"
                      name="possuiAutoInfracao"
                      label="Possui auto de infração?"
                      defaultValue={state.contextoExtra?.possuiAutoInfracao ?? false}
                      helper="Sinal comercial interno para reforçar urgência e abordagem consultiva."
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed bg-background/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Payload automatizado desta onda</p>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
{JSON.stringify(
  {
    cnaes: state.payload?.cnaes ?? ['4731-8/00'],
    uf: state.payload?.uf ?? 'GO',
    municipio: state.payload?.municipio ?? 'Goiânia',
    porte: state.payload?.porte ?? 'MEDIO',
    situacao: state.payload?.situacao ?? 'IRREGULAR',
    temLicencaAnterior: state.payload?.temLicencaAnterior ?? false,
    temOutorgaAnterior: state.payload?.temOutorgaAnterior ?? false,
  },
  null,
  2,
)}
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              O frontend nunca exibe custo interno, margem ou metadata do catálogo.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {pending ? 'Executando triagem...' : 'Executar triagem'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {state.resultado && state.payload ? (
          <form action={proposalAction} className="space-y-3">
            <input type="hidden" name="cnaePrincipal" value={state.payload.cnaes.join(', ')} />
            <input type="hidden" name="uf" value={state.payload.uf} />
            <input type="hidden" name="municipio" value={state.payload.municipio ?? ''} />
            <input type="hidden" name="porte" value={state.payload.porte} />
            <input type="hidden" name="situacao" value={state.payload.situacao} />
            <input
              type="hidden"
              name="temLicencaAnterior"
              value={String(state.payload.temLicencaAnterior ?? false)}
            />
            <input
              type="hidden"
              name="temOutorgaAnterior"
              value={String(state.payload.temOutorgaAnterior ?? false)}
            />

            {proposalState.propostaError ? (
              <Alert variant="destructive">
                <BadgeAlert className="h-4 w-4" />
                <AlertTitle>Falha ao gerar proposta</AlertTitle>
                <AlertDescription>{proposalState.propostaError}</AlertDescription>
              </Alert>
            ) : null}

            <button
              type="submit"
              disabled={proposalPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {proposalPending ? 'Gerando proposta...' : 'Gerar proposta'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : null}

        <div className="space-y-6">
          <Card className="rounded-3xl border-dashed bg-card/80">
            <CardHeader>
              <CardTitle className="text-xl">Leitura preliminar</CardTitle>
              <CardDescription>
                A triagem consolida risco, enquadramento e potencial de receita a partir do diagnóstico já validado no backend.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!state.resultado ? (
                <div className="rounded-2xl border bg-muted/20 p-5 text-sm text-muted-foreground">
                  Informe o cenário do lead e execute a triagem para liberar score, serviços sugeridos, alertas e próximos passos.
                </div>
              ) : (
                <div className="space-y-6">
                  {proposalState.proposta ? (
                    <Card className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <CardHeader>
                        <CardTitle>Proposta criada com sucesso</CardTitle>
                        <CardDescription>Confira os dados abaixo e use o link para visualizar a proposta.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Número</p>
                            <p className="text-sm font-semibold">{proposalState.proposta.numero}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Status</p>
                            <p className="text-sm font-semibold">{proposalState.proposta.status}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total base</p>
                            <p className="text-sm font-semibold">{moeda(proposalState.proposta.totalBase)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Faixa</p>
                            <p className="text-sm font-semibold">{moeda(proposalState.proposta.totalMinimo)} – {moeda(proposalState.proposta.totalMaximo)}</p>
                          </div>
                        </div>
                        <Link
                          href={`/comercial/propostas/${proposalState.proposta.id}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                        >
                          Ver proposta
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </CardContent>
                    </Card>
                  ) : null}

                  {state.limitedCoverage && (
                    <Alert className="border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Cobertura limitada do CNAE</AlertTitle>
                      <AlertDescription>
                        O backend identificou este cenário como não mapeado em detalhe. Use a resposta como triagem preliminar e complemente
                        a análise antes de avançar para proposta técnica.
                      </AlertDescription>
                    </Alert>
                  )}

                  {contextoSinalizado.length > 0 && (
                    <Alert className="border-blue-200 bg-blue-50 text-blue-950 [&>svg]:text-blue-700">
                      <FileSearch className="h-4 w-4" />
                      <AlertTitle>Contexto complementar informado</AlertTitle>
                      <AlertDescription>
                        Estes sinais ajudam a leitura comercial desta tela, mas ainda não entram no payload automatizado do diagnóstico.
                        <div className="mt-3 flex flex-wrap gap-2">
                          {contextoSinalizado.map(([key]) => (
                            <Badge key={key} variant="info">
                              {CONTEXTO_EXTRA_LABELS[key as keyof typeof CONTEXTO_EXTRA_LABELS]}
                            </Badge>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4 md:grid-cols-3">
                    <KpiCard
                      icon={ShieldAlert}
                      label="Risco estimado"
                      value={state.resultado.riscoGeral.nivel}
                      hint={state.resultado.riscoGeral.justificativa}
                      badgeVariant={riscoVariant(state.resultado.riscoGeral.nivel)}
                    />
                    <KpiCard
                      icon={Radar}
                      label="Score"
                      value={String(state.resultado.riscoGeral.score)}
                      hint={`CNAE ${state.resultado.cnaePrincipal.codigo}`}
                    />
                    <KpiCard
                      icon={MapPinned}
                      label="Cobertura"
                      value={state.limitedCoverage ? 'Parcial' : 'Mapeada'}
                      hint={state.resultado.cnaePrincipal.descricao}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <SurfaceStat
                      title="Faixa estimada"
                      lines={[
                        ['Mínimo', moeda(state.resultado.estimativaOrcamento.minimo)],
                        ['Recomendado', moeda(state.resultado.estimativaOrcamento.recomendado)],
                        ['Máximo', moeda(state.resultado.estimativaOrcamento.maximo)],
                      ]}
                    />
                    <SurfaceStat
                      title="Enquadramento"
                      lines={[
                        ['Esfera', state.resultado.enquadramento.esfera],
                        ['Órgão', state.resultado.enquadramento.orgaoCompetente],
                        ['Rito', state.resultado.enquadramento.licenciamentoTipo],
                      ]}
                    />
                  </div>

                  <Card className="rounded-2xl border bg-background shadow-none">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Serviços sugeridos</CardTitle>
                      <CardDescription>
                        Lista gerada a partir do catálogo oficial já sanitizado no backend.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {state.resultado.recomendacoes.map((servico) => (
                        <article key={servico.servicoId} className="rounded-2xl border bg-muted/20 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={decisaoVariant(servico.decisao)}>
                                  {DECISAO_LABEL[servico.decisao] ?? servico.decisao}
                                </Badge>
                                <span className="rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                  {servico.codigo}
                                </span>
                              </div>
                              <h3 className="mt-3 text-sm font-semibold">{servico.nome}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">{servico.categoria}</p>
                            </div>
                            <div className="rounded-xl border bg-background px-3 py-2 text-right">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Faixa</p>
                              <p className="mt-1 text-sm font-bold">{moeda(servico.precoEstimado)}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {moeda(servico.precoMinimo)} a {moeda(servico.precoMaximo)}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">{servico.justificativa}</p>
                        </article>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="grid gap-4">
                    <InsightCard
                      icon={BadgeAlert}
                      title="Alertas imediatos"
                      items={state.resultado.alertas}
                      emptyLabel="Sem alertas críticos para este cenário."
                      tone="danger"
                    />
                    <InsightCard
                      icon={ClipboardList}
                      title="Próximos passos"
                      items={state.resultado.proximosPassos}
                      emptyLabel="Sem próximos passos sugeridos."
                      tone="default"
                    />
                  </div>

                  <Card className="rounded-2xl border bg-background shadow-none">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Obrigatoriedades e impactos</CardTitle>
                      <CardDescription>
                        Leitura operacional para alinhar abordagem comercial e passagem para a equipe técnica.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={state.resultado.obrigatoriedades.necessitaEIA ? 'warning' : 'outline'}>
                          {state.resultado.obrigatoriedades.necessitaEIA ? 'Necessita EIA' : 'Sem EIA obrigatório'}
                        </Badge>
                        <Badge variant={state.resultado.obrigatoriedades.necessitaOutorga ? 'warning' : 'outline'}>
                          {state.resultado.obrigatoriedades.necessitaOutorga ? 'Necessita outorga' : 'Sem outorga obrigatória'}
                        </Badge>
                        <Badge variant={state.resultado.obrigatoriedades.necessitaMonitoramento ? 'info' : 'outline'}>
                          {state.resultado.obrigatoriedades.necessitaMonitoramento ? 'Exige monitoramento' : 'Sem monitoramento base'}
                        </Badge>
                      </div>

                      <div className="grid gap-2">
                        {state.resultado.obrigatoriedades.principaisImpactos.map((impacto) => (
                          <div key={impacto} className="flex items-start gap-2 rounded-xl border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                            <ChevronRight className="mt-0.5 h-4 w-4 text-primary" />
                            <span>{impacto}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function HeroMiniCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-4 backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}

function Field({
  id,
  label,
  children,
  hint,
  required,
  className,
}: {
  id: string
  label: string
  children: React.ReactNode
  hint?: string
  required?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function BooleanSelect({
  id,
  name,
  label,
  defaultValue,
  helper,
}: {
  id: string
  name: string
  label: string
  defaultValue: boolean
  helper: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ? 'true' : 'false'}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="false">Não</option>
        <option value="true">Sim</option>
      </select>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  badgeVariant,
}: {
  icon: typeof ShieldAlert
  label: string
  value: string
  hint: string
  badgeVariant?: 'success' | 'info' | 'warning' | 'destructive' | 'outline'
}) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
        {badgeVariant ? <Badge variant={badgeVariant}>{value}</Badge> : null}
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {!badgeVariant ? <p className="mt-1 text-2xl font-black tracking-tight">{value}</p> : null}
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
    </div>
  )
}

function SurfaceStat({
  title,
  lines,
}: {
  title: string
  lines: Array<[string, string]>
}) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <div className="mt-4 space-y-3">
        {lines.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-right text-sm font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightCard({
  icon: Icon,
  title,
  items,
  emptyLabel,
  tone,
}: {
  icon: typeof AlertTriangle
  title: string
  items: string[]
  emptyLabel: string
  tone: 'danger' | 'default'
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-200 bg-red-50/60 text-red-950'
      : 'border-border bg-background text-foreground'

  const iconClass = tone === 'danger' ? 'text-red-700' : 'text-primary'

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <div key={item} className="rounded-xl border border-current/10 bg-background/70 px-3 py-3 text-sm leading-6">
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
