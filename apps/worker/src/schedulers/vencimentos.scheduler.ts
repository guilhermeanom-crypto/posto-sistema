import { Queue } from 'bullmq'
import { prisma } from '../infra/prisma.js'
import { redis } from '../infra/redis.js'
import { diasAteVencimento } from '@repo/utils'
import { criarTarefaAutomatica } from '../services/tarefa-auto.service.js'

// ─────────────────────────────────────────────────────────────────────────────
// VENCIMENTOS SCHEDULER
// Rodado diariamente: varre processos, documentos e condicionantes próximos
// do vencimento e enfileira alertas + e-mails.
// Respeita as RegraAutomatica cadastradas por tenant.
// Cria tarefas automáticas para itens já vencidos (pendências ativas).
// ─────────────────────────────────────────────────────────────────────────────

const alertaQueue = new Queue('alertas', { connection: redis })
const emailQueue = new Queue('email', { connection: redis })

const HORIZONTES_PADRAO = [30, 15, 7, 3, 1] // fallback se não houver regras

/**
 * Decide se deve alertar no dia. Antes era `horizontes.includes(dias)` (match exato),
 * o que perdia o alerta se o job não rodasse exatamente naquele dia (deploy, falha,
 * arredondamento). Agora tolera UMA execução perdida disparando também em H-1; o dedup
 * de 24h do processor de alertas evita duplicar quando o job roda em dias consecutivos.
 */
function dentroDeHorizonte(dias: number, horizontes: number[]): boolean {
  return horizontes.some((h) => dias === h || dias === h - 1)
}

interface RegraParametros {
  perfis: string[]
  canais: string[]
}

interface RegraGatilho {
  diasAntes: number
}

interface RegrasporTenant {
  [tenantId: string]: {
    horizontes: number[]
    perfis: string[]
    canais: string[]
  }
}

/** Carrega regras ativas por tenant e tipo, retornando horizontes + perfis + canais */
async function carregarRegras(tipo: string): Promise<RegrasporTenant> {
  const regras = await prisma.regraAutomatica.findMany({
    where: { tipo, ativo: true },
    select: { tenantId: true, gatilho: true, parametros: true },
  })

  const mapa: RegrasporTenant = {}
  for (const r of regras) {
    const gatilho = r.gatilho as unknown as RegraGatilho
    const params = r.parametros as unknown as RegraParametros
    if (!mapa[r.tenantId]) {
      mapa[r.tenantId] = { horizontes: [], perfis: params.perfis ?? [], canais: params.canais ?? [] }
    }
    const entry = mapa[r.tenantId]
    if (entry) entry.horizontes.push(gatilho.diasAntes)
  }
  return mapa
}

/** Busca IDs de usuários que correspondem aos perfis configurados na regra */
async function resolverDestinatarios(tenantId: string, perfis: string[]): Promise<string[]> {
  if (perfis.length === 0) return []
  const usuarios = await prisma.usuario.findMany({
    where: { tenantId, ativo: true, perfil: { in: perfis as never[] } },
    select: { id: true },
  })
  return usuarios.map((u) => u.id)
}

