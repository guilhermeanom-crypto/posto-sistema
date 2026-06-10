import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicApiBaseUrl } from '@/lib/api-base'
import { getAccessToken, getSessao } from '@/lib/auth'
import { api } from '@/lib/api'
import { UploadCard } from './upload-card'

export const metadata: Metadata = { title: 'Portal do Cliente — Documentos' }

type Momento = 'ANTES_PROCESSO' | 'DURANTE_PROCESSO' | 'APOS_EMISSAO' | null

interface VersaoResumo {
  id: string
  status: string
  criadoEm: string
  enviadoEm?: string
  motivoRejeicao?: string | null
  observacoesEnvio?: string | null
  arquivoNome?: string | null
}

interface Documento {
  id: string
  nome: string
  descricao: string | null
  status: string
  dataValidade: string | null
  versaoAtual: VersaoResumo | null
  ultimaVersao: VersaoResumo | null
  tipoDocumento: {
    id: string
    nome: string
    codigo: string | null
    momento: Momento
    descricaoCliente: string | null
  }
}

interface DashboardData {
  empreendimento: {
    nome: string
    cidade: string
    estado: string
    bandeira: string | null
  }
}

const MOMENTOS: Array<{ key: Exclude<Momento, null>; titulo: string; descricao: string }> = [
  {
    key: 'ANTES_PROCESSO',
    titulo: 'Antes do processo',
    descricao: 'Documentação societária e do imóvel que dá lastro para a abertura do processo.',
  },
  {
    key: 'DURANTE_PROCESSO',
    titulo: 'Durante o processo',
    descricao: 'Protocolos, publicações e respostas que avançam o pedido junto ao órgão.',
  },
  {
    key: 'APOS_EMISSAO',
    titulo: 'Após emissão / acompanhamento',
    descricao: 'Licença emitida e o acompanhamento de condicionantes e relatórios periódicos.',
  },
]

