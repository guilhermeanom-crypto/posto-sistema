'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarFuncionarioAction } from './actions'

interface Props {
  empreendimentos: { id: string; nome: string }[]
}

const cargos = [
  'Frentista', 'Gerente', 'Subgerente', 'Caixa', 'Lubrificador',
  'Trocador de Óleo', 'Lavador', 'Operador de Descarga', 'Zelador',
  'Técnico de Manutenção', 'Coordenador', 'Auxiliar Administrativo', 'Outros',
]

const setores = ['PISTA', 'DESCARGA', 'AREA_TECNICA', 'CONVENIENCIA', 'ADMINISTRATIVO']
const vinculos = ['CLT', 'PJ', 'TERCEIRIZADO', 'ESTAGIO', 'TEMPORARIO']

export function NovoFuncionarioForm({ empreendimentos }: Props) {
  const [state, action, pending] = useActionState(criarFuncionarioAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.push('/funcionarios')
  }, [state, router])

  return (
    <form action={action} className="rounded-lg border bg-card p-5 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Nome Completo *</label>
          <input name="nome" required placeholder="Nome do funcionário" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">CPF</label>
          <input name="cpf" placeholder="000.000.000-00" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Empreendimento *</label>
          <select name="empreendimentoId" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {empreendimentos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Cargo *</label>
          <select name="cargo" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {cargos.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Setor</label>
          <select name="setor" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione...</option>
            {setores.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Vínculo *</label>
          <select name="vinculo" required defaultValue="CLT" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {vinculos.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data de Admissão *</label>
          <input name="dataAdmissao" type="date" required className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" placeholder="email@exemplo.com" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Telefone</label>
          <input name="telefone" placeholder="(11) 99999-0000" className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {pending ? 'Salvando...' : 'Cadastrar Funcionário'}
        </button>
        <button type="button" onClick={() => router.push('/funcionarios')} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
      </div>
    </form>
  )
}