export async function verificarVencimentos(): Promise<void> {
  const hoje = new Date()

  // Carrega regras de todos os tenants para cada tipo
  const [regrasProcDesc, regrasDoc, regrasCond] = await Promise.all([
    carregarRegras('vencimento_proc'),
    carregarRegras('vencimento_doc'),
    carregarRegras('condicionante'),
  ])

  // Horizonte máximo considerado por qualquer regra (para limitar a query)
  const maxDias = Math.max(
    ...Object.values({ ...regrasProcDesc, ...regrasDoc, ...regrasCond })
      .flatMap((r) => r.horizontes),
    ...HORIZONTES_PADRAO,
  )
  const dataLimite = new Date(hoje.getTime() + maxDias * 24 * 60 * 60 * 1000)

  // ── Processos ──────────────────────────────────────────────────────────────
  const processosVencendo = await prisma.processo.findMany({
    where: {
      dataVencimento: { lte: dataLimite, gte: hoje },
      status: { notIn: ['ARQUIVADO', 'CANCELADO'] as never[] },
    },
    include: {
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
      responsavel: { select: { id: true, nome: true, email: true } },
    },
  })

  for (const processo of processosVencendo) {
    const dias = diasAteVencimento(processo.dataVencimento!)
    const tenantId = processo.empreendimento.tenantId
    const regra = regrasProcDesc[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)
    if (processo.responsavelId && !destinatarioIds.includes(processo.responsavelId)) {
      destinatarioIds.push(processo.responsavelId)
    }

    await alertaQueue.add('alerta-vencimento-processo', {
      tenantId,
      empreendimentoId: processo.empreendimentoId,
      tipo: 'VENCIMENTO_PROCESSO',
      nivel,
      titulo: `Processo vencendo em ${dias} dia(s)`,
      mensagem: `O processo ${processo.numeroProtocolo ?? processo.id} vence em ${dias} dias.`,
      entidadeTipo: 'processo',
      entidadeId: processo.id,
      destinatarioIds,
      canais,
    })
  }

  // ── Documentos ─────────────────────────────────────────────────────────────
  const documentosVencendo = await prisma.documento.findMany({
    where: {
      dataValidade: { lte: dataLimite, gte: hoje },
      status: { notIn: ['SUBSTITUIDO', 'DISPENSADO'] as never[] },
    },
    include: {
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
      tipoDocumento: { select: { nome: true } },
    },
  })

  for (const doc of documentosVencendo) {
    const dias = diasAteVencimento(doc.dataValidade!)
    const tenantId = doc.empreendimento.tenantId
    const regra = regrasDoc[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-documento', {
      tenantId,
      empreendimentoId: doc.empreendimentoId,
      tipo: 'VENCIMENTO_DOCUMENTO',
      nivel,
      titulo: `Documento vencendo em ${dias} dia(s)`,
      mensagem: `${doc.tipoDocumento.nome} em ${doc.empreendimento.nome} vence em ${dias} dias.`,
      entidadeTipo: 'documento',
      entidadeId: doc.id,
      destinatarioIds,
      canais,
    })
  }

  // ── Condicionantes ─────────────────────────────────────────────────────────
  const condicionantesVencendo = await prisma.condicionante.findMany({
    where: {
      proximoVencimento: { lte: dataLimite, gte: hoje },
      status: { in: ['PENDENTE'] as never[] },
    },
    include: {
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
      responsavel: { select: { id: true, nome: true, email: true } },
    },
  })

  for (const cond of condicionantesVencendo) {
    const dias = diasAteVencimento(cond.proximoVencimento!)
    const tenantId = cond.empreendimento.tenantId
    const regra = regrasCond[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)
    if (cond.responsavelId && !destinatarioIds.includes(cond.responsavelId)) {
      destinatarioIds.push(cond.responsavelId)
    }

    await alertaQueue.add('alerta-vencimento-condicionante', {
      tenantId,
      empreendimentoId: cond.empreendimentoId,
      tipo: 'PRAZO_CONDICIONANTE',
      nivel,
      titulo: `Condicionante vencendo em ${dias} dia(s)`,
      mensagem: `Condicionante em ${cond.empreendimento.nome} vence em ${dias} dias.`,
      entidadeTipo: 'condicionante',
      entidadeId: cond.id,
      destinatarioIds,
      canais,
    })

    if (canais.includes('email') && cond.responsavel?.email && dias <= 7) {
      await emailQueue.add('email-vencimento-condicionante', {
        tipo: 'alerta_vencimento',
        email: cond.responsavel.email,
        entidade: cond.descricao,
        diasRestantes: dias,
        link: '',
      })
    }
  }

  // ── ASOs (SST) ────────────────────────────────────────────────────────────
  const regrasSST = await carregarRegras('vencimento_sst')

  const asosVencendo = await prisma.aSO.findMany({
    where: { dataVencimento: { lte: dataLimite, gte: hoje } },
    include: { empreendimento: { select: { id: true, nome: true, tenantId: true } } },
  })

  for (const aso of asosVencendo) {
    const dias = diasAteVencimento(aso.dataVencimento!)
    const tenantId = aso.empreendimento.tenantId
    const regra = regrasSST[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-aso', {
      tenantId,
      empreendimentoId: aso.empreendimentoId,
      tipo: 'VENCIMENTO_DOCUMENTO',
      nivel,
      titulo: `ASO vencendo em ${dias} dia(s)`,
      mensagem: `ASO de ${aso.funcionarioNome} (${aso.cargo ?? aso.tipo}) em ${aso.empreendimento.nome} vence em ${dias} dias.`,
      entidadeTipo: 'aso',
      entidadeId: aso.id,
      destinatarioIds,
      canais,
    })
  }

  // ── Estanqueidade ─────────────────────────────────────────────────────────
  const regrasEst = await carregarRegras('vencimento_estanqueidade')

  const testesVencendo = await prisma.testeEstanqueidade.findMany({
    where: { proximoTeste: { lte: dataLimite, gte: hoje } },
    include: {
      tanque: {
        select: { tenantId: true, empreendimentoId: true, numero: true },
      },
    },
  })

  for (const teste of testesVencendo) {
    const dias = diasAteVencimento(teste.proximoTeste)
    const tenantId = teste.tanque.tenantId
    const regra = regrasEst[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-estanqueidade', {
      tenantId,
      empreendimentoId: teste.tanque.empreendimentoId,
      tipo: 'COMPLIANCE_CRITICO',
      nivel,
      titulo: `Teste de estanqueidade vencendo em ${dias} dia(s)`,
      mensagem: `Tanque ${teste.tanque.numero} precisa de novo teste de estanqueidade em ${dias} dias.`,
      entidadeTipo: 'testeEstanqueidade',
      entidadeId: teste.id,
      destinatarioIds,
      canais,
    })
  }

  // ── Calibração de Bombas (ANP) ────────────────────────────────────────────
  const regrasANP = await carregarRegras('vencimento_anp')

  const bombasVencendo = await prisma.bombaAbastecimento.findMany({
    where: { proximaCalibracao: { lte: dataLimite, gte: hoje } },
    include: { empreendimento: { select: { id: true, nome: true, tenantId: true } } },
  })

  for (const bomba of bombasVencendo) {
    const dias = diasAteVencimento(bomba.proximaCalibracao!)
    const tenantId = bomba.empreendimento.tenantId
    const regra = regrasANP[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-calibracao', {
      tenantId,
      empreendimentoId: bomba.empreendimentoId,
      tipo: 'COMPLIANCE_CRITICO',
      nivel,
      titulo: `Calibração de bomba vencendo em ${dias} dia(s)`,
      mensagem: `Bomba ${bomba.numero} em ${bomba.empreendimento.nome} precisa de calibração em ${dias} dias.`,
      entidadeTipo: 'bombaAbastecimento',
      entidadeId: bomba.id,
      destinatarioIds,
      canais,
    })
  }

  // ── Outorga Hídrica (Poços Artesianos) ────────────────────────────────────
  const regrasOutorga = await carregarRegras('vencimento_outorga')

  const pocosVencendo = await prisma.pocoArtesiano.findMany({
    where: { validadeOutorga: { lte: dataLimite, gte: hoje } },
    include: { empreendimento: { select: { id: true, nome: true, tenantId: true } } },
  })

  for (const poco of pocosVencendo) {
    const dias = diasAteVencimento(poco.validadeOutorga!)
    const tenantId = poco.empreendimento.tenantId
    const regra = regrasOutorga[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-outorga', {
      tenantId,
      empreendimentoId: poco.empreendimentoId,
      tipo: 'VENCIMENTO_DOCUMENTO',
      nivel,
      titulo: `Outorga hídrica vencendo em ${dias} dia(s)`,
      mensagem: `Outorga do poço artesiano em ${poco.empreendimento.nome} vence em ${dias} dias.`,
      entidadeTipo: 'pocoArtesiano',
      entidadeId: poco.id,
      destinatarioIds,
      canais,
    })
  }

  // ── Licenças Ambientais ────────────────────────────────────────────────────
  const regrasLicAmb = await carregarRegras('vencimento_licenca_ambiental')

  const licencasVencendo = await prisma.licencaAmbiental.findMany({
    where: {
      dataVencimento: { lte: dataLimite, gte: hoje },
      status: { notIn: ['CANCELADA', 'SUSPENSA'] as never[] },
    },
    include: { empreendimento: { select: { id: true, nome: true, tenantId: true } } },
  })

  for (const lic of licencasVencendo) {
    const dias = diasAteVencimento(lic.dataVencimento)
    const tenantId = lic.empreendimento.tenantId
    const regra = regrasLicAmb[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-licenca-ambiental', {
      tenantId,
      empreendimentoId: lic.empreendimentoId,
      tipo: 'VENCIMENTO_PROCESSO',
      nivel,
      titulo: `Licença ambiental vencendo em ${dias} dia(s)`,
      mensagem: `Licença ${lic.tipo} (${lic.numero}) em ${lic.empreendimento.nome} vence em ${dias} dias.`,
      entidadeTipo: 'licencaAmbiental',
      entidadeId: lic.id,
      destinatarioIds,
      canais,
    })
  }

  // ── Treinamentos vencendo (SST) ─────────────────────────────────────────────
  const regrasTreino = await carregarRegras('vencimento_sst')

  const treinamentosVencendo = await prisma.treinamentoExecucao.findMany({
    where: {
      dataVencimento: { lte: dataLimite, gte: hoje },
      status: 'REALIZADO',
    },
    include: {
      tipo: { select: { nome: true, normativa: true } },
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
    },
  })

  for (const treino of treinamentosVencendo) {
    const dias = diasAteVencimento(treino.dataVencimento!)
    const tenantId = treino.empreendimento.tenantId
    const regra = regrasTreino[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-treinamento', {
      tenantId,
      empreendimentoId: treino.empreendimentoId,
      tipo: 'VENCIMENTO_DOCUMENTO',
      nivel,
      titulo: `Treinamento ${treino.tipo.normativa} vencendo em ${dias} dia(s)`,
      mensagem: `${treino.tipo.nome} em ${treino.empreendimento.nome} vence em ${dias} dias.`,
      entidadeTipo: 'treinamentoExecucao',
      entidadeId: treino.id,
      destinatarioIds,
      canais,
    })
  }

  // ── Documentos SST vencendo (PCMSO, PGR, LTCAT etc.) ─────────────────────
  const docsSSTVencendo = await prisma.documentoSST.findMany({
    where: {
      dataVencimento: { lte: dataLimite, gte: hoje },
      status: 'VIGENTE',
    },
    include: {
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
    },
  })

  for (const docSST of docsSSTVencendo) {
    const dias = diasAteVencimento(docSST.dataVencimento!)
    const tenantId = docSST.empreendimento.tenantId
    const regra = regrasTreino[tenantId] // mesma regra SST
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-documento-sst', {
      tenantId,
      empreendimentoId: docSST.empreendimentoId,
      tipo: 'VENCIMENTO_DOCUMENTO',
      nivel,
      titulo: `Documento SST (${docSST.tipo}) vencendo em ${dias} dia(s)`,
      mensagem: `${docSST.tipo} em ${docSST.empreendimento.nome} vence em ${dias} dias.`,
      entidadeTipo: 'documentoSST',
      entidadeId: docSST.id,
      destinatarioIds,
      canais,
    })
  }

  // ── EPIs vencendo ─────────────────────────────────────────────────────────
  const episVencendo = await prisma.entregaEPI.findMany({
    where: {
      dataVencimento: { lte: dataLimite, gte: hoje },
      status: 'VIGENTE',
    },
    include: {
      funcionario: { select: { nome: true } },
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
    },
  })

  for (const epi of episVencendo) {
    const dias = diasAteVencimento(epi.dataVencimento!)
    const tenantId = epi.empreendimento.tenantId
    const regra = regrasTreino[tenantId] // mesma regra SST
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-epi', {
      tenantId,
      empreendimentoId: epi.empreendimentoId,
      tipo: 'VENCIMENTO_DOCUMENTO',
      nivel,
      titulo: `EPI (${epi.tipoEPI}) vencendo em ${dias} dia(s)`,
      mensagem: `EPI ${epi.tipoEPI} de ${epi.funcionario.nome} em ${epi.empreendimento.nome} vence em ${dias} dias.`,
      entidadeTipo: 'entregaEPI',
      entidadeId: epi.id,
      destinatarioIds,
      canais,
    })
  }

  // ── PGRS vencendo ──────────────────────────────────────────────────────────
  const regrasPGRS = await carregarRegras('vencimento_pgrs')

  const pgrsVencendo = await prisma.pGRS.findMany({
    where: {
      dataVencimento: { lte: dataLimite, gte: hoje },
      status: { in: ['VIGENTE', 'A_RENOVAR'] },
    },
    include: {
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
    },
  })

  for (const pgrs of pgrsVencendo) {
    const dias = diasAteVencimento(pgrs.dataVencimento)
    const tenantId = pgrs.empreendimento.tenantId
    const regra = regrasPGRS[tenantId]
    const horizontes = regra?.horizontes ?? HORIZONTES_PADRAO
    if (!dentroDeHorizonte(dias, horizontes)) continue

    const nivel = dias <= 3 ? 'CRITICO' : dias <= 7 ? 'ALTO' : 'MEDIO'
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const canais = regra?.canais ?? ['app']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)

    await alertaQueue.add('alerta-vencimento-pgrs', {
      tenantId,
      empreendimentoId: pgrs.empreendimentoId,
      tipo: 'VENCIMENTO_DOCUMENTO',
      nivel,
      titulo: `PGRS vencendo em ${dias} dia(s)`,
      mensagem: `PGRS ${pgrs.versao} em ${pgrs.empreendimento.nome} vence em ${dias} dias.`,
      entidadeTipo: 'pgrs',
      entidadeId: pgrs.id,
      destinatarioIds,
      canais,
    })
  }

  // ── Marcar vencidos ────────────────────────────────────────────────────────
  await Promise.all([
    prisma.condicionante.updateMany({
      where: { proximoVencimento: { lt: hoje }, status: 'PENDENTE' as never },
      data: { status: 'VENCIDA' as never },
    }),
    prisma.pGRS.updateMany({
      where: { dataVencimento: { lt: hoje }, status: { in: ['VIGENTE', 'A_RENOVAR'] } },
      data: { status: 'VENCIDO' },
    }),
    prisma.pGRSExigencia.updateMany({
      where: { pgrs: { dataVencimento: { lt: hoje } }, status: 'PENDENTE' },
      data: { status: 'VENCIDO' },
    }),
    prisma.documento.updateMany({
      where: { dataValidade: { lt: hoje }, status: { in: ['APROVADO', 'A_RENOVAR'] as never[] } },
      data: { status: 'VENCIDO' as never },
    }),
    prisma.licencaAmbiental.updateMany({
      where: { dataVencimento: { lt: hoje }, status: { in: ['VIGENTE', 'A_RENOVAR'] as never[] } },
      data: { status: 'VENCIDA' as never },
    }),
    prisma.treinamentoExecucao.updateMany({
      where: { dataVencimento: { lt: hoje }, status: 'REALIZADO' },
      data: { status: 'VENCIDO' },
    }),
    prisma.documentoSST.updateMany({
      where: { dataVencimento: { lt: hoje }, status: 'VIGENTE' },
      data: { status: 'VENCIDO' },
    }),
    prisma.entregaEPI.updateMany({
      where: { dataVencimento: { lt: hoje }, status: 'VIGENTE' },
      data: { status: 'VENCIDO' },
    }),
  ])

  // ── Criar tarefas automáticas para itens vencidos ───────────────────────────
  // Busca itens que acabaram de vencer e cria pendências rastreáveis.
  // A idempotência é garantida pelo tarefa-auto.service (não cria duplicata).

  const licencasVencidas = await prisma.licencaAmbiental.findMany({
    where: { status: 'VENCIDA' as never },
    include: { empreendimento: { select: { id: true, nome: true, tenantId: true } } },
  })
  for (const lic of licencasVencidas) {
    await criarTarefaAutomatica({
      tenantId: lic.empreendimento.tenantId,
      empreendimentoId: lic.empreendimentoId,
      titulo: `Renovar licença ambiental ${lic.tipo} (${lic.numero})`,
      descricao: `Licença ${lic.tipo} nº ${lic.numero} em ${lic.empreendimento.nome} está vencida. Providenciar renovação.`,
      origem: 'REGRA_VENCIMENTO_LICENCA',
      prioridade: 'CRITICA',
      entidadeTipo: 'licencaAmbiental',
      entidadeId: lic.id,
      dataVencimento: lic.dataVencimento,
    })
  }

  const condVencidas = await prisma.condicionante.findMany({
    where: { status: 'VENCIDA' as never },
    include: { empreendimento: { select: { id: true, nome: true, tenantId: true } } },
  })
  for (const cond of condVencidas) {
    await criarTarefaAutomatica({
      tenantId: cond.empreendimento.tenantId,
      empreendimentoId: cond.empreendimentoId,
      titulo: `Cumprir condicionante vencida: ${cond.descricao.slice(0, 80)}`,
      descricao: `Condicionante em ${cond.empreendimento.nome} está vencida sem comprovação.`,
      origem: 'REGRA_CONDICIONANTE',
      prioridade: 'ALTA',
      entidadeTipo: 'condicionante',
      entidadeId: cond.id,
      dataVencimento: cond.proximoVencimento ?? hoje,
    })
  }

  const docsVencidos = await prisma.documento.findMany({
    where: { status: 'VENCIDO' as never },
    include: {
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
      tipoDocumento: { select: { nome: true } },
    },
  })
  for (const doc of docsVencidos) {
    await criarTarefaAutomatica({
      tenantId: doc.empreendimento.tenantId,
      empreendimentoId: doc.empreendimentoId,
      titulo: `Atualizar documento vencido: ${doc.tipoDocumento.nome}`,
      descricao: `${doc.tipoDocumento.nome} em ${doc.empreendimento.nome} está vencido. Providenciar nova versão.`,
      origem: 'REGRA_VENCIMENTO_DOC',
      prioridade: 'ALTA',
      entidadeTipo: 'documento',
      entidadeId: doc.id,
      dataVencimento: doc.dataValidade ?? hoje,
    })
  }

  const treinosVencidos = await prisma.treinamentoExecucao.findMany({
    where: { status: 'VENCIDO' },
    include: {
      tipo: { select: { nome: true, normativa: true } },
      empreendimento: { select: { id: true, nome: true, tenantId: true } },
    },
  })
  for (const treino of treinosVencidos) {
    await criarTarefaAutomatica({
      tenantId: treino.empreendimento.tenantId,
      empreendimentoId: treino.empreendimentoId,
      titulo: `Reciclagem obrigatória: ${treino.tipo.normativa} — ${treino.tipo.nome}`,
      descricao: `Treinamento ${treino.tipo.normativa} em ${treino.empreendimento.nome} está vencido. Agendar reciclagem.`,
      origem: 'REGRA_VENCIMENTO_SST',
      prioridade: 'ALTA',
      entidadeTipo: 'treinamentoExecucao',
      entidadeId: treino.id,
      dataVencimento: treino.dataVencimento ?? hoje,
    })
  }

  const testesVencidos = await prisma.testeEstanqueidade.findMany({
    where: { proximoTeste: { lt: hoje } },
    include: {
      tanque: {
        select: { tenantId: true, empreendimentoId: true, numero: true },
        include: { empreendimento: { select: { nome: true } } },
      },
    },
  })
  for (const teste of testesVencidos) {
    await criarTarefaAutomatica({
      tenantId: teste.tanque.tenantId,
      empreendimentoId: teste.tanque.empreendimentoId,
      titulo: `Realizar teste de estanqueidade — Tanque ${teste.tanque.numero}`,
      descricao: `Teste de estanqueidade do tanque ${teste.tanque.numero} em ${teste.tanque.empreendimento.nome} está vencido. Obrigatório ABNT NBR 13784.`,
      origem: 'REGRA_VENCIMENTO_ESTANQUEIDADE',
      prioridade: 'CRITICA',
      entidadeTipo: 'testeEstanqueidade',
      entidadeId: teste.id,
      dataVencimento: teste.proximoTeste,
    })
  }

  const bombasVencidas = await prisma.bombaAbastecimento.findMany({
    where: { proximaCalibracao: { lt: hoje } },
    include: { empreendimento: { select: { id: true, nome: true, tenantId: true } } },
  })
  for (const bomba of bombasVencidas) {
    await criarTarefaAutomatica({
      tenantId: bomba.empreendimento.tenantId,
      empreendimentoId: bomba.empreendimentoId,
      titulo: `Calibrar bomba nº ${bomba.numero}`,
      descricao: `Bomba ${bomba.numero} em ${bomba.empreendimento.nome} com calibração vencida. Exigência ANP/INMETRO.`,
      origem: 'REGRA_VENCIMENTO_ANP',
      prioridade: 'ALTA',
      entidadeTipo: 'bombaAbastecimento',
      entidadeId: bomba.id,
      dataVencimento: bomba.proximaCalibracao!,
    })
  }

  const pocosVencidos = await prisma.pocoArtesiano.findMany({
    where: { validadeOutorga: { lt: hoje }, status: 'ATIVO' },
    include: { empreendimento: { select: { id: true, nome: true, tenantId: true } } },
  })
  for (const poco of pocosVencidos) {
    await criarTarefaAutomatica({
      tenantId: poco.empreendimento.tenantId,
      empreendimentoId: poco.empreendimentoId,
      titulo: `Renovar outorga hídrica — Poço ${poco.codigo}`,
      descricao: `Outorga hídrica do poço ${poco.codigo} em ${poco.empreendimento.nome} está vencida.`,
      origem: 'REGRA_VENCIMENTO_OUTORGA',
      prioridade: 'ALTA',
      entidadeTipo: 'pocoArtesiano',
      entidadeId: poco.id,
      dataVencimento: poco.validadeOutorga!,
    })
  }

  // PGRS vencidos
  const pgrsVencidos = await prisma.pGRS.findMany({
    where: { status: 'VENCIDO' },
    include: { empreendimento: { select: { id: true, nome: true, tenantId: true } } },
  })
  for (const pgrs of pgrsVencidos) {
    await criarTarefaAutomatica({
      tenantId: pgrs.empreendimento.tenantId,
      empreendimentoId: pgrs.empreendimentoId,
      titulo: `Renovar PGRS vencido — ${pgrs.versao}`,
      descricao: `PGRS ${pgrs.versao} em ${pgrs.empreendimento.nome} está vencido. Providenciar renovação do plano.`,
      origem: 'REGRA_VENCIMENTO_PGRS',
      prioridade: 'CRITICA',
      entidadeTipo: 'pgrs',
      entidadeId: pgrs.id,
      dataVencimento: pgrs.dataVencimento,
    })
  }

  // Exigências PGRS não comprovadas (vencidas)
  const exigenciasVencidas = await prisma.pGRSExigencia.findMany({
    where: { status: 'VENCIDO' },
    include: {
      pgrs: {
        select: {
          tenantId: true,
          empreendimentoId: true,
          versao: true,
          empreendimento: { select: { nome: true } },
        },
      },
    },
  })
  for (const exig of exigenciasVencidas) {
    await criarTarefaAutomatica({
      tenantId: exig.pgrs.tenantId,
      empreendimentoId: exig.pgrs.empreendimentoId,
      titulo: `Comprovar exigência PGRS: ${exig.descricao.slice(0, 60)}`,
      descricao: `Exigência "${exig.descricao}" do PGRS ${exig.pgrs.versao} em ${exig.pgrs.empreendimento.nome} não foi comprovada no prazo.`,
      origem: 'REGRA_VENCIMENTO_PGRS',
      prioridade: 'ALTA',
      entidadeTipo: 'pgrsExigencia',
      entidadeId: exig.id,
      dataVencimento: new Date(),
    })
  }

  console.log(`[scheduler] Vencimentos verificados — ${new Date().toISOString()}`)
}

