import type { Metadata } from 'next'
import Link from 'next/link'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Calendário de Vencimentos' }

interface VencimentoItem {
  id: string
  modulo: string
  descricao: string
  empreendimento: string
  dataVencimento: string
  diasRestantes: number
  urgencia: string
}

const moduloColor: Record<string, string> = {
  'Licença Ambiental': 'bg-green-500',
  'Reg. Urbano': 'bg-blue-500',
  'SST': 'bg-purple-500',
  'ANP/INMETRO': 'bg-orange-500',
  'Estanqueidade': 'bg-cyan-500',
  'Outorga Hídrica': 'bg-teal-500',
  'Fiscalização': 'bg-red-500',
  'Documento': 'bg-gray-500',
  'Condicionante': 'bg-yellow-500',
}

interface Props {
  searchParams: Promise<{ mes?: string; ano?: string }>
}

export default async function CalendarioPage({ searchParams }: Props) {
  const params = await searchParams
  const token = await getAccessToken()

  const hoje = new Date()
  const mesAtual = parseInt(params.mes ?? String(hoje.getMonth() + 1), 10)
  const anoAtual = parseInt(params.ano ?? String(hoje.getFullYear()), 10)

  // Buscar vencimentos do ano inteiro para ter dados do mês selecionado
  let vencimentos: VencimentoItem[] = []
  if (token) {
    try {
      const res = await api.get<{ data: VencimentoItem[] }>('/cockpit/vencimentos?dias=365', token)
      vencimentos = res.data
    } catch {}
  }

  // Filtrar pelo mês selecionado
  const vencimentosMes = vencimentos.filter((v) => {
    const d = new Date(v.dataVencimento)
    return d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual
  })

  // Agrupar por dia
  const porDia = new Map<number, VencimentoItem[]>()
  for (const v of vencimentosMes) {
    const dia = new Date(v.dataVencimento).getDate()
    if (!porDia.has(dia)) porDia.set(dia, [])
    porDia.get(dia)!.push(v)
  }

  // Gerar grid do mês
  const primeiroDia = new Date(anoAtual, mesAtual - 1, 1)
  const ultimoDia = new Date(anoAtual, mesAtual, 0)
  const diasNoMes = ultimoDia.getDate()
  const diaSemanaInicio = primeiroDia.getDay() // 0=dom

  const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1
  const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual
  const mesProximo = mesAtual === 12 ? 1 : mesAtual + 1
  const anoProximo = mesAtual === 12 ? anoAtual + 1 : anoAtual

  const nomeMes = primeiroDia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Calendário de Vencimentos
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {vencimentosMes.length} vencimento{vencimentosMes.length !== 1 ? 's' : ''} em {nomeMes}
        </p>
      </div>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <Link href={`/calendario?mes=${mesAnterior}&ano=${anoAnterior}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Link>
        <h2 className="text-lg font-semibold capitalize">{nomeMes}</h2>
        <Link href={`/calendario?mes=${mesProximo}&ano=${anoProximo}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          Próximo <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(moduloColor).map(([mod, cor]) => (
          <div key={mod} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${cor}`} />
            {mod}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Cabeçalho dias da semana */}
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Dias */}
        <div className="grid grid-cols-7">
          {/* Células vazias antes do primeiro dia */}
          {Array.from({ length: diaSemanaInicio }, (_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r bg-muted/10" />
          ))}

          {/* Dias do mês */}
          {Array.from({ length: diasNoMes }, (_, i) => {
            const dia = i + 1
            const eventos = porDia.get(dia) ?? []
            const isHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() + 1 && anoAtual === hoje.getFullYear()

            return (
              <div key={dia} className={`min-h-[80px] border-b border-r p-1 ${isHoje ? 'bg-primary/5' : ''}`}>
                <div className={`text-xs font-medium mb-0.5 ${isHoje ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {dia}
                </div>
                <div className="space-y-0.5">
                  {eventos.slice(0, 3).map((v) => (
                    <div
                      key={`${v.modulo}-${v.id}`}
                      className="flex items-center gap-1 text-[8px] leading-tight truncate"
                      title={`${v.modulo}: ${v.descricao} — ${v.empreendimento}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${moduloColor[v.modulo] ?? 'bg-gray-400'}`} />
                      <span className="truncate">{v.descricao.slice(0, 25)}</span>
                    </div>
                  ))}
                  {eventos.length > 3 && (
                    <p className="text-[8px] text-muted-foreground">+{eventos.length - 3} mais</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista detalhada do mês */}
      {vencimentosMes.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Detalhamento — {nomeMes}</h3>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {vencimentosMes
              .sort((a, b) => a.diasRestantes - b.diasRestantes)
              .map((v) => (
                <div key={`${v.modulo}-${v.id}`} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${moduloColor[v.modulo] ?? 'bg-gray-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.descricao}</p>
                      <p className="text-xs text-muted-foreground">{v.empreendimento} · {v.modulo}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs">{new Date(v.dataVencimento).toLocaleDateString('pt-BR')}</p>
                    <p className={`text-[10px] font-medium ${v.diasRestantes < 0 ? 'text-red-600' : v.diasRestantes <= 7 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                      {v.diasRestantes < 0 ? `Vencido há ${Math.abs(v.diasRestantes)}d` : v.diasRestantes === 0 ? 'Hoje' : `${v.diasRestantes}d`}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
