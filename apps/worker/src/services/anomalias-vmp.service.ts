import { prisma } from '../infra/prisma.js'
import { contarStreakAlertas } from '../lib/alertas-campo.js'

// ─────────────────────────────────────────────────────────────────────────────
// DETECÇÃO DE ANOMALIAS VMP
// Verifica parâmetros de monitoramento que ultrapassam o VMP em campanhas
// consecutivas e gera alertas quando detecta tendência persistente.
// ─────────────────────────────────────────────────────────────────────────────

const CONSECUTIVAS_ALERTA = 2   // 2+ campanhas com o mesmo parâmetro em alerta → alerta ALTO
const CONSECUTIVAS_CRITICO = 3  // 3+ campanhas → alerta CRITICO

interface AnomaliaDetectada {
  empreendimentoId: string
  tenantId: string
  nomeParametro: string
  campanhasConsecutivas: number
  ultimoValor: number
  limiteVMP: number | null
  tipoMedio: string
}

async function detectarAnomaliasPorTenant(tenantId: string): Promise<AnomaliaDetectada[]> {
  // Busca as campanhas recentes do tenant com TODOS os parâmetros (conformes e em
  // alerta). Antes a query só trazia campanhas que já tinham alerta, ignorando as
  // campanhas conformes no meio — o que tratava medições alternadas (alerta, conforme,
  // alerta) como "consecutivas" e gerava alerta de tendência persistente indevido.
  const campanhas = await prisma.campanhaMonitoramento.findMany({
    where: { tenantId },
    orderBy: { dataColeta: 'desc' },
    take: 500,
    select: {
      empreendimentoId: true,
      tipo: true,
      dataColeta: true,
      parametros: {
        select: { nome: true, valorMedido: true, limiteVMP: true, emAlerta: true },
      },
    },
  })

  // Monta a série temporal (desc) por empreendimento + nome do parâmetro
  type Key = `${string}:${string}`
  type Leitura = { emAlerta: boolean; valorMedido: unknown; limiteVMP: unknown; tipo: string }
  const series = new Map<Key, Leitura[]>()

  for (const campanha of campanhas) {
    for (const param of campanha.parametros) {
      const key: Key = `${campanha.empreendimentoId}:${param.nome}`
      if (!series.has(key)) series.set(key, [])
      series.get(key)!.push({
        emAlerta: param.emAlerta,
        valorMedido: param.valorMedido,
        limiteVMP: param.limiteVMP,
        tipo: campanha.tipo,
      })
    }
  }

  const anomalias: AnomaliaDetectada[] = []

  for (const [key, leituras] of series) {
    const [empreendimentoId, nomeParametro] = key.split(':') as [string, string]

    // Conta o streak de alertas CONSECUTIVOS a partir da campanha mais recente —
    // uma campanha conforme quebra o streak (a tendência foi normalizada).
    const streak = contarStreakAlertas(leituras.map((l) => l.emAlerta))

    if (streak >= CONSECUTIVAS_ALERTA) {
      const ultimo = leituras[0]!
      anomalias.push({
        empreendimentoId,
        tenantId,
        nomeParametro,
        campanhasConsecutivas: streak,
        ultimoValor: Number(ultimo.valorMedido),
        limiteVMP: ultimo.limiteVMP ? Number(ultimo.limiteVMP) : null,
        tipoMedio: ultimo.tipo,
      })
    }
  }

  return anomalias
}

async function criarAlertaSeNaoExistir(anomalia: AnomaliaDetectada): Promise<void> {
  const nivel = anomalia.campanhasConsecutivas >= CONSECUTIVAS_CRITICO ? 'CRITICO' : 'ALTO'
  const titulo = `Anomalia VMP: ${anomalia.nomeParametro} em ${anomalia.campanhasConsecutivas} campanhas consecutivas`

  // Verifica se já existe alerta ativo para esta combinação (última semana)
  const ha7d = new Date(); ha7d.setDate(ha7d.getDate() - 7)
  const existe = await prisma.alerta.findFirst({
    where: {
      tenantId: anomalia.tenantId,
      empreendimentoId: anomalia.empreendimentoId,
      titulo,
      criadoEm: { gte: ha7d },
    },
  })
  if (existe) return

  await prisma.alerta.create({
    data: {
      tenantId: anomalia.tenantId,
      empreendimentoId: anomalia.empreendimentoId,
      tipo: 'ANOMALIA_MONITORAMENTO',
      nivel: nivel as never,
      titulo,
      mensagem: [
        `O parâmetro ${anomalia.nomeParametro} (${anomalia.tipoMedio}) ultrapassou o VMP em ${anomalia.campanhasConsecutivas} campanhas consecutivas.`,
        anomalia.limiteVMP !== null
          ? `Último valor medido: ${anomalia.ultimoValor.toFixed(4)} | VMP: ${anomalia.limiteVMP.toFixed(4)}`
          : `Último valor medido: ${anomalia.ultimoValor.toFixed(4)}`,
        'Recomenda-se investigação imediata e notificação ao órgão ambiental competente.',
      ].join('\n'),
      entidadeTipo: 'campanha_monitoramento',
    },
  })

  console.log(`[anomalias-vmp] Alerta ${nivel} criado: ${titulo} — empreendimento ${anomalia.empreendimentoId}`)
}

export async function detectarAnomaliasVMP(): Promise<void> {
  console.log('[anomalias-vmp] Iniciando detecção de anomalias VMP...')

  const tenants = await prisma.tenant.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
  })

  let totalAnomalias = 0

  for (const tenant of tenants) {
    try {
      const anomalias = await detectarAnomaliasPorTenant(tenant.id)

      for (const anomalia of anomalias) {
        await criarAlertaSeNaoExistir(anomalia)
      }

      totalAnomalias += anomalias.length
    } catch (err) {
      console.error(`[anomalias-vmp] Erro no tenant ${tenant.id}:`, (err as Error).message)
    }
  }

  console.log(`[anomalias-vmp] Detecção concluída. ${totalAnomalias} anomalia(s) verificada(s) em ${tenants.length} tenant(s).`)
}
