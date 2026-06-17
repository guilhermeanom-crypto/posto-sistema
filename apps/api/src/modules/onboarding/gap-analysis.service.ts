import { PrismaClient } from '@prisma/client'
import { evaluateAplicabilidade, regraAplicabilidadeSchema } from '../diagnostico/domain/aplicabilidade.js'
import { materialParedeSimples, idadeEmAnos } from '../diagnostico/data/mappers.js'
import type { PerfilEmpreendimento, Porte, SituacaoEmpreendimento } from '../diagnostico/domain/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// GAP ANALYSIS SERVICE
//
// Compara as obrigações regulatórias base (catálogo) contra o que o
// empreendimento tem efetivamente cadastrado no sistema.
//
// DISCRIMINAÇÃO (Fase A da convergência — docs/103): antes de checar evidência,
// filtra pela `aplicabilidade` condicional usando o MESMO motor da fonte única
// (evaluateAplicabilidade). Obrigação que não se aplica ao perfil físico (ex.:
// outorga sem captação, passivo sem tanque antigo) sai como NAO_APLICAVEL — assim
// a tela deixa de ser genérica.
//
// Status possíveis por obrigação:
//   CONFORME   — tem evidência válida e dentro do prazo
//   A_RENOVAR  — tem evidência mas vencida ou próxima do vencimento
//   SEM_DADOS  — nenhuma evidência encontrada (gap real)
//   NAO_APLICAVEL — obrigação não se aplica a este posto (ex: sem poço)
// ─────────────────────────────────────────────────────────────────────────────

export type StatusGap = 'CONFORME' | 'A_RENOVAR' | 'SEM_DADOS' | 'NAO_APLICAVEL'

export type ItemGap = {
  codigo: string
  modulo: string
  descricao: string
  fundamentoLegal: string | null
  periodicidade: string
  criticidade: string
  diasAlertaAntes: number[]
  status: StatusGap
  evidencia: {
    tipo: string
    referencia: string
    dataVencimento: Date | null
    diasRestantes: number | null
  } | null
  tipoDocumentoRef: string | null
  observacoes: string | null
}

export type ResultadoGapAnalysis = {
  empreendimentoId: string
  tipoEmpreendimento: string
  uf: string
  analisadoEm: Date
  totalObrigacoes: number
  conformes: number
  aRenovar: number
  semDados: number
  naoAplicaveis: number
  scoreBase: number // % de obrigações conformes sobre as aplicáveis
  itens: ItemGap[]
}

const HOJE = () => new Date()

function diasRestantes(vencimento: Date | null): number | null {
  if (!vencimento) return null
  // Zera as horas dos dois lados para o resultado não depender da hora de execução
  // (antes comparava o vencimento à meia-noite contra "agora" com a hora atual,
  // o que fazia o mesmo vencimento dar dias diferentes conforme o horário do job).
  const hoje = HOJE()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(vencimento)
  alvo.setHours(0, 0, 0, 0)
  return Math.floor((alvo.getTime() - hoje.getTime()) / 86_400_000)
}

