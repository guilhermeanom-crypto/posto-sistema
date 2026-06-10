import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  BookOpen,
  Building2,
  ClipboardList,
  FileSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { getPublicApiBaseUrl } from '@/lib/api-base'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { AssistenteForm } from './assistente-form'
import { PlaybooksWorkspace, type PlaybookModule } from './playbooks-workspace'
import playbooksFallback from './playbooks-fallback.json'

export const metadata: Metadata = { title: 'Assistente Hábilis' }

interface ModuloResumo {
  id: string
  modulo: string
  categoria: string
}

const KPIS = [
  { label: 'Modelos de vínculo', value: '3', hint: 'cliente, terceiros, órgão', icon: Building2 },
  { label: 'Blocos críticos', value: '7', hint: 'documentos, riscos e prazos', icon: AlertTriangle },
  { label: 'Responsáveis', value: '6', hint: 'Hábilis, cliente, terceiros e órgão', icon: ShieldCheck },
  { label: 'Demo local', value: '100%', hint: 'consulta sem IA externa', icon: Sparkles },
] as const

const FLOW = [
  'Pergunta',
  'Varredura',
  'Resposta',
  'Responsabilidade',
  'Fonte interna',
] as const

function normalizeFallbackPlaybooks(input: typeof playbooksFallback): PlaybookModule[] {
  return input.map((item) => ({
    slug: item.slug,
    title: item.title,
    short: item.short,
    category: item.category,
    summary: item.summary,
    preview: item.preview,
    page_count: item.page_count,
    char_count: item.char_count,
    archived: item.archived,
    file: item.file,
    checklist: item.checklist,
    entregaveis: item.entregaveis,
    terceiros: item.terceiros,
    riscos: item.riscos,
    responsabilidades: item.responsabilidades,
    pages: item.pages,
  }))
}

export default async function AssistenteHabilisPage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  let modulos: ModuloResumo[] = []
  const playbooks = normalizeFallbackPlaybooks(playbooksFallback)
  try {
    const res = await api.get<{ data: ModuloResumo[]; total: number }>('/conhecimento/modulos', token)
    modulos = res.data
  } catch {
    modulos = []
  }

  const apiBase = getPublicApiBaseUrl()

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(#d9dee7_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
        <div className="relative grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                Base técnica de conformidade
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Assistente Técnico Hábilis
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                Consulte a base interna de postos para responder perguntas operacionais,
                organizar checklist, antecipar terceiros e alinhar responsabilidades sem
                depender de busca manual em PDFs.
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <p className="font-semibold">Base demonstrativa em validação interna</p>
                  <p className="mt-1 leading-6 text-red-700">
                    As respostas devem ser confirmadas conforme órgão, município, escopo
                    contratado e documentação do cliente.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Módulos internos"
                value={String(modulos.length)}
                hint="base de postos estruturada"
                icon={BookOpen}
              />
              {KPIS.map((item) => (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  hint={item.hint}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-[linear-gradient(135deg,#fff7ef_0%,#fffdf9_52%,#f7fafc_100%)] p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Fluxo de resposta
            </p>
            <div className="mt-5 space-y-3">
              {FLOW.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-xl border bg-white px-3 py-3"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{step}</p>
                    <p className="text-xs text-muted-foreground">
                      {index === 0 && 'A pergunta entra em linguagem natural.'}
                      {index === 1 && 'O motor cruza módulos, checklists e riscos.'}
                      {index === 2 && 'Entrega resposta objetiva e acionável.'}
                      {index === 3 && 'Expõe quem faz o quê sem ruído.'}
                      {index === 4 && 'Mostra a origem interna de referência.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border bg-[linear-gradient(135deg,#fff7ef_0%,#fffdf9_52%,#f7fafc_100%)] p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Workspace principal
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                Conteúdo integral + resposta operacional no mesmo fluxo
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A consulta principal agora acontece dentro dos playbooks auditados. Você pode abrir
                um módulo, perguntar sobre ele e voltar direto para o conteúdo-fonte sem sair da
                mesma área de trabalho.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoCard
                icon={ClipboardList}
                title="Pergunta contextual"
                body="A resposta respeita o módulo aberto ou varre todos os playbooks ativos."
                dark
              />
              <InfoCard
                icon={FileSearch}
                title="Base em JSON"
                body="Resumo, páginas, checklist, riscos e terceiros alimentam a resposta."
                dark
              />
              <InfoCard
                icon={ShieldCheck}
                title="Ação imediata"
                body="Depois da resposta, você abre o módulo-fonte e segue a leitura operacional."
                dark
              />
            </div>
          </div>
        </div>

        <PlaybooksWorkspace playbooks={playbooks} />
      </section>

      <section className="rounded-2xl border bg-slate-50/80 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Base complementar
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
              Consulta rápida da KB operacional de postos
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Esta segunda consulta continua útil para perguntas curtas e triagem geral. A diferença
              é que a leitura principal dos playbooks agora vive acima, no fluxo central do
              assistente.
            </p>
          </div>
          <div className="rounded-xl border bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm">
            Use quando a pergunta não depender da estrutura integral dos playbooks.
          </div>
        </div>

        <AssistenteForm
          token={token}
          apiBase={apiBase}
          modulos={modulos}
        />
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: typeof BookOpen
}) {
  return (
    <div className="rounded-xl border bg-white/95 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  body,
  dark = false,
}: {
  icon: typeof BookOpen
  title: string
  body: string
  dark?: boolean
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${
      dark ? 'bg-white shadow-none' : 'bg-white'
    }`}>
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${
        dark ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      <h2 className={`mt-4 text-base font-semibold tracking-tight ${
        dark ? 'text-foreground' : 'text-foreground'
      }`}>{title}</h2>
      <p className={`mt-2 text-sm leading-6 ${
        dark ? 'text-muted-foreground' : 'text-muted-foreground'
      }`}>{body}</p>
    </div>
  )
}
