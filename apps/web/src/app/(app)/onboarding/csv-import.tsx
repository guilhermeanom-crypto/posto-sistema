'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { importarEmpreendimentosAction, type EmpresaImport } from './actions'

interface Props {
  empresaId: string
  onClose: () => void
}

// Cabeçalhos esperados no CSV (lowercase, normalizado)
const HEADERS_MAP: Record<string, keyof EmpresaImport> = {
  nome: 'nome',
  nomefantasia: 'nomeFantasia',
  nome_fantasia: 'nomeFantasia',
  cnpj: 'cnpj',
  bandeira: 'bandeira',
  tipo: 'tipo',
  logradouro: 'logradouro',
  numero: 'numero',
  número: 'numero',
  complemento: 'complemento',
  bairro: 'bairro',
  cidade: 'cidade',
  estado: 'estado',
  uf: 'estado',
  cep: 'cep',
}

function parseCSV(text: string): { rows: EmpresaImport[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { rows: [], errors: ['Arquivo CSV deve ter ao menos 2 linhas (cabeçalho + dados).'] }

  const header = lines[0]!.split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ''))
  const rows: EmpresaImport[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    const obj: Record<string, string> = {}
    header.forEach((h, idx) => { obj[h] = cells[idx] ?? '' })

    const mapped: Partial<EmpresaImport> = {}
    for (const [raw, field] of Object.entries(HEADERS_MAP)) {
      if (obj[raw] !== undefined && obj[raw] !== '') {
        (mapped as Record<string, string>)[field] = obj[raw]!
      }
    }

    if (!mapped.nome || !mapped.logradouro || !mapped.numero || !mapped.bairro || !mapped.cidade || !mapped.estado || !mapped.cep) {
      errors.push(`Linha ${i + 1}: campos obrigatórios faltando (nome, logradouro, numero, bairro, cidade, estado, cep)`)
      continue
    }

    rows.push(mapped as EmpresaImport)
  }

  return { rows, errors }
}

export function CSVImport({ empresaId, onClose }: Props) {
  const [parsed, setParsed] = useState<EmpresaImport[] | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [resultado, setResultado] = useState<{ criados: number; erros: { linha: number; erro: string }[]; mensagem: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows, errors } = parseCSV(text)
      setParsed(rows)
      setParseErrors(errors)
      setResultado(null)
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleImport() {
    if (!parsed || parsed.length === 0) return
    startTransition(async () => {
      const res = await importarEmpreendimentosAction(empresaId, parsed)
      setResultado(res.data)
      if (res.data.criados > 0) router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Importar Postos via CSV</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Instruções */}
          <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-2">
            <p className="font-medium">Formato esperado (CSV separado por vírgula):</p>
            <code className="block text-[11px] bg-muted rounded p-2 overflow-x-auto whitespace-nowrap">
              nome,nomeFantasia,cnpj,bandeira,tipo,logradouro,numero,bairro,cidade,estado,cep
            </code>
            <p className="text-xs text-muted-foreground">
              Campos obrigatórios: <strong>nome, logradouro, numero, bairro, cidade, estado, cep</strong>.
              Tipos válidos: revendedor, distribuidor, transportador, outros.
            </p>
          </div>

          {/* Upload */}
          {!parsed && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">Clique para selecionar o arquivo CSV</span>
              <span className="text-xs text-muted-foreground mt-1">.csv · UTF-8</span>
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            </label>
          )}

          {/* Erros de parse */}
          {parseErrors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-1">
              {parseErrors.map((e, i) => (
                <p key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {e}
                </p>
              ))}
            </div>
          )}

          {/* Preview */}
          {parsed && parsed.length > 0 && !resultado && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{parsed.length} posto(s) reconhecido(s):</p>
              <div className="rounded-xl border overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 sticky top-0">
                      <tr>
                        {['Nome', 'Bandeira', 'Cidade', 'UF', 'CEP'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsed.map((r, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{r.nomeFantasia ?? r.nome}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.bandeira ?? '—'}</td>
                          <td className="px-3 py-2">{r.cidade}</td>
                          <td className="px-3 py-2">{r.estado}</td>
                          <td className="px-3 py-2 font-mono">{r.cep}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div className={`rounded-xl border p-4 space-y-2 ${resultado.criados > 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="font-semibold text-sm">{resultado.mensagem}</p>
              </div>
              {resultado.erros.length > 0 && resultado.erros.map((e) => (
                <p key={e.linha} className="text-xs text-red-700">Linha {e.linha}: {e.erro}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t gap-3">
          {parsed && !resultado && (
            <button
              type="button"
              onClick={() => { setParsed(null); setParseErrors([]) }}
              className="text-sm text-muted-foreground hover:underline"
            >
              Trocar arquivo
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-xl hover:bg-muted">
              {resultado ? 'Fechar' : 'Cancelar'}
            </button>
            {parsed && parsed.length > 0 && !resultado && (
              <button
                onClick={handleImport}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 font-medium"
              >
                {isPending ? 'Importando...' : `Importar ${parsed.length} posto(s)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
