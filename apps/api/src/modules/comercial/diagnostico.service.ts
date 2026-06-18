import { DiagnosticoInput, DiagnosticoResultado, RecomendacaoServico } from './diagnostico.types.js'
import { prisma } from '../../infra/database/prisma.js'

// Matriz Regulatória Hardcoded para a Onda 2.7 (MVP de Diagnóstico)
// Em uma fase futura, isso pode ser movido para o banco de dados.
const REGULATORY_MATRIX: Record<string, any> = {
  '4731-8/00': {
    descricao: 'Comércio varejista de combustíveis para veículos automotores',
    riscoNivel: 'ALTO',
    potencialPoluidor: 'ALTO',
    licenciamentoTipo: 'Licenciamento Ambiental com EIA/RIMA ou RCA/PCA',
    orgaoCompetente: 'Órgão Estadual (ex: CETESB/SEMAD)',
    esfera: 'ESTADUAL',
    necessitaEIA: false, // Depende do porte, mas geralmente RCA/PCA
    necessitaOutorga: true,
    necessitaMonitoramento: true,
    impactos: ['Contaminação de solo e lençol freático', 'Emissões atmosféricas', 'Resíduos perigosos'],
    servicosBase: ['LIC-004', 'LIC-008', 'LIC-011', 'OUT-015', 'MON-008', 'EST-002']
  },
  '4520-0/01': {
    descricao: 'Serviços de manutenção e reparação mecânica de veículos automotores',
    riscoNivel: 'MEDIO',
    potencialPoluidor: 'MEDIO',
    licenciamentoTipo: 'Licenciamento Simplificado ou Ordinário',
    orgaoCompetente: 'Órgão Municipal ou Estadual',
    esfera: 'MUNICIPAL',
    necessitaEIA: false,
    necessitaOutorga: false,
    necessitaMonitoramento: true,
    impactos: ['Geração de resíduos oleosos', 'Efluentes industriais'],
    servicosBase: ['LIC-001', 'LIC-011', 'LIC-014']
  },
  '4520-0/05': {
    descricao: 'Serviços de lavagem, lubrificação e polimento de veículos automotores',
    riscoNivel: 'MEDIO',
    potencialPoluidor: 'ALTO', // Devido ao consumo de água e efluentes
    licenciamentoTipo: 'Licenciamento Ambiental / Outorga de Lançamento',
    orgaoCompetente: 'Órgão Municipal',
    esfera: 'MUNICIPAL',
    necessitaEIA: false,
    necessitaOutorga: true,
    necessitaMonitoramento: true,
    impactos: ['Alto consumo de água', 'Efluentes com óleos e graxas'],
    servicosBase: ['LIC-001', 'OUT-004', 'OUT-015', 'LIC-014']
  }
}

type CnaeData = (typeof REGULATORY_MATRIX)[string]
type MatrizRow = Awaited<ReturnType<typeof prisma.regulatoryMatrix.findMany>>[number]

export class DiagnosticoService {
  /**
   * Resolve os dados regulatórios de um CNAE pela tabela RegulatoryMatrix (fonte única).
   * Matching exato → prefixo → grupo (4 díg.). Fallback: matriz hardcoded legada.
   */
  private async resolverCnae(code: string, rows: MatrizRow[]): Promise<CnaeData | null> {
    const n = code.replace(/\D/g, '')
    const dig = (c: string) => c.replace(/\D/g, '')
    const row =
      rows.find((r) => dig(r.cnaeCodigo) === n) ??
      rows.find((r) => n.startsWith(dig(r.cnaeCodigo))) ??
      rows.find((r) => dig(r.cnaeCodigo).startsWith(n.slice(0, 4)))
    if (row) {
      const cnae = await prisma.cnae.findFirst({ where: { codigo: code }, select: { descricao: true } }).catch(() => null)
      return {
        descricao: cnae?.descricao ?? row.cnaeCodigo,
        riscoNivel: row.classeRisco ?? 'MEDIO',
        potencialPoluidor: row.potencialPoluidor ?? 'MEDIO',
        licenciamentoTipo: row.licenciamentoTipo ?? 'Licenciamento Ambiental',
        orgaoCompetente: row.orgaoCompetente ?? 'Órgão Ambiental',
        esfera: row.esfera ?? 'ESTADUAL',
        necessitaEIA: row.necessitaEIA,
        necessitaOutorga: row.necessitaOutorga,
        necessitaMonitoramento: row.necessitaMonitoramento,
        impactos: row.impactos ?? [],
        servicosBase: row.servicosRecomendados ?? [],
      }
    }
    // Fallback legado: CNAEs ainda não migrados para a tabela
    return REGULATORY_MATRIX[code] ?? REGULATORY_MATRIX[n] ?? null
  }

