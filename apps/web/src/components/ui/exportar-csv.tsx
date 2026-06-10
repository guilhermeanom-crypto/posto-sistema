'use client'

import { Download } from 'lucide-react'

interface Props {
  dados: Record<string, unknown>[]
  nomeArquivo: string
  className?: string
}

function gerarCSV(dados: Record<string, unknown>[]): string {
  if (dados.length === 0) return ''
  const headers = Object.keys(dados[0]!)
  const linhas = dados.map((row) =>
    headers.map((h) => {
      const val = row[h]
      const str = val === null || val === undefined ? '' : String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(','),
  )
  return [headers.join(','), ...linhas].join('\n')
}

export function ExportarCSV({ dados, nomeArquivo, className }: Props) {
  function handleExport() {
    const csv = gerarCSV(dados)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nomeArquivo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (dados.length === 0) return null

  return (
    <button
      onClick={handleExport}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${className ?? ''}`}
    >
      <Download className="h-3.5 w-3.5" />
      Exportar CSV
    </button>
  )
}
