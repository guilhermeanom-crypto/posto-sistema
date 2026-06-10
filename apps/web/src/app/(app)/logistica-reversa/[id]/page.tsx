import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/date'
import { StatusMTRActions } from './status-actions'
import { CCRForm } from './ccr-form'

export const metadata: Metadata = { title: 'MTR — Logística Reversa' }

interface Props { params: Promise<{ id: string }> }

interface CCR {
  id: string
  numeroCCR: string | null
  tipoResiduo: string
  quantidadeKg: string
  destinador: string
  cnpjDestinador: string | null
  dataDestinacao: string
  tecnologiaUso: string | null
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ABERTO:    { label: 'Aberto',    color: 'bg-blue-100 text-blue-800' },
  COLETADO:  { label: 'Coletado',  color: 'bg-yellow-100 text-yellow-800' },
  DESTINADO: { label: 'Destinado', color: 'bg-purple-100 text-purple-800' },
  ENCERRADO: { label: 'Encerrado', color: 'bg-green-100 text-green-800' },
}

const proximoStatus: Record<string, { label: string; next: string }> = {
  ABERTO:    { label: 'Marcar como Coletado',  next: 'COLETADO' },
  COLETADO:  { label: 'Marcar como Destinado', next: 'DESTINADO' },
  DESTINADO: { label: 'Encerrar MTR',          next: 'ENCERRADO' },
}

const tecnologiaLabel: Record<string, string> = {
  COPROCESSAMENTO: 'Coprocessamento',
  RECICLAGEM: 'Reciclagem',
  INCINERACAO: 'Incineração',
  ATERRO: 'Aterro Industrial',
  OUTROS: 'Outros',
}

export default async function MTRDetailPage({ params }: Props) {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) return null

  let mtr: any = null
  let ccrs: CCR[] = []

  try {
    const [mtrRes, ccrRes] = await Promise.all([
      api.get<{ data: any }>(`/logistica-reversa/mtrs/${id}`, token),
      api.get<{ data: CCR[] }>(`/logistica-reversa/mtrs/${id}/ccrs`, token),
    ])
    mtr = mtrRes.data
    ccrs = ccrRes.data
  } catch {
    notFound()
  }

  const sc = statusConfig[mtr.status] ?? { label: mtr.status, color: 'bg-gray-100 text-gray-600' }
  const prox = proximoStatus[mtr.status]
  const residuos: any[] = Array.isArray(mtr.residuos) ? mtr.residuos : []
  const podeRegistrarCCR = ['COLETADO', 'DESTINADO', 'ENCERRADO'].includes(mtr.status)

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/logistica-reversa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Logística Reversa
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            MTR {mtr.numeroMTR ?? mtr.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/empreendimentos/${mtr.empreendimento.id}`} className="hover:underline">
              {mtr.empreendimento.nome}
            </Link>
            {mtr.empreendimento.cidade && ` · ${mtr.empreendimento.cidade}, ${mtr.empreendimento.estado}`}
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium flex-shrink-0 ${sc.color}`}>
          {sc.label}
        </span>
      </div>

      {/* Ações de status */}
      {prox && <StatusMTRActions mtrId={id} nextStatus={prox.next} nextLabel={prox.label} />}

      {/* Dados */}
      <div className="rounded-lg border bg-card p-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Data emissão',   value: formatDate(mtr.dataEmissao) },
          { label: 'Data coleta',    value: formatDate(mtr.dataColeta) },
          { label: 'Transportadora', value: mtr.transportadora?.nome },
          { label: 'CNPJ transp.',   value: mtr.transportadora?.cnpj },
          { label: 'Qtd. tipos',     value: `${residuos.length} tipo(s)` },
          { label: 'CCRs emitidos',  value: String(ccrs.length) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Resíduos */}
      {residuos.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Resíduos</h2>
          </div>
          <div className="divide-y">
            {residuos.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{r.tipo}</p>
                  {r.destinacao && <p className="text-xs text-muted-foreground mt-0.5">Destinação: {r.destinacao}</p>}
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {Number(r.quantidade).toLocaleString('pt-BR')} {r.unidade}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CCRs — Certificados de Destinação */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">CCRs — Destinação Final</h2>
          <span className="text-xs text-muted-foreground">{ccrs.length} certificado{ccrs.length !== 1 ? 's' : ''}</span>
        </div>

        {ccrs.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum CCR registrado.
          </div>
        ) : (
          <div className="divide-y">
            {ccrs.map((ccr) => (
              <div key={ccr.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {ccr.numeroCCR && (
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{ccr.numeroCCR}</span>
                      )}
                      <span className="text-sm font-medium">{ccr.tipoResiduo.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ccr.destinador}
                      {ccr.cnpjDestinador && ` · CNPJ: ${ccr.cnpjDestinador}`}
                    </p>
                    {ccr.tecnologiaUso && (
                      <p className="text-xs text-muted-foreground">{tecnologiaLabel[ccr.tecnologiaUso] ?? ccr.tecnologiaUso}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold tabular-nums">{parseFloat(ccr.quantidadeKg).toLocaleString('pt-BR')} kg</p>
                    <p className="text-xs text-muted-foreground">{formatDate(ccr.dataDestinacao)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form inline para adicionar CCR */}
        {podeRegistrarCCR && (
          <div className="border-t px-4 py-4 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Registrar CCR</p>
            <CCRForm mtrId={id} residuos={residuos.map((r: any) => r.tipo)} />
          </div>
        )}

        {!podeRegistrarCCR && (
          <div className="border-t px-4 py-3 bg-muted/20">
            <p className="text-xs text-muted-foreground">Avance o status para COLETADO ou superior para registrar CCRs.</p>
          </div>
        )}
      </div>

      {/* Observações */}
      {mtr.observacoes && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium mb-1">Observações</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{mtr.observacoes}</p>
        </div>
      )}
    </div>
  )
}
