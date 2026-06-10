import type { Metadata } from 'next'
import Link from 'next/link'
import { Building, ClipboardList, FileText, Bell } from 'lucide-react'
import { getAccessToken, getSessao } from '@/lib/auth'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Configurações' }

export default async function ConfigPage() {
  const [token, sessao] = await Promise.all([getAccessToken(), getSessao()])

  if (!sessao || !['ADMIN_TENANT', 'SUPER_ADMIN'].includes(sessao.perfil)) {
    redirect('/dashboard')
  }

  let orgaos: any[] = []
  let tiposProcesso: any[] = []
  let tiposDocumento: any[] = []

  if (token) {
    try {
      const [orgRes, procRes, docRes] = await Promise.all([
        api.get<{ data: any[] }>('/config/orgaos?limit=50', token),
        api.get<{ data: any[] }>('/config/tipos-processo?limit=50', token),
        api.get<{ data: any[] }>('/config/tipos-documento?limit=50', token),
      ])
      orgaos = orgRes.data
      tiposProcesso = procRes.data
      tiposDocumento = docRes.data
    } catch {}
  }

  const esferaLabel: Record<string, string> = {
    FEDERAL: 'Federal', ESTADUAL: 'Estadual', MUNICIPAL: 'Municipal',
  }

  const categoriaProcessoLabel: Record<string, string> = {
    LICENCA: 'Licença', AUTORIZACAO: 'Autorização', CERTIFICACAO: 'Certificação',
    REGISTRO: 'Registro', CADASTRO: 'Cadastro', RENOVACAO: 'Renovação',
    ADITAMENTO: 'Aditamento', CANCELAMENTO: 'Cancelamento',
  }

  const categoriaDocumentoLabel: Record<string, string> = {
    LICENCA: 'Licença', ALVARA: 'Alvará', CERTIFICADO: 'Certificado',
    LAUDO: 'Laudo', RELATORIO: 'Relatório', ART_RRT: 'ART/RRT',
    CONTRATO: 'Contrato', DOCUMENTO_SOCIETARIO: 'Doc. Societário',
    COMPROVANTE: 'Comprovante', DECLARACAO: 'Declaração', OUTROS: 'Outros',
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações"
        description="Gerencie órgãos reguladores, tipos de processo e tipos de documento."
      />

      {/* Notificações */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Regras de Notificação</h2>
          </div>
          <Link
            href="/config/notificacoes"
            className="text-xs text-primary hover:underline"
          >
            Gerenciar regras →
          </Link>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
          Configure alertas automáticos por módulo — prazos de documentos, processos, condicionantes e mais.
        </div>
      </section>

      {/* Órgãos Reguladores */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Órgãos Reguladores ({orgaos.length})</h2>
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          {orgaos.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum órgão cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome / Sigla</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Esfera</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">UF</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orgaos.map((org) => (
                  <tr key={org.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{org.nome}</p>
                      <p className="text-xs text-muted-foreground">{org.sigla}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{esferaLabel[org.esfera] ?? org.esfera}</td>
                    <td className="px-4 py-3 text-muted-foreground">{org.estadoUf ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{org.tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Tipos de Processo */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Tipos de Processo ({tiposProcesso.length})</h2>
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          {tiposProcesso.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum tipo de processo cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Órgão</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Antecedência</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tiposProcesso.map((tp) => (
                  <tr key={tp.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[240px]">{tp.nome}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tp.orgao?.sigla ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {categoriaProcessoLabel[tp.categoria] ?? tp.categoria}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tp.diasAntecedenciaRenovacao}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Tipos de Documento */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Tipos de Documento ({tiposDocumento.length})</h2>
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          {tiposDocumento.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum tipo de documento cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Validade Média</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Formatos</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tiposDocumento.map((td) => (
                  <tr key={td.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[240px]">{td.nome}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {categoriaDocumentoLabel[td.categoria] ?? td.categoria}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {td.validadeMediaMeses ? `${td.validadeMediaMeses} meses` : 'Sem validade'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {td.formatosAceitos?.join(', ') ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
