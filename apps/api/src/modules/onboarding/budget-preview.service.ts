import type {
  PoliticaPrecificacaoDiagnostico,
  PrismaClient,
  ServicoCatalogo,
} from '@prisma/client'
import { executarGapAnalysis, type StatusGap } from './gap-analysis.service.js'

export type PerfilOrcamentoInput = {
  porte?: 'pequeno' | 'medio' | 'grande'
  situacao?: 'implantacao' | 'operacao' | 'irregular' | 'ampliacao'
  potencialPoluidor?: 'baixo' | 'medio' | 'alto' | 'muito_alto'
  areaM2?: number
}

export type PreviewOrcamentoOptions = {
  tenantId: string
  empreendimentoId: string
  perfil?: PerfilOrcamentoInput
  incluirStatus?: Array<Extract<StatusGap, 'SEM_DADOS' | 'A_RENOVAR' | 'CONFORME'>>
  apenasCodigos?: string[]
}

export type ItemPreviewOrcamento = {
  servicoCodigo: string
  servicoNome: string
  categoria: string
  subcategoria: string | null
  obrigacaoCodigo: string | null
  obrigacaoDescricao: string | null
  statusGap: StatusGap | null
  horasBase: number
  horasAjustadas: number
  valorHora: number
  fatorComplexidade: number
  subtotal: number
  desconto: number
  total: number
  metadata: Record<string, unknown>
}

export type PreviewOrcamentoResultado = {
  empreendimentoId: string
  perfil: Required<PerfilOrcamentoInput>
  premissas: {
    origemPolitica: string
    incluiStatus: Array<Extract<StatusGap, 'SEM_DADOS' | 'A_RENOVAR' | 'CONFORME'>>
    multiplierEmpresa: number
    descontoCategoriaPercentual: number
    descontoVolumePercentual: number
    descontoTotalPercentual: number
    validadePropostaDias: number
  }
  resumo: {
    totalServicos: number
    horasTotais: number
    subtotalTecnico: number
    descontoVolume: number
    totalEstimado: number
    ticketMedio: number
  }
  itens: ItemPreviewOrcamento[]
  categorias: Array<{ categoria: string; quantidade: number; total: number }>
  gapsCobertos: Array<{
    codigo: string
    descricao: string
    status: StatusGap
    servicoCodigo: string | null
    servicoNome: string | null
  }>
}

function decimalToNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber()
  }
  return Number(value ?? 0)
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function inferirSituacao(statusCompliance?: string | null): Required<PerfilOrcamentoInput>['situacao'] {
  if (statusCompliance === 'CRITICO' || statusCompliance === 'EMERGENCIA') return 'irregular'
  return 'operacao'
}

function carregarPerfilPadrao(
  perfil: PerfilOrcamentoInput | undefined,
  statusCompliance?: string | null,
): Required<PerfilOrcamentoInput> {
  return {
    porte: perfil?.porte ?? 'medio',
    situacao: perfil?.situacao ?? inferirSituacao(statusCompliance),
    potencialPoluidor: perfil?.potencialPoluidor ?? 'alto',
    areaM2: perfil?.areaM2 ?? 0,
  }
}

function calcularMultiplicadorEmpresa(
  politica: PoliticaPrecificacaoDiagnostico,
  perfil: Required<PerfilOrcamentoInput>,
) {
  let multiplier = 1

  if (perfil.porte === 'pequeno') multiplier *= decimalToNumber(politica.portePequenoMultiplier)
  if (perfil.porte === 'medio') multiplier *= decimalToNumber(politica.porteMedioMultiplier)
  if (perfil.porte === 'grande') multiplier *= decimalToNumber(politica.porteGrandeMultiplier)

  if (perfil.situacao === 'implantacao') multiplier *= decimalToNumber(politica.situacaoImplantacaoMultiplier)
  if (perfil.situacao === 'operacao') multiplier *= decimalToNumber(politica.situacaoOperacaoMultiplier)
  if (perfil.situacao === 'irregular') multiplier *= decimalToNumber(politica.situacaoIrregularMultiplier)
  if (perfil.situacao === 'ampliacao') multiplier *= decimalToNumber(politica.situacaoAmpliacaoMultiplier)

  if (perfil.potencialPoluidor === 'alto') multiplier *= decimalToNumber(politica.potencialAltoMultiplier)
  if (perfil.potencialPoluidor === 'muito_alto') multiplier *= decimalToNumber(politica.potencialMuitoAltoMultiplier)

  if (perfil.areaM2 > 50000) multiplier *= decimalToNumber(politica.areaGrandeMultiplier)
  else if (perfil.areaM2 > 10000) multiplier *= decimalToNumber(politica.areaMediaMultiplier)

  return round2(multiplier)
}

function calcularDescontoPercentual(
  politica: PoliticaPrecificacaoDiagnostico,
  servicos: ServicoCatalogo[],
) {
  const categoriaCount = new Map<string, number>()
  for (const servico of servicos) {
    categoriaCount.set(servico.categoria, (categoriaCount.get(servico.categoria) ?? 0) + 1)
  }

  const descontoCategoria =
    Array.from(categoriaCount.values()).some((count) => count >= 3)
      ? decimalToNumber(politica.descontoCategoria3Plus)
      : 0

  const descontoVolume =
    servicos.length >= 5 ? decimalToNumber(politica.descontoVolume5Plus) : 0

  const descontoMaximo = decimalToNumber(politica.descontoMaximo)
  const descontoTotal = Math.min(descontoMaximo, descontoCategoria + descontoVolume)

  return {
    descontoCategoria: round2(descontoCategoria),
    descontoVolume: round2(descontoVolume),
    descontoTotal: round2(descontoTotal),
  }
}

