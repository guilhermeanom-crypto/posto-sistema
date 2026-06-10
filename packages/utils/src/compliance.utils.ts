import { COMPLIANCE_LIMITES, COMPLIANCE_PESOS, StatusCompliance } from '@repo/types'

interface DadosCompliance {
  documentosValidos: number
  documentosTotal: number
  processosRegulares: number
  processosTotal: number
  condicionantesCumpridas: number
  condicionantesAtivas: number
  /** Novos eixos — opcionais para backward compatibility */
  licencasVigentes?: number
  licencasTotal?: number
  sstConformes?: number
  sstTotal?: number
  integridadeConformes?: number
  integridadeTotal?: number
}

/**
 * Calcula o Índice de Conformidade (IC) de um empreendimento.
 * Retorna um número de 0 a 100.
 *
 * Fórmula com 6 eixos ponderados:
 *  - Documentos (20%), Processos (15%), Condicionantes (15%),
 *    Licenças (15%), SST (15%), Integridade Técnica (20%).
 *
 * Se um eixo não tiver dados (total = 0), assume 100% nesse eixo
 * (não penaliza ausência de escopo).
 */
export function calcularIndiceConformidade(dados: DadosCompliance): number {
  const ratio = (ok: number, total: number) => (total > 0 ? ok / total : 1)

  const pDocumentos = ratio(dados.documentosValidos, dados.documentosTotal)
  const pProcessos = ratio(dados.processosRegulares, dados.processosTotal)
  const pCondicionantes = ratio(dados.condicionantesCumpridas, dados.condicionantesAtivas)
  const pLicencas = ratio(dados.licencasVigentes ?? 0, dados.licencasTotal ?? 0)
  const pSST = ratio(dados.sstConformes ?? 0, dados.sstTotal ?? 0)
  const pIntegridade = ratio(dados.integridadeConformes ?? 0, dados.integridadeTotal ?? 0)

  const ic =
    pDocumentos * COMPLIANCE_PESOS.DOCUMENTOS * 100 +
    pProcessos * COMPLIANCE_PESOS.PROCESSOS * 100 +
    pCondicionantes * COMPLIANCE_PESOS.CONDICIONANTES * 100 +
    pLicencas * COMPLIANCE_PESOS.LICENCAS * 100 +
    pSST * COMPLIANCE_PESOS.SST * 100 +
    pIntegridade * COMPLIANCE_PESOS.INTEGRIDADE_TECNICA * 100

  return Math.round(ic * 100) / 100
}

/**
 * Determina o status de compliance a partir do IC calculado.
 */
export function determinarStatusCompliance(indice: number): StatusCompliance {
  if (indice >= COMPLIANCE_LIMITES.REGULAR) return StatusCompliance.REGULAR
  if (indice >= COMPLIANCE_LIMITES.ATENCAO) return StatusCompliance.ATENCAO
  if (indice >= COMPLIANCE_LIMITES.CRITICO) return StatusCompliance.CRITICO
  return StatusCompliance.EMERGENCIA
}
