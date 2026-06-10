'use server'

import { revalidatePath } from 'next/cache'
import { setSelectedEmpreendimentoId } from '@/lib/auth'

/**
 * Server action: define o empreendimento ativo no cookie httpOnly.
 * Chamada pelo seletor global do header.
 * `id` vazio ou null = "todos os empreendimentos".
 */
export async function selecionarEmpreendimento(id: string | null) {
  await setSelectedEmpreendimentoId(id)
  // Invalida cache de todas as páginas para refletir o novo escopo
  revalidatePath('/', 'layout')
  return { ok: true }
}