function normalizarMetadata(metadata: unknown) {
  return (metadata && typeof metadata === 'object' ? metadata : {}) as Record<string, unknown>
}

export async function gerarPreviewOrcamentoDiagnostico(
  prisma: PrismaClient,
  options: PreviewOrcamentoOptions,
): Promise<PreviewOrcamentoResultado> {
  const { tenantId, empreendimentoId, perfil, apenasCodigos } = options
  const incluirStatus = options.incluirStatus ?? ['SEM_DADOS', 'A_RENOVAR']

  const [gap, politica, empreendimento, snapshot] = await Promise.all([
    executarGapAnalysis(prisma, empreendimentoId, tenantId),
    prisma.politicaPrecificacaoDiagnostico.findUnique({ where: { tenantId } }),
    prisma.empreendimento.findFirst({
      where: { id: empreendimentoId, tenantId },
      select: { id: true, nome: true },
    }),
    prisma.complianceSnapshot.findFirst({
      where: { tenantId, empreendimentoId },
      orderBy: { calculadoEm: 'desc' },
      select: { statusCompliance: true },
    }),
  ])

  if (!empreendimento) throw new Error('Empreendimento não encontrado')
  if (!politica) throw new Error('Política de precificação do diagnóstico não encontrada para o tenant')

  const perfilAplicado = carregarPerfilPadrao(perfil, snapshot?.statusCompliance)

  const gapsSelecionados = gap.itens.filter((item) => {
    if (!incluirStatus.includes(item.status as Extract<StatusGap, 'SEM_DADOS' | 'A_RENOVAR' | 'CONFORME'>)) return false
    if (apenasCodigos && apenasCodigos.length > 0 && !apenasCodigos.includes(item.codigo)) return false
    return true
  })

  const servicos = await prisma.servicoCatalogo.findMany({
    where: {
      ativo: true,
      obrigacaoBaseCodigo: { in: gapsSelecionados.map((item) => item.codigo) },
    },
    orderBy: [{ categoria: 'asc' }, { codigo: 'asc' }],
  })

  const servicoPorObrigacao = new Map(servicos.map((servico) => [servico.obrigacaoBaseCodigo, servico]))
  const multiplicadorEmpresa = calcularMultiplicadorEmpresa(politica, perfilAplicado)
  const descontos = calcularDescontoPercentual(politica, servicos)

  const itens: ItemPreviewOrcamento[] = gapsSelecionados
    .map((gapItem): ItemPreviewOrcamento | null => {
      const servico = servicoPorObrigacao.get(gapItem.codigo)
      if (!servico) return null

      const horasBase = decimalToNumber(servico.horasTecnicasBase)
      const valorHora = decimalToNumber(servico.valorReferenciaHora)
      const fatorComplexidade = decimalToNumber(servico.fatorComplexidade)
      const horasAjustadas = round2(horasBase * multiplicadorEmpresa)
      const subtotal = round2(horasAjustadas * valorHora * fatorComplexidade)
      const desconto = round2(subtotal * descontos.descontoTotal)
      const total = round2(subtotal - desconto)

      return {
        servicoCodigo: servico.codigo,
        servicoNome: servico.nome,
        categoria: servico.categoria,
        subcategoria: servico.subcategoria,
        obrigacaoCodigo: gapItem.codigo,
        obrigacaoDescricao: gapItem.descricao,
        statusGap: gapItem.status,
        horasBase,
        horasAjustadas,
        valorHora,
        fatorComplexidade,
        subtotal,
        desconto,
        total,
        metadata: normalizarMetadata(servico.metadata),
      }
    })
    .filter((item): item is ItemPreviewOrcamento => item !== null)

  const subtotalTecnico = round2(itens.reduce((acc, item) => acc + item.subtotal, 0))
  const descontoVolume = round2(itens.reduce((acc, item) => acc + item.desconto, 0))
  const totalEstimado = round2(subtotalTecnico - descontoVolume)
  const horasTotais = round2(itens.reduce((acc, item) => acc + item.horasAjustadas, 0))

  const categoriasMap = new Map<string, { quantidade: number; total: number }>()
  for (const item of itens) {
    const existente = categoriasMap.get(item.categoria) ?? { quantidade: 0, total: 0 }
    categoriasMap.set(item.categoria, {
      quantidade: existente.quantidade + 1,
      total: round2(existente.total + item.total),
    })
  }

  const categorias = Array.from(categoriasMap.entries())
    .map(([categoria, data]) => ({ categoria, ...data }))
    .sort((a, b) => b.total - a.total)

  const gapsCobertos = gapsSelecionados.map((item) => {
    const servico = servicoPorObrigacao.get(item.codigo)
    return {
      codigo: item.codigo,
      descricao: item.descricao,
      status: item.status,
      servicoCodigo: servico?.codigo ?? null,
      servicoNome: servico?.nome ?? null,
    }
  })

  return {
    empreendimentoId: empreendimento.id,
    perfil: perfilAplicado,
    premissas: {
      origemPolitica: politica.nome,
      incluiStatus: incluirStatus,
      multiplierEmpresa: multiplicadorEmpresa,
      descontoCategoriaPercentual: descontos.descontoCategoria,
      descontoVolumePercentual: descontos.descontoVolume,
      descontoTotalPercentual: descontos.descontoTotal,
      validadePropostaDias: politica.validadePropostaDias,
    },
    resumo: {
      totalServicos: itens.length,
      horasTotais,
      subtotalTecnico,
      descontoVolume,
      totalEstimado,
      ticketMedio: itens.length > 0 ? round2(totalEstimado / itens.length) : 0,
    },
    itens,
    categorias,
    gapsCobertos,
  }
}