  async gerarDiagnostico(input: DiagnosticoInput): Promise<DiagnosticoResultado> {
    // 1. Identificar CNAE principal (usamos o primeiro da lista que tiver na matriz)
    let cnaeData = null
    let cnaeCodigo = ''

    // Fonte de verdade: tabela RegulatoryMatrix (Blueprint 101). O REGULATORY_MATRIX
    // hardcoded vira apenas fallback p/ CNAEs ainda não presentes no banco (zero regressão).
    const matrizRows = await prisma.regulatoryMatrix.findMany()
    for (const code of input.cnaes) {
      cnaeCodigo = code
      cnaeData = await this.resolverCnae(code, matrizRows)
      if (cnaeData) break
    }

    // Fallback se não encontrar CNAE na matriz
    if (!cnaeData) {
      cnaeData = {
        descricao: 'Atividade não mapeada detalhadamente (Diagnóstico Geral)',
        riscoNivel: 'MEDIO',
        potencialPoluidor: 'MEDIO',
        licenciamentoTipo: 'Licenciamento Ambiental Ordinário',
        orgaoCompetente: 'Órgão Ambiental Local',
        esfera: 'MUNICIPAL',
        necessitaEIA: false,
        necessitaOutorga: false,
        necessitaMonitoramento: false,
        impactos: ['Impactos genéricos de ocupação de solo'],
        servicosBase: ['LIC-001', 'LIC-012', 'GES-001']
      }
      cnaeCodigo = input.cnaes[0] || '0000-0/00'
    }

    // 2. Calcular Risco Geral
    const riskScore = this.calculateRiskScore(cnaeData, input)
    const riskLevel = this.scoreToLevel(riskScore)

    // 3. Selecionar e Filtrar Serviços Recomendados
    const recomendacoes = await this.buildRecomendacoes(cnaeData, input)

    // 4. Calcular Estimativa de Orçamento
    const orcamento = this.calculateBudget(recomendacoes)

    // 5. Gerar Alertas e Próximos Passos
    const alertas = this.generateAlertas(cnaeData, input, riskLevel)
    const proximosPassos = this.generateProximosPassos(riskLevel)

    return {
      cnaePrincipal: {
        codigo: cnaeCodigo,
        descricao: cnaeData.descricao,
        riscoNivel: cnaeData.riscoNivel,
        potencialPoluidor: cnaeData.potencialPoluidor
      },
      enquadramento: {
        licenciamentoTipo: cnaeData.licenciamentoTipo,
        orgaoCompetente: cnaeData.orgaoCompetente,
        esfera: cnaeData.esfera
      },
      riscoGeral: {
        score: riskScore,
        nivel: riskLevel,
        justificativa: `Risco baseado no CNAE ${cnaeCodigo} (${cnaeData.riscoNivel}) ajustado pela situação ${input.situacao} e porte ${input.porte}.`
      },
      obrigatoriedades: {
        necessitaEIA: cnaeData.necessitaEIA,
        necessitaOutorga: cnaeData.necessitaOutorga,
        necessitaMonitoramento: cnaeData.necessitaMonitoramento,
        principaisImpactos: cnaeData.impactos
      },
      recomendacoes,
      estimativaOrcamento: orcamento,
      alertas,
      proximosPassos
    }
  }

  private calculateRiskScore(cnaeData: any, input: DiagnosticoInput): number {
    let score = cnaeData.riscoNivel === 'ALTO' ? 70 : cnaeData.riscoNivel === 'MEDIO' ? 40 : 20

    // Ajuste por porte
    if (input.porte === 'GRANDE' || input.porte === 'MUITO_GRANDE') score += 15
    if (input.porte === 'MICRO') score -= 10

    // Ajuste por situação
    if (input.situacao === 'IRREGULAR') score += 20
    if (input.situacao === 'PLANEJADO') score -= 5

    return Math.min(Math.max(score, 0), 100)
  }