export default async function PortalDocumentosPage() {
  const [token, sessao] = await Promise.all([getAccessToken(), getSessao()])
  const isDemo = !token && !!sessao

  let documentos: Documento[] = []
  let dashboard: DashboardData | null = null
  let loadError: string | null = null

  if (token) {
    try {
      const [docRes, dashRes] = await Promise.all([
        api.get<{ data: Documento[] }>('/portal/documentos?limit=50', token),
        api.get<{ data: DashboardData }>('/portal/dashboard', token).catch(() => null),
      ])
      documentos = docRes.data
      dashboard = dashRes?.data ?? null
    } catch (error) {
      loadError =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os documentos do portal.'
    }
  } else {
    loadError = 'Sua sessão do portal não está disponível no momento.'
  }

  if (isDemo) {
    loadError = null
    dashboard = {
      empreendimento: {
        nome: 'Rede Posto Demo LTDA',
        cidade: 'Goiânia',
        estado: 'GO',
        bandeira: 'Bandeira branca',
      },
    }
    documentos = [
      {
        id: 'doc-demo-1',
        nome: 'Contrato social atualizado',
        descricao: 'Documento societário para abertura do processo.',
        status: 'PENDENTE',
        dataValidade: null,
        versaoAtual: null,
        ultimaVersao: null,
        tipoDocumento: {
          id: 'tipo-1',
          nome: 'Contrato social atualizado',
          codigo: 'SOC-001',
          momento: 'ANTES_PROCESSO',
          descricaoCliente: 'Envie o contrato social consolidado mais recente.',
        },
      },
      {
        id: 'doc-demo-2',
        nome: 'Licença de operação',
        descricao: 'Última licença emitida pelo órgão ambiental.',
        status: 'ENVIADO',
        dataValidade: null,
        versaoAtual: {
          id: 'versao-1',
          status: 'ENVIADA',
          criadoEm: new Date().toISOString(),
          enviadoEm: new Date().toISOString(),
          arquivoNome: 'licenca-operacao.pdf',
        },
        ultimaVersao: {
          id: 'versao-1',
          status: 'ENVIADA',
          criadoEm: new Date().toISOString(),
          enviadoEm: new Date().toISOString(),
          arquivoNome: 'licenca-operacao.pdf',
        },
        tipoDocumento: {
          id: 'tipo-2',
          nome: 'Licença de operação',
          codigo: 'AMB-010',
          momento: 'DURANTE_PROCESSO',
          descricaoCliente: 'Anexe a licença vigente do empreendimento.',
        },
      },
      {
        id: 'doc-demo-3',
        nome: 'Relatório fotográfico final',
        descricao: 'Evidências finais para encerramento.',
        status: 'A_RENOVAR',
        dataValidade: null,
        versaoAtual: null,
        ultimaVersao: null,
        tipoDocumento: {
          id: 'tipo-3',
          nome: 'Relatório fotográfico final',
          codigo: 'REL-020',
          momento: 'APOS_EMISSAO',
          descricaoCliente: 'Consolide as evidências após a emissão.',
        },
      },
    ]
  }

  const apiBase = getPublicApiBaseUrl()

  const total = documentos.length
  const pendentes = documentos.filter((d) =>
    ['PENDENTE', 'REJEITADO', 'VENCIDO', 'A_RENOVAR'].includes(d.status),
  ).length
  const enviados = documentos.filter((d) => ['ENVIADO'].includes(d.status)).length
  const emAnalise = documentos.filter((d) => ['EM_ANALISE'].includes(d.status)).length

  const semMomento = documentos.filter((d) => !d.tipoDocumento.momento)

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-900">
          <p className="font-semibold">Não conseguimos carregar o portal agora.</p>
          <p className="mt-1 leading-relaxed">
            {loadError} Você pode tentar novamente ou voltar para o login do portal.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/portal/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Entrar novamente
            </Link>
            <Link
              href="/portal/inicio"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Tentar carregar início
            </Link>
          </div>
        </div>
      )}

      {/* ── Hero do Portal ────────────────────────────────────────────────── */}
      <section className="rounded-xl border bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Portal do Cliente
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {dashboard?.empreendimento.nome ?? 'Documentos solicitados'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Acompanhe os documentos solicitados, envie anexos e justifique pendências
              diretamente pelo portal.
            </p>
            {dashboard?.empreendimento && (
              <p className="mt-3 text-xs text-muted-foreground">
                {dashboard.empreendimento.cidade}/{dashboard.empreendimento.estado}
                {dashboard.empreendimento.bandeira ? ` · ${dashboard.empreendimento.bandeira}` : ''}
                {sessao && <span className="ml-2">· Olá, {sessao.nome}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Resumo */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <ResumoTile label="Documentos solicitados" valor={total} tone="default" />
          <ResumoTile label="Pendentes" valor={pendentes} tone={pendentes > 0 ? 'warning' : 'default'} />
          <ResumoTile label="Enviados" valor={enviados} tone="info" />
          <ResumoTile label="Em análise" valor={emAnalise} tone="info" />
        </div>
      </section>

      {/* ── Aviso (se há pendência) ──────────────────────────────────────── */}
      {pendentes > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          <p className="font-medium mb-1">Ação necessária</p>
          <p>
            Há {pendentes} documento{pendentes !== 1 ? 's' : ''} aguardando envio. Anexe o arquivo,
            escreva uma justificativa (opcional) e clique em <strong>enviar</strong>. Após o envio,
            nossa equipe fará a validação.
          </p>
        </div>
      )}

      {/* ── Vazio ────────────────────────────────────────────────────────── */}
      {total === 0 && !loadError && (
        <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
          Nenhum documento solicitado para este empreendimento ainda.
          <br />
          <span className="mt-1 block text-xs">Entre em contato com a equipe Hábilis.</span>
        </div>
      )}

      {/* ── Documentos por momento ───────────────────────────────────────── */}
      {!loadError && MOMENTOS.map((momento) => {
        const docsDoMomento = documentos.filter((d) => d.tipoDocumento.momento === momento.key)
        if (docsDoMomento.length === 0) return null

        return (
          <section key={momento.key} className="space-y-3">
            <header className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  {momento.titulo}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{momento.descricao}</p>
              </div>
              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                {docsDoMomento.length}
              </span>
            </header>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {docsDoMomento.map((doc) => (
                <UploadCard key={doc.id} doc={doc} apiBase={apiBase} token={token ?? ''} />
              ))}
            </div>
          </section>
        )
      })}

      {/* ── Documentos sem momento (legado) ──────────────────────────────── */}
      {!loadError && semMomento.length > 0 && (
        <section className="space-y-3">
          <header className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground">Outros documentos</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Documentos sem classificação por momento (cadastrados antes do Portal do Cliente).
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
              {semMomento.length}
            </span>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {semMomento.map((doc) => (
              <UploadCard key={doc.id} doc={doc} apiBase={apiBase} token={token ?? ''} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ResumoTile({
  label,
  valor,
  tone,
}: {
  label: string
  valor: number
  tone: 'default' | 'warning' | 'info'
}) {
  const valorColor =
    tone === 'warning'
      ? 'text-orange-600'
      : tone === 'info'
        ? 'text-blue-700'
        : 'text-foreground'
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className={`text-2xl font-bold tabular-nums ${valorColor}`}>{valor}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  )
}