function statusPorVencimento(vencimento: Date | null, diasAlerta: number[]): StatusGap {
  const dias = diasRestantes(vencimento)
  if (dias === null) return 'CONFORME' // sem vencimento = permanente
  const limiteAlerta = diasAlerta[0] ?? 90
  if (dias < 0) return 'A_RENOVAR'
  if (dias <= limiteAlerta) return 'A_RENOVAR'
  return 'CONFORME'
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKERS — um por módulo de obrigação
// Cada checker recebe o empreendimentoId e retorna evidência + status
// ─────────────────────────────────────────────────────────────────────────────

type Checker = (
  prisma: PrismaClient,
  empreendimentoId: string,
  diasAlerta: number[],
) => Promise<{ status: StatusGap; evidencia: ItemGap['evidencia'] }>

const SEM_DADOS: ItemGap['evidencia'] = null
const naoEncontrado = { status: 'SEM_DADOS' as StatusGap, evidencia: SEM_DADOS }

// ── AMBIENTAL ────────────────────────────────────────────────────────────────

const checkLicencaOperacao: Checker = async (prisma, empreendimentoId, diasAlerta) => {
  const licenca = await prisma.licencaAmbiental.findFirst({
    where: {
      empreendimentoId,
      tipo: { in: ['LO', 'LAO', 'LAS', 'LAT'] },
      status: { notIn: ['CANCELADA', 'SUSPENSA'] },
    },
    orderBy: { dataVencimento: 'desc' },
  })
  if (!licenca) return naoEncontrado
  const status = statusPorVencimento(licenca.dataVencimento, diasAlerta)
  return {
    status,
    evidencia: {
      tipo: `Licença Ambiental (${licenca.tipo})`,
      referencia: licenca.numero ?? licenca.orgaoEmissor,
      dataVencimento: licenca.dataVencimento,
      diasRestantes: diasRestantes(licenca.dataVencimento),
    },
  }
}

const checkDocumentoPorNome = (termoBusca: string, label: string): Checker =>
  async (prisma, empreendimentoId, diasAlerta) => {
    const doc = await prisma.documento.findFirst({
      where: {
        empreendimentoId,
        nome: { contains: termoBusca, mode: 'insensitive' },
        status: { notIn: ['REJEITADO', 'SUBSTITUIDO', 'DISPENSADO'] },
      },
      orderBy: { dataValidade: 'desc' },
    })
    if (!doc) return naoEncontrado
    const status = statusPorVencimento(doc.dataValidade, diasAlerta)
    return {
      status,
      evidencia: {
        tipo: label,
        referencia: doc.nome,
        dataVencimento: doc.dataValidade,
        diasRestantes: diasRestantes(doc.dataValidade),
      },
    }
  }

const checkEstanqueidadeTanques: Checker = async (prisma, empreendimentoId, diasAlerta) => {
  // Tem tanques cadastrados?
  const tanques = await prisma.tanque.findMany({
    where: { empreendimentoId, status: 'ATIVO' },
    include: { testes: { orderBy: { dataExecucao: 'desc' }, take: 1 } },
  })
  if (tanques.length === 0) return { status: 'NAO_APLICAVEL', evidencia: null }

  // Algum tanque tem teste recente aprovado?
  const comTeste = tanques.filter(
    (t) => t.testes.length > 0 && t.testes[0]!.resultado === 'APROVADO',
  )
  if (comTeste.length === 0) return naoEncontrado

  const ultimoTeste = tanques
    .flatMap((t) => t.testes)
    .sort((a, b) => b.dataExecucao.getTime() - a.dataExecucao.getTime())[0]!

  const proximo = ultimoTeste.proximoTeste
  const status = statusPorVencimento(proximo, diasAlerta)
  return {
    status,
    evidencia: {
      tipo: 'Teste de Estanqueidade',
      referencia: `${comTeste.length}/${tanques.length} tanques testados`,
      dataVencimento: proximo,
      diasRestantes: diasRestantes(proximo),
    },
  }
}

// ── ANP / INMETRO ─────────────────────────────────────────────────────────────

const checkRegistroANP: Checker = async (prisma, empreendimentoId, diasAlerta) => {
  const doc = await prisma.documento.findFirst({
    where: {
      empreendimentoId,
      nome: { contains: 'ANP', mode: 'insensitive' },
      status: { notIn: ['REJEITADO', 'SUBSTITUIDO', 'DISPENSADO'] },
    },
  })
  if (!doc) return naoEncontrado
  const status = statusPorVencimento(doc.dataValidade, diasAlerta)
  return {
    status,
    evidencia: {
      tipo: 'Registro ANP',
      referencia: doc.nome,
      dataVencimento: doc.dataValidade,
      diasRestantes: diasRestantes(doc.dataValidade),
    },
  }
}

const checkCalibracaoBombas: Checker = async (prisma, empreendimentoId, diasAlerta) => {
  const bombas = await prisma.bombaAbastecimento.findMany({
    where: { empreendimentoId, status: 'ATIVO' },
  })
  if (bombas.length === 0) return { status: 'NAO_APLICAVEL', evidencia: null }

  const comCalibracao = bombas.filter((b) => b.proximaCalibracao !== null)
  if (comCalibracao.length === 0) return naoEncontrado

  const proxima = comCalibracao
    .map((b) => b.proximaCalibracao!)
    .sort((a, b) => a.getTime() - b.getTime())[0]!

  const status = statusPorVencimento(proxima, diasAlerta)
  return {
    status,
    evidencia: {
      tipo: 'Calibração INMETRO — Bombas',
      referencia: `${comCalibracao.length}/${bombas.length} bombas calibradas`,
      dataVencimento: proxima,
      diasRestantes: diasRestantes(proxima),
    },
  }
}

const checkSCANC: Checker = async (prisma, empreendimentoId, _diasAlerta) => {
  const doc = await prisma.documento.findFirst({
    where: {
      empreendimentoId,
      nome: { contains: 'SCANC', mode: 'insensitive' },
      status: { notIn: ['REJEITADO', 'SUBSTITUIDO'] },
    },
    orderBy: { criadoEm: 'desc' },
  })
  if (!doc) return naoEncontrado
  return {
    status: 'CONFORME',
    evidencia: {
      tipo: 'Comprovante SCANC',
      referencia: doc.nome,
      dataVencimento: null,
      diasRestantes: null,
    },
  }
}

// ── SST ───────────────────────────────────────────────────────────────────────

const checkDocumentoSST = (tipo: string, label: string): Checker =>
  async (prisma, empreendimentoId, diasAlerta) => {
    const doc = await prisma.documentoSST.findFirst({
      where: {
        empreendimentoId,
        tipo,
        status: { notIn: ['VENCIDO'] },
      },
      orderBy: { dataVencimento: 'desc' },
    })
    if (!doc) return naoEncontrado
    const status = statusPorVencimento(doc.dataVencimento, diasAlerta)
    return {
      status,
      evidencia: {
        tipo: label,
        referencia: doc.responsavel ?? tipo,
        dataVencimento: doc.dataVencimento,
        diasRestantes: diasRestantes(doc.dataVencimento),
      },
    }
  }

const checkASO: Checker = async (prisma, empreendimentoId, diasAlerta) => {
  const aso = await prisma.aSO.findFirst({
    where: {
      empreendimentoId,
      aptidao: { in: ['APTO', 'APTO_RESTRICOES'] },
    },
    orderBy: { dataVencimento: 'desc' },
  })
  if (!aso) return naoEncontrado
  const status = statusPorVencimento(aso.dataVencimento, diasAlerta)
  return {
    status,
    evidencia: {
      tipo: 'ASO',
      referencia: aso.funcionarioNome,
      dataVencimento: aso.dataVencimento,
      diasRestantes: diasRestantes(aso.dataVencimento),
    },
  }
}

const checkTreinamento = (termoBusca: string, label: string): Checker =>
  async (prisma, empreendimentoId, diasAlerta) => {
    // Busca o tipo de treinamento pelo nome
    const execucao = await prisma.treinamentoExecucao.findFirst({
      where: {
        empreendimentoId,
        status: { in: ['REALIZADO'] },
        tipo: { nome: { contains: termoBusca, mode: 'insensitive' } },
      },
      include: { tipo: true },
      orderBy: { dataVencimento: 'desc' },
    })
    if (!execucao) return naoEncontrado
    const status = statusPorVencimento(execucao.dataVencimento, diasAlerta)
    return {
      status,
      evidencia: {
        tipo: label,
        referencia: execucao.tipo.nome,
        dataVencimento: execucao.dataVencimento,
        diasRestantes: diasRestantes(execucao.dataVencimento),
      },
    }
  }

const checkEPI: Checker = async (prisma, empreendimentoId, diasAlerta) => {
  const entrega = await prisma.entregaEPI.findFirst({
    where: { empreendimentoId, status: 'VIGENTE' },
    orderBy: { dataVencimento: 'desc' },
  })
  if (!entrega) return naoEncontrado
  const status = statusPorVencimento(entrega.dataVencimento, diasAlerta)
  return {
    status,
    evidencia: {
      tipo: 'Entrega de EPI',
      referencia: entrega.tipoEPI,
      dataVencimento: entrega.dataVencimento,
      diasRestantes: diasRestantes(entrega.dataVencimento),
    },
  }
}

// ── URBANÍSTICO ───────────────────────────────────────────────────────────────

const checkAlvara = (tipo: string, label: string): Checker =>
  async (prisma, empreendimentoId, diasAlerta) => {
    const alvara = await prisma.alvaraUrbanistico.findFirst({
      where: {
        empreendimentoId,
        tipo: tipo as never,
        status: { notIn: ['CANCELADA', 'SUSPENSA'] },
      },
      orderBy: { dataVencimento: 'desc' },
    })
    if (!alvara) return naoEncontrado
    const status = statusPorVencimento(alvara.dataVencimento, diasAlerta)
    return {
      status,
      evidencia: {
        tipo: label,
        referencia: alvara.numero ?? alvara.orgaoEmissor,
        dataVencimento: alvara.dataVencimento,
        diasRestantes: diasRestantes(alvara.dataVencimento),
      },
    }
  }

const checkDocumentoPorCategoria = (categoria: string, label: string): Checker =>
  async (prisma, empreendimentoId, diasAlerta) => {
    const doc = await prisma.documento.findFirst({
      where: {
        empreendimentoId,
        tipoDocumento: { categoria: categoria as never },
        status: { notIn: ['REJEITADO', 'SUBSTITUIDO', 'DISPENSADO'] },
      },
      orderBy: { dataValidade: 'desc' },
    })
    if (!doc) return naoEncontrado
    const status = statusPorVencimento(doc.dataValidade, diasAlerta)
    return {
      status,
      evidencia: {
        tipo: label,
        referencia: doc.nome,
        dataVencimento: doc.dataValidade,
        diasRestantes: diasRestantes(doc.dataValidade),
      },
    }
  }

// ── MONITORAMENTO ─────────────────────────────────────────────────────────────

const checkCampanhaMonitoramento: Checker = async (prisma, empreendimentoId, _diasAlerta) => {
  const campanha = await prisma.campanhaMonitoramento.findFirst({
    where: {
      empreendimentoId,
      tipo: { in: ['AGUA_SUBTERRANEA', 'SOLO'] },
    },
    orderBy: { dataColeta: 'desc' },
  })
  if (!campanha) return naoEncontrado

  // Considera válida se a última campanha foi há menos de 8 meses (semestral + tolerância)
  const diasUltimaCampanha =
    (HOJE().getTime() - campanha.dataColeta.getTime()) / 86_400_000
  const status = diasUltimaCampanha > 240 ? 'A_RENOVAR' : 'CONFORME'
  return {
    status,
    evidencia: {
      tipo: 'Campanha de Monitoramento',
      referencia: `${campanha.laboratorio} — ${campanha.dataColeta.toISOString().slice(0, 10)}`,
      dataVencimento: null,
      diasRestantes: null,
    },
  }
}

const checkPocosMonitoramento: Checker = async (prisma, empreendimentoId, _diasAlerta) => {
  const poco = await prisma.pocoMonitoramento.findFirst({
    where: { empreendimentoId, status: 'ATIVO' },
  })
  if (!poco) return { status: 'NAO_APLICAVEL', evidencia: null }
  return {
    status: 'CONFORME',
    evidencia: {
      tipo: 'Poço de Monitoramento',
      referencia: poco.codigo,
      dataVencimento: poco.proximaColeta,
      diasRestantes: diasRestantes(poco.proximaColeta),
    },
  }
}

const checkOutorga: Checker = async (prisma, empreendimentoId, diasAlerta) => {
  const poco = await prisma.pocoArtesiano.findFirst({
    where: { empreendimentoId, status: 'ATIVO' },
  })
  if (!poco) return { status: 'NAO_APLICAVEL', evidencia: null }
  const status = statusPorVencimento(poco.validadeOutorga, diasAlerta)
  return {
    status: poco.outorgaDAEE ? status : 'SEM_DADOS',
    evidencia: poco.outorgaDAEE
      ? {
          tipo: 'Outorga Hídrica',
          referencia: poco.outorgaDAEE,
          dataVencimento: poco.validadeOutorga,
          diasRestantes: diasRestantes(poco.validadeOutorga),
        }
      : null,
  }
}

// ── LOGÍSTICA REVERSA ─────────────────────────────────────────────────────────

const checkMTR = (_termoResiduo: string, label: string): Checker =>
  async (prisma, empreendimentoId, _diasAlerta) => {
    const mtr = await prisma.mTR.findFirst({
      where: {
        empreendimentoId,
        status: { in: ['DESTINADO', 'ENCERRADO', 'COLETADO'] },
      },
      orderBy: { dataEmissao: 'desc' },
    })
    if (!mtr) return naoEncontrado

    // MTR recente = últimos 120 dias
    const diasUltimoMTR =
      (HOJE().getTime() - mtr.dataEmissao.getTime()) / 86_400_000
    const status = diasUltimoMTR > 120 ? 'A_RENOVAR' : 'CONFORME'
    return {
      status,
      evidencia: {
        tipo: label,
        referencia: mtr.numeroMTR ?? mtr.id.slice(0, 8),
        dataVencimento: null,
        diasRestantes: null,
      },
    }
  }

// ─────────────────────────────────────────────────────────────────────────────
// MAPA: codigo → checker
// ─────────────────────────────────────────────────────────────────────────────

const CHECKERS: Record<string, Checker> = {
  // Ambiental
  'AMB-001': checkLicencaOperacao,
  'AMB-002': checkDocumentoPorNome('PGRS', 'PGRS — Plano de Gerenciamento de Resíduos'),
  'AMB-003': checkDocumentoPorNome('PAE', 'PAE — Plano de Atendimento a Emergências'),
  'AMB-004': checkEstanqueidadeTanques,
  'AMB-005': checkDocumentoPorNome('tubulação', 'Laudo de Estanqueidade de Tubulações'),
  'AMB-006': checkDocumentoPorNome('passivo', 'Relatório de Passivo Ambiental'),

  // ANP / INMETRO
  'ANP-001': checkRegistroANP,
  'ANP-002': checkCalibracaoBombas,
  'ANP-003': checkSCANC,
  'ANP-004': checkDocumentoPorNome('qualidade', 'Laudo de Qualidade de Combustíveis'),
  'ANP-005': checkDocumentoPorNome('medição', 'Registro de Medição de Tanques'),

  // SST
  'SST-001': checkDocumentoSST('PGR', 'PGR — Programa de Gerenciamento de Riscos'),
  'SST-002': checkDocumentoSST('PCMSO', 'PCMSO'),
  'SST-003': checkASO,
  'SST-004': checkDocumentoSST('LTCAT', 'Laudo de Insalubridade/Periculosidade'),
  'SST-005': checkTreinamento('brigada', 'Treinamento de Brigada'),
  'SST-006': checkTreinamento('NR-20', 'Treinamento NR-20'),
  'SST-007': checkEPI,
  'SST-008': checkDocumentoSST('PPCI_SST', 'CIPA — Documentação'),

  // Urbanístico
  'URB-001': checkAlvara('AVCB', 'AVCB — Auto de Vistoria do Corpo de Bombeiros'),
  'URB-002': checkAlvara('ALVARA_FUNCIONAMENTO', 'Alvará de Funcionamento'),
  'URB-003': checkAlvara('LICENCA_SANITARIA', 'Licença Sanitária'),
  'URB-004': checkDocumentoPorNome('extintor', 'Laudo de Manutenção de Extintores'),
  'URB-005': checkDocumentoPorNome('SPDA', 'Laudo Elétrico e SPDA'),
  'URB-006': checkDocumentoPorCategoria('ART_RRT', 'ART/RRT do Responsável Técnico'),

  // Monitoramento
  'MON-001': checkCampanhaMonitoramento,
  'MON-002': checkDocumentoPorNome('monitoramento ambiental', 'Relatório de Monitoramento Ambiental'),
  'MON-003': checkPocosMonitoramento,
  'MON-004': checkOutorga,

  // Logística Reversa
  'LOG-001': checkMTR('OLEO', 'MTR — OLUC (Óleo Lubrificante Usado)'),
  'LOG-002': checkMTR('FILTRO', 'MTR — Filtros de Óleo'),
  'LOG-003': checkDocumentoPorNome('embalagem', 'Comprovante de Devolução de Embalagens'),
  'LOG-004': checkDocumentoPorNome('pneu', 'Comprovante de Destinação de Pneus'),
  'LOG-005': checkDocumentoPorNome('SIGOR', 'Declaração Anual SIGOR'),
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function executarGapAnalysis(
  prisma: PrismaClient,
  empreendimentoId: string,
  tenantId: string,
): Promise<ResultadoGapAnalysis> {
  const empreendimento = await prisma.empreendimento.findFirst({
    where: { id: empreendimentoId, tenantId },
  })
  if (!empreendimento) throw new Error('Empreendimento não encontrado')

  // Normaliza o tipo do empreendimento para o vocabulário do catálogo
  const TIPO_NORMALIZADO: Record<string, string> = {
    POSTO_COMBUSTIVEL: 'revendedor',
    revendedor: 'revendedor',
    distribuidor: 'distribuidor',
    transportador: 'transportador',
    outros: 'outros',
  }
  const tipoEmpreendimento =
    TIPO_NORMALIZADO[empreendimento.tipo ?? ''] ?? 'revendedor'
  const uf = empreendimento.estado

  // Busca obrigações aplicáveis: tipo do posto + (sem UF = nacional, ou UF específica)
  const obrigacoes = await prisma.obrigacaoRegulatoriaBase.findMany({
    where: {
      ativo: true,
      tipoEmpreendimento: { in: [tipoEmpreendimento, 'todos'] },
      OR: [{ uf: null }, { uf }],
    },
    orderBy: [{ modulo: 'asc' }, { codigo: 'asc' }],
  })

  // ── Perfil físico p/ a discriminação (mesma base do motor calibrado) ──────────
  // gap-analysis já decidiu que é um posto (tipoEmpreendimento) → se o CNAE não
  // estiver preenchido, assume revendedor (4731) para a regra de CNAE passar e a
  // discriminação recair nos condicionais FÍSICOS (captação, idade do tanque, SAO).
  const tanquesPerfil = await prisma.tanque.findMany({
    where: { empreendimentoId, status: { in: ['ATIVO', 'INTERDITADO'] } },
    select: { materialTanque: true, dataInstalacao: true },
  })
  const dataRef = new Date()
  const perfil: PerfilEmpreendimento = {
    cnaePrincipal: empreendimento.cnaePrincipal ?? (tipoEmpreendimento === 'revendedor' ? '4731-8/00' : null),
    cnaesSecundarios: empreendimento.cnaesSecundarios ?? [],
    porte: (empreendimento.porte as Porte | null) ?? null,
    situacao: (empreendimento.situacaoEmpreendimento as SituacaoEmpreendimento | null) ?? null,
    uf,
    potencialPoluidor: null,
    areaM2: empreendimento.areaM2 == null ? null : Number(empreendimento.areaM2),
    possuiCaptacao: empreendimento.possuiCaptacao ?? false,
    possuiSAO: empreendimento.possuiSAO ?? false,
    tanques: tanquesPerfil.map((t) => ({
      paredeSimples: materialParedeSimples(t.materialTanque),
      idadeAnos: idadeEmAnos(t.dataInstalacao, dataRef),
    })),
  }

  const itens: ItemGap[] = []

  for (const obrigacao of obrigacoes) {
    // Discriminação condicional: se a regra existe e NÃO se aplica → NAO_APLICAVEL
    const regra = regraAplicabilidadeSchema.safeParse(obrigacao.aplicabilidade)
    if (regra.success) {
      const ap = evaluateAplicabilidade(regra.data, perfil)
      if (!ap.aplicavel) {
        itens.push({
          codigo: obrigacao.codigo,
          modulo: obrigacao.modulo,
          descricao: obrigacao.descricao,
          fundamentoLegal: obrigacao.fundamentoLegal,
          periodicidade: obrigacao.periodicidade,
          criticidade: obrigacao.criticidade,
          diasAlertaAntes: obrigacao.diasAlertaAntes,
          status: 'NAO_APLICAVEL',
          evidencia: null,
          tipoDocumentoRef: obrigacao.tipoDocumentoRef,
          observacoes: `Não se aplica a este posto — ${ap.motivo}`,
        })
        continue
      }
    }

    const checker = CHECKERS[obrigacao.codigo]
    let status: StatusGap = 'SEM_DADOS'
    let evidencia: ItemGap['evidencia'] = null

    if (checker) {
      try {
        const resultado = await checker(prisma, empreendimentoId, obrigacao.diasAlertaAntes)
        status = resultado.status
        evidencia = resultado.evidencia
      } catch {
        // Checker falhou — mantém SEM_DADOS
      }
    }

    itens.push({
      codigo: obrigacao.codigo,
      modulo: obrigacao.modulo,
      descricao: obrigacao.descricao,
      fundamentoLegal: obrigacao.fundamentoLegal,
      periodicidade: obrigacao.periodicidade,
      criticidade: obrigacao.criticidade,
      diasAlertaAntes: obrigacao.diasAlertaAntes,
      status,
      evidencia,
      tipoDocumentoRef: obrigacao.tipoDocumentoRef,
      observacoes: obrigacao.observacoes,
    })
  }

  const aplicaveis = itens.filter((i) => i.status !== 'NAO_APLICAVEL')
  const conformes = itens.filter((i) => i.status === 'CONFORME').length
  const aRenovar = itens.filter((i) => i.status === 'A_RENOVAR').length
  const semDados = itens.filter((i) => i.status === 'SEM_DADOS').length
  const naoAplicaveis = itens.filter((i) => i.status === 'NAO_APLICAVEL').length
  const scoreBase =
    aplicaveis.length > 0
      ? Math.round((conformes / aplicaveis.length) * 100)
      : 0

  return {
    empreendimentoId,
    tipoEmpreendimento,
    uf,
    analisadoEm: new Date(),
    totalObrigacoes: obrigacoes.length,
    conformes,
    aRenovar,
    semDados,
    naoAplicaveis,
    scoreBase,
    itens,
  }
}