  private scoreToLevel(score: number): 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' {
    if (score >= 85) return 'CRITICO'
    if (score >= 60) return 'ALTO'
    if (score >= 30) return 'MEDIO'
    return 'BAIXO'
  }

  private async buildRecomendacoes(cnaeData: any, input: DiagnosticoInput): Promise<RecomendacaoServico[]> {
    const codigosSugeridos = [...cnaeData.servicosBase]

    // Lógica condicional de serviços
    if (input.situacao === 'RENOVACAO') {
      codigosSugeridos.push('LIC-015') // Renovação de Licenças
      codigosSugeridos.push('LIC-010') // Atendimento a Condicionantes
    }
    
    if (input.situacao === 'IRREGULAR') {
      codigosSugeridos.push('LIC-016') // Retificação e Atualização
      codigosSugeridos.push('EST-001') // Diagnóstico de Passivo
    }

    if (input.temOutorgaAnterior === false && cnaeData.necessitaOutorga) {
      codigosSugeridos.push('OUT-002') // Outorga - Captação
    }

    const codigosOrdenados = [...new Set(codigosSugeridos)]
    const ordemPorCodigo = new Map(codigosOrdenados.map((codigo: string, index: number) => [codigo, index]))

    // Busca apenas os campos necessários para a resposta pública do diagnóstico.
    const servicosCatalogo = await prisma.servicoCatalogo.findMany({
      where: {
        codigo: { in: codigosOrdenados },
        ativo: true
      },
      select: {
        id: true,
        codigo: true,
        nome: true,
        categoria: true,
        precoBase: true,
        precoMinimo: true,
        precoMaximo: true,
      },
    })

    return servicosCatalogo
      .map(s => {
        const isObrigatorio = cnaeData.servicosBase.includes(s.codigo)
        const decisao: RecomendacaoServico['decisao'] = isObrigatorio ? 'OBRIGATORIO' : 'CONDICIONAL'

        return {
          servicoId: s.id,
          codigo: s.codigo,
          nome: s.nome,
          categoria: s.categoria,
          decisao,
          justificativa: isObrigatorio
            ? 'Essencial para o rito de licenciamento desta atividade.'
            : 'Recomendado para regularização da situação específica informada.',
          precoEstimado: Number(s.precoBase) || 0,
          precoMinimo: Number(s.precoMinimo) || 0,
          precoMaximo: Number(s.precoMaximo) || 0
        }
      })
      .sort((a, b) => {
        const ordemA = ordemPorCodigo.get(a.codigo) ?? Number.MAX_SAFE_INTEGER
        const ordemB = ordemPorCodigo.get(b.codigo) ?? Number.MAX_SAFE_INTEGER
        return ordemA - ordemB
      })
  }

  private calculateBudget(recomendacoes: RecomendacaoServico[]) {
    // Apenas serviços obrigatórios entram no "recomendado" inicial
    const obrigatorios = recomendacoes.filter(r => r.decisao === 'OBRIGATORIO')
    
    const min = obrigatorios.reduce((acc, r) => acc + r.precoMinimo, 0)
    const max = recomendacoes.reduce((acc, r) => acc + r.precoMaximo, 0) // Max considera todos
    const rec = obrigatorios.reduce((acc, r) => acc + r.precoEstimado, 0)

    return {
      minimo: min,
      maximo: max,
      recomendado: rec
    }
  }

  private generateAlertas(cnaeData: any, input: DiagnosticoInput, riskLevel: string): string[] {
    const alertas = []
    if (input.situacao === 'IRREGULAR') {
      alertas.push('Operação irregular detectada: Risco de multas e interdição imediata pelo órgão ambiental.')
    }
    if (riskLevel === 'CRITICO' || riskLevel === 'ALTO') {
      alertas.push('Atividade de alto impacto ambiental: Requer acompanhamento técnico contínuo e rigoroso.')
    }
    if (cnaeData.necessitaOutorga && input.temOutorgaAnterior === false) {
      alertas.push('Necessidade de Outorga: O uso de recursos hídricos sem portaria é passível de lacração do poço/captação.')
    }
    return alertas
  }

  private generateProximosPassos(riskLevel: string): string[] {
    const passos = [
      'Realizar visita técnica para validação locacional.',
      'Organizar documentação societária e de posse do imóvel.',
      'Protocolar pedido de certidão de uso do solo na prefeitura.'
    ]
    if (riskLevel === 'CRITICO') {
      passos.unshift('Contratar estudo de passivo ambiental (APA/ICA) imediatamente.')
    }
    return passos
  }
}
