import { prisma } from '../infra/prisma.js'

// ─────────────────────────────────────────────────────────────────────────────
// ROTEAMENTO SERVICE
// Atribui automaticamente o responsável correto a uma tarefa com base em:
// 1. Equipe do empreendimento (EmpreendimentoAcesso)
// 2. Perfil preferencial por módulo/origem
// 3. Menor carga de trabalho entre candidatos
// ─────────────────────────────────────────────────────────────────────────────

type OrigemTarefa = string
type Perfil = string

// ── Perfil preferencial por origem da tarefa ────────────────────────────────

const PERFIL_PREFERENCIAL: Record<string, Perfil[]> = {
  REGRA_VENCIMENTO_LICENCA: ['COORDENADOR', 'ADMIN_TENANT'],
  REGRA_VENCIMENTO_PROC: ['COORDENADOR', 'ADMIN_TENANT'],
  REGRA_CONDICIONANTE: ['COORDENADOR', 'ANALISTA'],
  REGRA_VENCIMENTO_ESTANQUEIDADE: ['ANALISTA_CAMPO', 'ANALISTA', 'COORDENADOR'],
  REGRA_VENCIMENTO_ANP: ['ANALISTA', 'COORDENADOR'],
  REGRA_VENCIMENTO_SST: ['ANALISTA', 'COORDENADOR'],
  REGRA_VENCIMENTO_OUTORGA: ['ANALISTA', 'COORDENADOR'],
  REGRA_VENCIMENTO_DOC: ['ANALISTA', 'COORDENADOR'],
  REGRA_VENCIMENTO_PGRS: ['ANALISTA', 'COORDENADOR'],
  REGRA_VENCIMENTO_LICENCA_AMBIENTAL: ['COORDENADOR', 'ADMIN_TENANT'],
  WORKFLOW: ['ANALISTA_CAMPO', 'ANALISTA', 'COORDENADOR'],
  ESCALAMENTO: ['COORDENADOR', 'ADMIN_TENANT'],
  MANUAL: ['ANALISTA', 'COORDENADOR'],
  REGRA_REQUISITO_PENDENTE: ['ANALISTA', 'COORDENADOR'],
}

const FALLBACK_PERFIS: Perfil[] = ['COORDENADOR', 'ADMIN_TENANT', 'SUPER_ADMIN']

/**
 * Determina o melhor responsável para uma tarefa.
 * Retorna o userId ou null se ninguém disponível.
 */
export async function rotearTarefa(
  tenantId: string,
  empreendimentoId: string,
  origem: OrigemTarefa,
): Promise<string | null> {
  // 1. Buscar usuários com acesso ao empreendimento
  const acessos = await prisma.empreendimentoAcesso.findMany({
    where: { empreendimentoId },
    include: {
      usuario: { select: { id: true, perfil: true, ativo: true } },
    },
  })

  const candidatosEmpreendimento = acessos
    .map((a) => a.usuario)
    .filter((u) => u.ativo)

  // 2. Filtrar por perfil preferencial
  const perfisPreferidos = PERFIL_PREFERENCIAL[origem] ?? FALLBACK_PERFIS

  let candidatos = candidatosEmpreendimento.filter((u) =>
    perfisPreferidos.includes(u.perfil),
  )

  // Se nenhum candidato no empreendimento com perfil preferido, buscar tenant-wide
  if (candidatos.length === 0) {
    const fallback = await prisma.usuario.findMany({
      where: {
        tenantId,
        ativo: true,
        perfil: { in: FALLBACK_PERFIS as never[] },
      },
      select: { id: true, perfil: true, ativo: true },
    })
    candidatos = fallback
  }

  if (candidatos.length === 0) return null
  if (candidatos.length === 1) return candidatos[0]!.id

  // 3. Escolher o com menor carga de tarefas abertas
  const cargas = await Promise.all(
    candidatos.map(async (c) => {
      const count = await prisma.tarefa.count({
        where: {
          responsavelId: c.id,
          status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] },
        },
      })
      return { id: c.id, carga: count }
    }),
  )

  cargas.sort((a, b) => a.carga - b.carga)
  return cargas[0]!.id
}
