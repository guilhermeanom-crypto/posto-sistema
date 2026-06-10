import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { GraduationCap, Shield } from 'lucide-react'
import { CriarTipoForm } from './criar-tipo-form'

export const metadata: Metadata = { title: 'Tipos de Treinamento — Matriz SST' }

interface TreinamentoTipo {
  id: string
  nome: string
  normativa: string
  cargaHoraria: number
  periodicidadeMeses: number
  obrigatorioParaCargos: string[]
  ativo: boolean
}

const normativaColor: Record<string, string> = {
  'NR-20': 'bg-orange-100 text-orange-800',
  'NR-35': 'bg-purple-100 text-purple-800',
  'NR-10': 'bg-yellow-100 text-yellow-800',
  'NR-12': 'bg-blue-100 text-blue-800',
  'NR-06': 'bg-teal-100 text-teal-800',
  'NR-07': 'bg-green-100 text-green-800',
  'CIPA':  'bg-pink-100 text-pink-800',
  'BRIGADA': 'bg-red-100 text-red-800',
}

export default async function TiposTreinamentoPage() {
  const token = await getAccessToken()
  let tipos: TreinamentoTipo[] = []

  if (token) {
    try {
      const res = await api.get<{ data: TreinamentoTipo[] }>('/sst/treinamentos/tipos', token)
      tipos = res.data
    } catch {}
  }

  const ativos = tipos.filter((t) => t.ativo)
  const cargosSet = new Set<string>()
  for (const t of ativos) {
    for (const c of t.obrigatorioParaCargos) cargosSet.add(c)
  }
  const cargos = [...cargosSet].sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/sst" className="hover:underline">SST</Link>
        <span>/</span>
        <Link href="/sst/treinamentos" className="hover:underline">Treinamentos</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Tipos / NRs</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-purple-600" />
            Tipos de Treinamento
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{ativos.length} tipo{ativos.length !== 1 ? 's' : ''} ativo{ativos.length !== 1 ? 's' : ''}</p>
        </div>
        <CriarTipoForm />
      </div>

      {/* Lista de tipos */}
      <div className="rounded-lg border bg-card divide-y">
        {tipos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum tipo cadastrado.</div>
        ) : (
          tipos.map((t) => (
            <div key={t.id} className={`px-4 py-3 space-y-1 ${!t.ativo ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${normativaColor[t.normativa] ?? 'bg-gray-100 text-gray-700'}`}>
                    {t.normativa}
                  </span>
                  <span className="text-sm font-medium">{t.nome}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{t.cargaHoraria}h</span>
                  <span>{t.periodicidadeMeses > 0 ? `Reciclagem: ${t.periodicidadeMeses}m` : 'Única'}</span>
                  {!t.ativo && <span className="text-red-500">Inativo</span>}
                </div>
              </div>
              {t.obrigatorioParaCargos.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Shield className="h-3 w-3 text-orange-500" />
                  <span className="text-[10px] text-muted-foreground">Obrigatório:</span>
                  {t.obrigatorioParaCargos.map((c) => (
                    <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-medium">{c}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Matriz de obrigatoriedade */}
      {cargos.length > 0 && ativos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Matriz de Obrigatoriedade
          </h2>
          <p className="text-xs text-muted-foreground">Cruzamento automático: tipos de treinamento x cargos obrigatórios</p>

          <div className="rounded-lg border bg-card overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground sticky left-0 bg-muted/50">Treinamento</th>
                  {cargos.map((c) => (
                    <th key={c} className="text-center px-2 py-2 font-medium text-muted-foreground whitespace-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {ativos.filter((t) => t.obrigatorioParaCargos.length > 0).map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium sticky left-0 bg-white whitespace-nowrap">
                      <span className={`text-[10px] px-1 py-0.5 rounded font-mono ${normativaColor[t.normativa] ?? 'bg-gray-100'}`}>{t.normativa}</span>
                      <span className="ml-1.5">{t.nome}</span>
                    </td>
                    {cargos.map((c) => {
                      const obrigatorio = t.obrigatorioParaCargos.some((oc) => oc.toLowerCase() === c.toLowerCase())
                      return (
                        <td key={c} className="text-center px-2 py-2">
                          {obrigatorio ? (
                            <span className="inline-block h-4 w-4 rounded-full bg-orange-500 text-white text-[10px] leading-4 font-bold">!</span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
