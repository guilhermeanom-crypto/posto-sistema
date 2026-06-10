import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// SEED: Regras automáticas para novos tipos de vencimento + PGRS demo
// Pode ser executado standalone OU importado pelo seed principal.
// Execução standalone: npx tsx prisma/seed/pgrs-regras.ts
// ─────────────────────────────────────────────────────────────────────────────

export async function seedPgrsERegras(prisma: PrismaClient) {
  console.log('🌱 Seed PGRS + Regras automáticas...')

  // Busca tenant demo
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'demo' } })
  if (!tenant) {
    console.log('⚠ Tenant demo não encontrado. Execute o seed principal primeiro.')
    return
  }

  // ── Regras automáticas para novos tipos de vencimento ───────────────────
  const regrasNovas = [
    {
      nome: 'Vencimento PGRS',
      tipo: 'vencimento_pgrs',
      gatilho: { entidade: 'pgrs', campo_data: 'dataVencimento', diasAntes: 30 },
      acao: 'enviar_alerta',
      parametros: { perfis: ['ADMIN_TENANT', 'COORDENADOR'], canais: ['app', 'email'] },
    },
    {
      nome: 'Vencimento PGRS — 15 dias',
      tipo: 'vencimento_pgrs',
      gatilho: { entidade: 'pgrs', campo_data: 'dataVencimento', diasAntes: 15 },
      acao: 'enviar_alerta',
      parametros: { perfis: ['ADMIN_TENANT', 'COORDENADOR'], canais: ['app', 'email'] },
    },
    {
      nome: 'Vencimento PGRS — 7 dias',
      tipo: 'vencimento_pgrs',
      gatilho: { entidade: 'pgrs', campo_data: 'dataVencimento', diasAntes: 7 },
      acao: 'enviar_alerta',
      parametros: { perfis: ['ADMIN_TENANT', 'COORDENADOR', 'ANALISTA'], canais: ['app', 'email'] },
    },
    {
      nome: 'Vencimento Estanqueidade — 60 dias',
      tipo: 'vencimento_estanqueidade',
      gatilho: { entidade: 'testeEstanqueidade', campo_data: 'proximoTeste', diasAntes: 60 },
      acao: 'enviar_alerta',
      parametros: { perfis: ['ADMIN_TENANT', 'COORDENADOR'], canais: ['app'] },
    },
    {
      nome: 'Vencimento Estanqueidade — 30 dias',
      tipo: 'vencimento_estanqueidade',
      gatilho: { entidade: 'testeEstanqueidade', campo_data: 'proximoTeste', diasAntes: 30 },
      acao: 'enviar_alerta',
      parametros: { perfis: ['ADMIN_TENANT', 'COORDENADOR'], canais: ['app', 'email'] },
    },
    {
      nome: 'Vencimento Calibração ANP — 30 dias',
      tipo: 'vencimento_anp',
      gatilho: { entidade: 'bombaAbastecimento', campo_data: 'proximaCalibracao', diasAntes: 30 },
      acao: 'enviar_alerta',
      parametros: { perfis: ['ADMIN_TENANT', 'COORDENADOR'], canais: ['app'] },
    },
    {
      nome: 'Vencimento Outorga — 90 dias',
      tipo: 'vencimento_outorga',
      gatilho: { entidade: 'pocoArtesiano', campo_data: 'validadeOutorga', diasAntes: 90 },
      acao: 'enviar_alerta',
      parametros: { perfis: ['ADMIN_TENANT', 'COORDENADOR'], canais: ['app'] },
    },
    {
      nome: 'Vencimento Licença Ambiental — 90 dias',
      tipo: 'vencimento_licenca_ambiental',
      gatilho: { entidade: 'licencaAmbiental', campo_data: 'dataVencimento', diasAntes: 90 },
      acao: 'enviar_alerta',
      parametros: { perfis: ['ADMIN_TENANT', 'COORDENADOR'], canais: ['app', 'email'] },
    },
    {
      nome: 'Vencimento Licença Ambiental — 30 dias',
      tipo: 'vencimento_licenca_ambiental',
      gatilho: { entidade: 'licencaAmbiental', campo_data: 'dataVencimento', diasAntes: 30 },
      acao: 'enviar_alerta',
      parametros: { perfis: ['ADMIN_TENANT', 'COORDENADOR', 'ANALISTA'], canais: ['app', 'email'] },
    },
  ]

  let criadas = 0
  for (const regra of regrasNovas) {
    const existente = await prisma.regraAutomatica.findFirst({
      where: { tenantId: tenant.id, nome: regra.nome },
    })
    if (!existente) {
      await prisma.regraAutomatica.create({
        data: {
          tenantId: tenant.id,
          nome: regra.nome,
          tipo: regra.tipo,
          gatilho: regra.gatilho,
          acao: regra.acao,
          parametros: regra.parametros,
          ativo: true,
        },
      })
      criadas++
    }
  }
  console.log(`✅ Regras automáticas: ${criadas} criadas (${regrasNovas.length - criadas} já existiam)`)

  // ── PGRS demo: 1 plano vigente por empreendimento ativo ──────────────
  const empreendimentos = await prisma.empreendimento.findMany({
    where: { tenantId: tenant.id, ativo: true },
    orderBy: { codigoInterno: 'asc' },
    select: { id: true, nome: true },
  })

  let pgrsCriados = 0
  for (const emp of empreendimentos) {
    const existente = await prisma.pGRS.findFirst({
      where: { tenantId: tenant.id, empreendimentoId: emp.id },
    })
    if (existente) continue

    const hoje = new Date()
    const vencimento = new Date(hoje)
    vencimento.setFullYear(vencimento.getFullYear() + 1)

    const pgrs = await prisma.pGRS.create({
      data: {
        tenantId: tenant.id,
        empreendimentoId: emp.id,
        versao: '2026-v1',
        responsavelTecnico: 'Eng. Maria Silva — CREA-SP 123456',
        artNumero: '2026SP00' + String(pgrsCriados + 1).padStart(4, '0'),
        dataAprovacao: hoje,
        dataVencimento: vencimento,
        status: 'VIGENTE',
      },
    })

    // Exigências do plano
    const exigencias = [
      { descricao: 'Coleta mensal de óleo lubrificante usado (OLUC)', tipoResiduo: 'OLEO_LUBRIFICANTE', periodicidade: 'MENSAL' as const, prazo: 30 },
      { descricao: 'Coleta de filtros de óleo e embalagens contaminadas', tipoResiduo: 'FILTRO_OLEO', periodicidade: 'TRIMESTRAL' as const, prazo: 90 },
      { descricao: 'Limpeza da caixa separadora de água/óleo', tipoResiduo: 'LODO_CAIXA_SEPARADORA', periodicidade: 'SEMESTRAL' as const, prazo: 180 },
      { descricao: 'Destinação de resíduos recicláveis (plástico, papel, metal)', tipoResiduo: 'RESIDUO_RECICLAVEL', periodicidade: 'MENSAL' as const, prazo: 30 },
      { descricao: 'Armazenamento temporário conforme NBR 12235', tipoResiduo: 'EMBALAGEM_CONTAMINADA', periodicidade: 'ANUAL' as const, prazo: 365 },
    ]

    for (const ex of exigencias) {
      await prisma.pGRSExigencia.create({
        data: {
          pgrsId: pgrs.id,
          descricao: ex.descricao,
          tipoResiduo: ex.tipoResiduo,
          periodicidade: ex.periodicidade,
          prazoComprovacaoDias: ex.prazo,
          status: 'PENDENTE',
        },
      })
    }

    pgrsCriados++
    console.log(`  📋 PGRS ${pgrs.versao} criado para ${emp.nome} (${exigencias.length} exigências)`)
  }

  console.log(`✅ PGRS demo: ${pgrsCriados} criados`)
  console.log('🌱 Seed PGRS + Regras concluído.')
}

// Execução standalone
if (process.argv[1]?.endsWith('pgrs-regras.ts') || process.argv[1]?.endsWith('pgrs-regras.js')) {
  const prisma = new PrismaClient()
  seedPgrsERegras(prisma)
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}
