import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Bell } from 'lucide-react'
import { getAccessToken, getSessao } from '@/lib/auth'
import { api } from '@/lib/api'
import { redirect } from 'next/navigation'
import { RegraForm } from './regra-form'
import { ToggleRegra, DeletarRegra } from './regra-actions'

export const metadata: Metadata = { title: 'Regras de Notificação' }

interface RegraAutomatica {
  id: string
  nome: string
  descricao: string | null
  tipo: string
  ativo: boolean
  acao: string
  gatilho: { diasAntes: number }
  parametros: { perfis: string[]; canais: string[] }
  criadoEm: string
}

const tipoLabel: Record<string, string> = {
  vencimento_doc:  'Documento vencendo',
  vencimento_proc: 'Processo vencendo',
  condicionante:   'Condicionante vencendo',
  requisito:       'Requisito pendente',
  escalamento:     'Escalonamento de tarefa',
}

const acaoLabel: Record<string, string> = {
  enviar_alerta: 'Alerta no sistema',
  criar_tarefa:  'Criar tarefa',
  escalonar:     'Escalonar tarefa',
}

const perfilLabel: Record<string, string> = {
  ADMIN_TENANT: 'Admin',
  COORDENADOR:  'Coordenador',
  TECNICO:      'Técnico',
  CONSULTOR:    'Consultor',
}

const canalLabel: Record<string, string> = {
  app:       'In-app',
  email:     'E-mail',
  whatsapp:  'WhatsApp',
}

const tipoColor: Record<string, string> = {
  vencimento_doc:  'bg-orange-100 text-orange-800',
  vencimento_proc: 'bg-blue-100 text-blue-800',
  condicionante:   'bg-purple-100 text-purple-800',
  requisito:       'bg-yellow-100 text-yellow-800',
  escalamento:     'bg-red-100 text-red-800',
}

export default async function NotificacoesConfigPage() {
  const [token, sessao] = await Promise.all([getAccessToken(), getSessao()])

  if (!sessao || !['ADMIN_TENANT', 'SUPER_ADMIN'].includes(sessao.perfil)) {
    redirect('/dashboard')
  }

  let regras: RegraAutomatica[] = []

  if (token) {
    try {
      const res = await api.get<{ data: RegraAutomatica[] }>('/config/regras', token)
      regras = res.data
    } catch {}
  }

  const ativas = regras.filter((r) => r.ativo).length

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/config"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Configurações
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regras de Notificação</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Defina quando e para quem o sistema dispara alertas automáticos por módulo.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 flex-shrink-0">
          <Bell className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-bold">{ativas}</p>
            <p className="text-xs text-muted-foreground">ativa{ativas !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Nova regra */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-sm">Nova regra</h2>
        <RegraForm />
      </div>

      {/* Lista de regras */}
      {regras.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma regra configurada. Use o formulário acima para criar a primeira.
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/20">
            <h2 className="font-semibold text-sm">{regras.length} regra{regras.length !== 1 ? 's' : ''} configurada{regras.length !== 1 ? 's' : ''}</h2>
          </div>
          <div className="divide-y">
            {regras.map((r) => (
              <div key={r.id} className={`px-5 py-4 space-y-2 ${!r.ativo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${tipoColor[r.tipo] ?? 'bg-gray-100 text-gray-700'}`}>
                      {tipoLabel[r.tipo] ?? r.tipo}
                    </span>
                    <p className="text-sm font-semibold truncate">{r.nome}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <ToggleRegra id={r.id} ativo={r.ativo} />
                    <DeletarRegra id={r.id} />
                  </div>
                </div>

                {r.descricao && (
                  <p className="text-xs text-muted-foreground">{r.descricao}</p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">{r.gatilho.diasAntes}</span> dias antes
                  </span>
                  <span>
                    Ação: <span className="font-medium text-foreground">{acaoLabel[r.acao] ?? r.acao}</span>
                  </span>
                  <span>
                    Perfis:{' '}
                    <span className="font-medium text-foreground">
                      {r.parametros.perfis.map((p) => perfilLabel[p] ?? p).join(', ')}
                    </span>
                  </span>
                  <span>
                    Canais:{' '}
                    <span className="font-medium text-foreground">
                      {r.parametros.canais.map((c) => canalLabel[c] ?? c).join(', ')}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