export async function verificarTarefasAtrasadas(): Promise<void> {
  // Registra tarefas atrasadas via alerta (não muda status — BLOQUEADA tem semântica diferente)
  const agora = new Date()

  const tarefasAtrasadas = await prisma.tarefa.findMany({
    where: {
      dataVencimento: { lt: agora },
      status: { in: ['PENDENTE', 'EM_ANDAMENTO'] as never[] },
    },
    include: {
      empreendimento: { select: { id: true, tenantId: true } },
      responsavel: { select: { id: true } },
    },
  })

  for (const tarefa of tarefasAtrasadas) {
    const tenantId = tarefa.empreendimento.tenantId
    const regra = (await carregarRegras('escalamento'))[tenantId]
    const perfis = regra?.perfis ?? ['ADMIN_TENANT', 'COORDENADOR']
    const destinatarioIds = await resolverDestinatarios(tenantId, perfis)
    if (tarefa.responsavelId && !destinatarioIds.includes(tarefa.responsavelId)) {
      destinatarioIds.push(tarefa.responsavelId)
    }

    await alertaQueue.add('alerta-tarefa-atrasada', {
      tenantId,
      empreendimentoId: tarefa.empreendimentoId,
      tipo: 'TAREFA_ATRASADA',
      nivel: 'ALTO',
      titulo: 'Tarefa atrasada',
      mensagem: `Tarefa "${tarefa.titulo.slice(0, 80)}" está atrasada.`,
      entidadeTipo: 'tarefa',
      entidadeId: tarefa.id,
      destinatarioIds,
      canais: regra?.canais ?? ['app'],
    })
  }

  // ── Follow-ups CRM vencidos ─────────────────────────────────────────────
  const leadsFollowUpVencido = await prisma.leadWhatsApp.findMany({
    where: {
      dataProximoContato: { lt: agora },
      estagio: { notIn: ['GANHO', 'PERDIDO'] },
    },
    select: {
      id: true,
      tenantId: true,
      nome: true,
      numero: true,
      empresa: true,
      responsavelId: true,
      dataProximoContato: true,
    },
  })

  for (const lead of leadsFollowUpVencido) {
    const perfis = ['ADMIN_TENANT', 'COORDENADOR']
    const destinatarioIds = await resolverDestinatarios(lead.tenantId, perfis)
    if (lead.responsavelId && !destinatarioIds.includes(lead.responsavelId)) {
      destinatarioIds.push(lead.responsavelId)
    }

    await alertaQueue.add('alerta-followup-vencido', {
      tenantId: lead.tenantId,
      empreendimentoId: null,
      tipo: 'TAREFA_ATRASADA',
      nivel: 'MEDIO',
      titulo: 'Follow-up de lead atrasado',
      mensagem: `Lead ${lead.nome ?? lead.numero}${lead.empresa ? ` (${lead.empresa})` : ''} — contato previsto para ${lead.dataProximoContato?.toLocaleDateString('pt-BR') ?? '?'} não realizado.`,
      entidadeTipo: 'leadWhatsApp',
      entidadeId: lead.id,
      destinatarioIds,
      canais: ['app'],
    })
  }

  console.log(`[scheduler] Tarefas atrasadas verificadas — ${agora.toISOString()}`)
}
