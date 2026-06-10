import { getAccessToken, getSelectedEmpreendimentoId } from '@/lib/auth'
import { api, type PaginatedResponse } from '@/lib/api'
import { EmpreendimentoSelector } from './empreendimento-selector'
import { CommandPalette } from './command-palette'

interface Empreendimento {
  id: string
  nome: string
  nomeFantasia: string | null
  cidade: string
  estado: string
}

export async function AppHeader() {
  const token = await getAccessToken()
  const selecionadoId = await getSelectedEmpreendimentoId()

  let empreendimentos: Empreendimento[] = []
  if (token) {
    try {
      const res = await api.get<PaginatedResponse<Empreendimento>>(
        '/empreendimentos?limit=200',
        token,
      )
      empreendimentos = res.data
    } catch {
      // silencioso — header degrada elegantemente
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur px-6 py-2">
      <div className="flex items-center gap-3">
        <EmpreendimentoSelector
          empreendimentos={empreendimentos}
          selecionadoId={selecionadoId}
        />
      </div>
      <div className="flex items-center gap-3">
        <CommandPalette />
        <div className="text-xs text-muted-foreground hidden xl:block">
          {empreendimentos.length > 0 && (
            <>{empreendimentos.length} posto{empreendimentos.length !== 1 ? 's' : ''} na rede</>
          )}
        </div>
      </div>
    </header>
  )
}
