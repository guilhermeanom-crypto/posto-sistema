import { ListChecks } from 'lucide-react'

export const metadata = { title: 'Pendências da equipe' }

const ROWS = [
  { id: 'p-001', desc: 'Comprovante de limpeza recente da SAO',                 os: 'OS-2026-0184', prio: 'Alta',    prazo: '7 dias',  status: 'Enviada cliente' },
  { id: 'p-002', desc: 'Foto de bocais e descarga selada por tanque',           os: 'OS-2026-0184', prio: 'Média',   prazo: '3 dias',  status: 'Aberta' },
  { id: 'p-003', desc: 'Abrigo de resíduos perigosos: cobertura e contenção',    os: 'OS-2026-0184', prio: 'Crítica', prazo: '15 dias', status: 'Aberta' },
  { id: 'p-004', desc: 'AVCB vencida: solicitar atualização',                    os: 'OS-2026-0185', prio: 'Crítica', prazo: '5 dias',  status: 'Aberta' },
  { id: 'p-005', desc: 'Revisar polígono CAR: sobreposição com APP detectada',   os: 'OS-2026-0179', prio: 'Alta',    prazo: '10 dias', status: 'Em andamento' },
  { id: 'p-006', desc: 'Complementar FCA com mapeamento (IPHAN)',                os: 'OS-2026-0167', prio: 'Média',   prazo: '20 dias', status: 'Em andamento' },
]

const PRIO: Record<string, string> = {
  Crítica: 'bg-red-50 text-red-700 border-red-200',
  Alta: 'bg-orange-50 text-orange-700 border-orange-200',
  Média: 'bg-amber-50 text-amber-700 border-amber-200',
  Baixa: 'bg-sky-50 text-sky-700 border-sky-200',
}

const ST: Record<string, string> = {
  'Aberta': 'bg-orange-50 text-orange-700 border-orange-200',
  'Enviada cliente': 'bg-sky-50 text-sky-700 border-sky-200',
  'Em andamento': 'bg-amber-50 text-amber-700 border-amber-200',
  'Resolvida': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export default function PendenciasPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Operação</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Pendências</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Achados de campo viram pendência com responsável, prazo e validação.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold tabular-nums text-muted-foreground">
          {ROWS.length} em aberto
        </span>
      </div>

      <article className="rounded-xl border bg-card overflow-hidden">
        <header className="flex items-center gap-2 border-b px-5 py-3">
          <ListChecks className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Pendências da operação</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Descrição</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">OS</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Prazo</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Prioridade</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ROWS.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3 text-foreground font-medium">{r.desc}</td>
                  <td className="px-5 py-3 font-mono text-muted-foreground">{r.os}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">{r.prazo}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIO[r.prio]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      {r.prio}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${ST[r.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}
