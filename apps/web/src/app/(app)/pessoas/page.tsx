import type { Metadata } from 'next'
import { getAccessToken } from '@/lib/auth'
import { api } from '@/lib/api'
import { PessoasBoard, type PessoaResumo } from './pessoas-board'

export const metadata: Metadata = { title: 'Pessoas' }

interface Tarefa {
  id: string
  titulo: string
  status: string
  prioridade: string
  dataVencimento?: string | null
  empreendimento?: { nome?: string | null }
  responsavel?: { nome?: string | null; email?: string | null } | null
}

interface Funcionario {
  nome: string
  cargo?: string | null
  setor?: string | null
}

function buildPessoas(tarefas: Tarefa[], funcionarios: Funcionario[]): PessoaResumo[] {
  const hoje = Date.now()
  const byName = new Map<string, PessoaResumo>()

  for (const funcionario of funcionarios) {
    if (!funcionario.nome) continue
    byName.set(funcionario.nome, {
      nome: funcionario.nome,
      cargo: funcionario.cargo ?? undefined,
      setor: funcionario.setor ?? undefined,
      total: 0,
      abertas: 0,
      atrasadas: 0,
      criticas: 0,
      concluidas: 0,
      scorePressao: 0,
      tarefas: [],
    })
  }

  for (const tarefa of tarefas) {
    const nome = tarefa.responsavel?.nome ?? 'Sem responsável'
    const pessoa = byName.get(nome) ?? {
      nome,
      email: tarefa.responsavel?.email ?? undefined,
      total: 0,
      abertas: 0,
      atrasadas: 0,
      criticas: 0,
      concluidas: 0,
      scorePressao: 0,
      tarefas: [],
    }

    const concluida = tarefa.status === 'CONCLUIDA' || tarefa.status === 'APROVADA'
    const atrasada = Boolean(tarefa.dataVencimento && new Date(tarefa.dataVencimento).getTime() < hoje && !concluida)
    const critica = tarefa.prioridade === 'CRITICA' || tarefa.status === 'BLOQUEADA'

    pessoa.total += 1
    pessoa.concluidas += concluida ? 1 : 0
    pessoa.abertas += concluida ? 0 : 1
    pessoa.atrasadas += atrasada ? 1 : 0
    pessoa.criticas += critica ? 1 : 0
    pessoa.email = pessoa.email ?? tarefa.responsavel?.email ?? undefined
    pessoa.tarefas.push({
      id: tarefa.id,
      titulo: tarefa.titulo,
      status: tarefa.status,
      prioridade: tarefa.prioridade,
      dataVencimento: tarefa.dataVencimento,
      empreendimento: tarefa.empreendimento?.nome ?? 'Sem empreendimento',
    })

    byName.set(nome, pessoa)
  }

  return [...byName.values()]
    .map((pessoa) => ({
      ...pessoa,
      scorePressao: Math.min(100, pessoa.abertas * 8 + pessoa.criticas * 18 + pessoa.atrasadas * 14),
    }))
    .filter((pessoa) => pessoa.total > 0 || pessoa.nome !== 'Sem responsável')
    .sort((a, b) => b.scorePressao - a.scorePressao)
    .slice(0, 12)
}

export default async function PessoasPage() {
  const token = await getAccessToken()
  let pessoas: PessoaResumo[] = []

  if (token) {
    try {
      const [tarefasRes, funcionariosRes] = await Promise.allSettled([
        api.get<{ data: Tarefa[] }>('/tarefas?limit=100', token),
        api.get<{ data: Funcionario[] }>('/sst/funcionarios?limit=100', token),
      ])

      const tarefas = tarefasRes.status === 'fulfilled' ? tarefasRes.value.data : []
      const funcionarios = funcionariosRes.status === 'fulfilled' ? funcionariosRes.value.data : []
      pessoas = buildPessoas(tarefas, funcionarios)
    } catch {
      pessoas = []
    }
  }

  const abertas = pessoas.reduce((acc, pessoa) => acc + pessoa.abertas, 0)
  const criticas = pessoas.reduce((acc, pessoa) => acc + pessoa.criticas, 0)
  const atrasadas = pessoas.reduce((acc, pessoa) => acc + pessoa.atrasadas, 0)

  return (
    <div className="space-y-6">
      <div className="animate-panel-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Ownership operacional</p>
          <h1 className="text-2xl font-bold tracking-tight">Pessoas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Carga de trabalho, SLA e pressão por responsável técnico.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Kpi label="Abertas" value={abertas} />
          <Kpi label="Críticas" value={criticas} />
          <Kpi label="Atrasadas" value={atrasadas} />
        </div>
      </div>

      <PessoasBoard pessoas={pessoas} />
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-right shadow-sm">
      <p className="text-2xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  )
}
