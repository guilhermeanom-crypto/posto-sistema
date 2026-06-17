import { z } from 'zod'
import type { PerfilEmpreendimento, PotencialPoluidor } from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// APLICABILIDADE CONDICIONAL (Blueprint 101 — Passo 2)
// Uma obrigação aplica-se quando TODAS as condições PRESENTES na regra são
// satisfeitas (AND). Sem condições => núcleo sempre aplicável. A saída sempre
// carrega um MOTIVO nomeado (princípio: toda saída rastreável).
// ─────────────────────────────────────────────────────────────────────────────

export const regraAplicabilidadeSchema = z
  .object({
    sempre: z.boolean().optional(),
    // CNAE: prefixo OU exato (dimensão única). Comparação por dígitos.
    cnaePrefixos: z.array(z.string()).optional(),
    cnaeExatos: z.array(z.string()).optional(),
    portes: z.array(z.string()).optional(),
    ufs: z.array(z.string()).optional(),
    // Gatilhos físicos/operacionais
    requerCaptacao: z.boolean().optional(),
    requerSAO: z.boolean().optional(),
    requerTanqueParedeSimples: z.boolean().optional(),
    tanqueIdadeMinAnos: z.number().optional(),
    areaMinM2: z.number().optional(),
    potencialPoluidorMin: z.enum(['BAIXO', 'MEDIO', 'ALTO']).optional(),
  })
  .strict()

export type RegraAplicabilidade = z.infer<typeof regraAplicabilidadeSchema>

export interface ResultadoAplicabilidade {
  aplicavel: boolean
  motivo: string
}

const ORDEM_POTENCIAL: Record<PotencialPoluidor, number> = { BAIXO: 1, MEDIO: 2, ALTO: 3 }
const soDigitos = (c: string) => c.replace(/\D/g, '')

function cnaesDoPerfil(p: PerfilEmpreendimento): string[] {
  return [p.cnaePrincipal, ...p.cnaesSecundarios].filter((c): c is string => !!c).map(soDigitos)
}

export function evaluateAplicabilidade(
  regra: RegraAplicabilidade,
  perfil: PerfilEmpreendimento,
): ResultadoAplicabilidade {
  if (regra.sempre === false) return { aplicavel: false, motivo: 'desativada (sempre=false)' }

  const motivos: string[] = []

  if (regra.cnaePrefixos?.length || regra.cnaeExatos?.length) {
    const cnaes = cnaesDoPerfil(perfil)
    const exatos = (regra.cnaeExatos ?? []).map(soDigitos)
    const prefixos = (regra.cnaePrefixos ?? []).map(soDigitos)
    const casa =
      cnaes.some((c) => exatos.includes(c)) ||
      cnaes.some((c) => prefixos.some((pre) => pre && c.startsWith(pre)))
    if (!casa) {
      return { aplicavel: false, motivo: `CNAE não corresponde (${[...exatos, ...prefixos].join('/')})` }
    }
    motivos.push('CNAE compatível')
  }

  if (regra.portes?.length) {
    if (!perfil.porte || !regra.portes.includes(perfil.porte)) {
      return { aplicavel: false, motivo: `porte ${perfil.porte ?? '—'} fora de [${regra.portes.join(',')}]` }
    }
    motivos.push(`porte ${perfil.porte}`)
  }

  if (regra.ufs?.length) {
    if (!regra.ufs.includes(perfil.uf)) {
      return { aplicavel: false, motivo: `UF ${perfil.uf} fora de [${regra.ufs.join(',')}]` }
    }
    motivos.push(`UF ${perfil.uf}`)
  }

  if (regra.requerCaptacao) {
    if (!perfil.possuiCaptacao) return { aplicavel: false, motivo: 'sem captação de água' }
    motivos.push('captação presente (Lei 9.433/97)')
  }

  if (regra.requerSAO) {
    if (!perfil.possuiSAO) return { aplicavel: false, motivo: 'sem SAO/caixa separadora' }
    motivos.push('SAO presente (CONAMA 430/2011)')
  }

  if (regra.requerTanqueParedeSimples) {
    if (!perfil.tanques.some((t) => t.paredeSimples)) {
      return { aplicavel: false, motivo: 'sem tanque de parede simples' }
    }
    motivos.push('tanque parede simples (CONAMA 273/2000)')
  }

  if (regra.tanqueIdadeMinAnos != null) {
    const min = regra.tanqueIdadeMinAnos
    if (!perfil.tanques.some((t) => (t.idadeAnos ?? 0) >= min)) {
      return { aplicavel: false, motivo: `sem tanque ≥ ${min} anos` }
    }
    motivos.push(`tanque ≥ ${min} anos`)
  }

  if (regra.areaMinM2 != null) {
    if ((perfil.areaM2 ?? 0) < regra.areaMinM2) {
      return { aplicavel: false, motivo: `área < ${regra.areaMinM2} m²` }
    }
    motivos.push(`área ≥ ${regra.areaMinM2} m²`)
  }

  if (regra.potencialPoluidorMin) {
    const min = ORDEM_POTENCIAL[regra.potencialPoluidorMin]
    const atual = perfil.potencialPoluidor ? ORDEM_POTENCIAL[perfil.potencialPoluidor] : 0
    if (atual < min) return { aplicavel: false, motivo: `potencial poluidor < ${regra.potencialPoluidorMin}` }
    motivos.push(`potencial ≥ ${regra.potencialPoluidorMin}`)
  }

  return { aplicavel: true, motivo: motivos.length ? motivos.join('; ') : 'núcleo sempre aplicável' }
}
