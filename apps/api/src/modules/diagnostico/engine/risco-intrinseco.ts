import type { PerfilEmpreendimento, TanqueSnapshot, NivelRisco } from '../domain/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// EIXO 2 — RISCO INTRÍNSECO ECOLÓGICO (Blueprint 101 — Passo 5)
//
// NÃO confundir com o risco de CONFORMIDADE (eixo 1, em diagnose.ts). Aquele mede
// "quão exposto a multa/embargo o cliente está". ESTE mede "quão grave seria um
// vazamento AQUI, para o meio" — independe de ter ou não licença.
//
// Modelo (engenharia ambiental): RISCO = AMEAÇA × VULNERABILIDADE × RECEPTOR.
//   • AMEAÇA      = perigo da fonte (tanque: parede + idade + benzeno).
//   • VULNERAB.   = facilidade do meio propagar (DRASTIC simplificado: aquífero,
//                   nível d'água, solo).
//   • RECEPTOR    = quem/o que está no caminho (poço, corpo hídrico, APP, consumo).
//   • GATILHO     = evidência medida (área contaminada / estanqueidade reprovada)
//                   DOMINA o estimado e impõe um piso.
//
// PURO: sem Prisma, sem I/O, determinístico. Cada contribuição vira um FATOR
// NOMEADO com base técnica → a saída é auditável (nunca um número "do nada").
// ─────────────────────────────────────────────────────────────────────────────

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  TABELA DE PESOS — VERSÃO BETA. PENDENTE DE ASSINATURA (Guilherme).         ║
// ║  Enquanto `assinado=false`, o resultado sai marcado `beta:true` e NÃO deve  ║
// ║  virar número de decisão em produção. Calibrar com casos reais antes.       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
export const PESOS_RISCO_INTRINSECO = {
  versao: 'beta-1',
  assinado: false as boolean,

  // AMEAÇA (0–100) — perigo da fonte. Pior tanque domina; demais contam 30%.
  ameaca: {
    paredeSimplesAco: 45, // aço carbono, parede simples → maior risco de furo/corrosão
    paredeSimplesOutro: 30, // parede simples não-aço
    paredeDupla: 5, // parede dupla/jaquetado com monitoramento intersticial
    idadeMais20Anos: 25,
    idade10a20Anos: 12,
    idadeMenos10Anos: 0,
    fatorBenzeno: 1.3, // gasolina/etanol (benzeno, cancerígeno) multiplica a ameaça
    fatorOutrosTanques: 0.3, // contribuição dos demais tanques além do pior
  },

  // VULNERABILIDADE — multiplicador do meio (1.0 = neutro). Soma-se ao base 1.0.
  vulnerabilidade: {
    base: 1.0,
    aquiferoLivreRaso: 0.4,
    aquiferoLivreProfundo: 0.15,
    aquiferoConfinado: 0.0,
    aquiferoDesconhecido: 0.25, // ESTIMADO conservador
    nivelAguaRaso5m: 0.25, // lençfreático < 5 m da superfície
    nivelAguaMedio5a15m: 0.1,
    soloArenoso: 0.25, // alta condutividade → pluma rápida
    soloMisto: 0.1,
    soloDesconhecido: 0.15, // ESTIMADO conservador
    tetoMultiplicador: 1.6,
  },

  // RECEPTOR — pontos somados ao final (alvo do dano).
  receptor: {
    pocoAbastecimentoMenos100m: 30,
    pocoAbastecimento100a500m: 12,
    corpoHidricoMenos100m: 20,
    emAPP: 10,
    captaParaConsumo: 15,
  },

  // GATILHO — pisos por evidência medida (o medido domina o estimado).
  gatilho: {
    pisoAreaContaminada: 85,
    pisoEstanqueidadeReprovada: 70,
    pisoMonitoramentoNaoConforme: 60,
  },
} as const

export interface FatorRiscoIntrinseco {
  descricao: string
  pontos: number // contribuição em pontos (após normalização), sinal informativo
  baseTecnica: string
}

export interface RiscoIntrinsecoResultado {
  score: number // 0–100, maior = pior para o meio
  nivel: NivelRisco
  fatores: FatorRiscoIntrinseco[]
  beta: boolean // true enquanto os pesos não forem assinados
  pesosVersao: string
}

// ── AMEAÇA de um tanque isolado ───────────────────────────────────────────────
function ameacaTanque(t: TanqueSnapshot): number {
  const P = PESOS_RISCO_INTRINSECO.ameaca
  let base = t.paredeSimples ? P.paredeSimplesAco : P.paredeDupla
  const idade = t.idadeAnos ?? 25 // ESTIMADO conservador: sem idade → assume antigo
  base += idade > 20 ? P.idadeMais20Anos : idade >= 10 ? P.idade10a20Anos : P.idadeMenos10Anos
  // benzeno: undefined => true (gasolina é padrão em posto) — ESTIMADO conservador
  const comBenzeno = t.combustivelComBenzeno ?? true
  return comBenzeno ? base * P.fatorBenzeno : base
}

function nivelDeScore(score: number): NivelRisco {
  return score >= 85 ? 'CRITICO' : score >= 60 ? 'ALTO' : score >= 30 ? 'MEDIO' : 'BAIXO'
}

/**
 * Calcula o risco intrínseco ecológico do empreendimento. Determinístico.
 * Ausência de dado => default conservador marcado "ESTIMADO" na base técnica.
 */
export function calcularRiscoIntrinseco(perfil: PerfilEmpreendimento): RiscoIntrinsecoResultado {
  const W = PESOS_RISCO_INTRINSECO
  const fatores: FatorRiscoIntrinseco[] = []

  // ── AMEAÇA: pior tanque domina; demais contribuem 30% ────────────────────────
  const ameacas = (perfil.tanques ?? []).map(ameacaTanque).sort((a, b) => b - a)
  let ameaca = 0
  if (ameacas.length > 0) {
    ameaca = ameacas[0]! + ameacas.slice(1).reduce((s, a) => s + a, 0) * W.ameaca.fatorOutrosTanques
    const pior = perfil.tanques![0]!
    fatores.push({
      descricao: `Fonte: ${perfil.tanques!.length} tanque(s); pior = ${pior.paredeSimples ? 'parede simples' : 'parede dupla'}, ${pior.idadeAnos ?? '≈25 (ESTIMADO)'} anos`,
      pontos: Math.round(ameaca),
      baseTecnica: 'ABNT NBR 13.784 (estanqueidade) / CONAMA 273 — tanque é a fonte primária de vazamento',
    })
  }
  ameaca = Math.min(100, ameaca)

  // ── VULNERABILIDADE: multiplicador do meio (DRASTIC simplificado) ─────────────
  const V = W.vulnerabilidade
  let mult: number = V.base
  const aq = perfil.classeAquifero ?? 'DESCONHECIDO'
  const contribAq =
    aq === 'LIVRE_RASO' ? V.aquiferoLivreRaso
    : aq === 'LIVRE_PROFUNDO' ? V.aquiferoLivreProfundo
    : aq === 'CONFINADO' ? V.aquiferoConfinado
    : V.aquiferoDesconhecido
  if (contribAq > 0) {
    mult += contribAq
    fatores.push({
      descricao: `Aquífero ${aq === 'DESCONHECIDO' ? 'não informado (ESTIMADO conservador)' : aq.toLowerCase().replace('_', ' ')}`,
      pontos: Math.round(contribAq * 100),
      baseTecnica: 'DRASTIC / CONAMA 396 — aquífero livre raso = alta vulnerabilidade',
    })
  }
  const niv = perfil.profundidadeNivelAguaM
  if (niv != null && niv < 5) {
    mult += V.nivelAguaRaso5m
    fatores.push({ descricao: `Nível d'água raso (${niv} m)`, pontos: Math.round(V.nivelAguaRaso5m * 100), baseTecnica: 'DRASTIC (Depth to water) — quanto mais raso, menor a atenuação' })
  } else if (niv != null && niv < 15) {
    mult += V.nivelAguaMedio5a15m
    fatores.push({ descricao: `Nível d'água médio (${niv} m)`, pontos: Math.round(V.nivelAguaMedio5a15m * 100), baseTecnica: 'DRASTIC (Depth to water)' })
  }
  const solo = perfil.tipoSolo ?? 'DESCONHECIDO'
  const contribSolo = solo === 'ARENOSO' ? V.soloArenoso : solo === 'MISTO' ? V.soloMisto : solo === 'DESCONHECIDO' ? V.soloDesconhecido : 0
  if (contribSolo > 0) {
    mult += contribSolo
    fatores.push({
      descricao: `Solo ${solo === 'DESCONHECIDO' ? 'não informado (ESTIMADO conservador)' : solo.toLowerCase()}`,
      pontos: Math.round(contribSolo * 100),
      baseTecnica: 'DRASTIC (Soil/condutividade) — solo arenoso propaga a pluma mais rápido',
    })
  }
  mult = Math.min(V.tetoMultiplicador, mult)

  // ── RECEPTOR: pontos somados (alvo do dano) ──────────────────────────────────
  const R = W.receptor
  let receptor = 0
  const dPoco = perfil.distanciaPocoAbastecimentoM
  if (dPoco != null && dPoco < 100) {
    receptor += R.pocoAbastecimentoMenos100m
    fatores.push({ descricao: `Poço de abastecimento a ${dPoco} m`, pontos: R.pocoAbastecimentoMenos100m, baseTecnica: 'CONAMA 396 / Portaria GM/MS 888 — receptor humano direto (água de consumo)' })
  } else if (dPoco != null && dPoco < 500) {
    receptor += R.pocoAbastecimento100a500m
    fatores.push({ descricao: `Poço de abastecimento a ${dPoco} m`, pontos: R.pocoAbastecimento100a500m, baseTecnica: 'CONAMA 396 — receptor humano na área de influência' })
  }
  const dCorpo = perfil.distanciaCorpoHidricoM
  if (dCorpo != null && dCorpo < 100) {
    receptor += R.corpoHidricoMenos100m
    fatores.push({ descricao: `Corpo hídrico a ${dCorpo} m`, pontos: R.corpoHidricoMenos100m, baseTecnica: 'CONAMA 357 — receptor ecológico (água superficial)' })
  }
  if (perfil.emAPP) {
    receptor += R.emAPP
    fatores.push({ descricao: 'Empreendimento em APP', pontos: R.emAPP, baseTecnica: 'Lei 12.651/12 (Código Florestal) — área protegida' })
  }
  if (perfil.captaParaConsumo) {
    receptor += R.captaParaConsumo
    fatores.push({ descricao: 'Capta água para consumo', pontos: R.captaParaConsumo, baseTecnica: 'Portaria GM/MS 888/2021 — potabilidade / exposição humana' })
  }

  // ── SÍNTESE: AMEAÇA × VULNERAB + RECEPTOR, com teto 100 ───────────────────────
  let score = Math.min(100, Math.round(ameaca * mult + receptor))

  // ── GATILHO de evidência: o medido DOMINA o estimado (impõe piso) ────────────
  const s = perfil.sinais
  const G = W.gatilho
  if (s?.areaContaminada && score < G.pisoAreaContaminada) {
    score = G.pisoAreaContaminada
    fatores.push({ descricao: 'EVIDÊNCIA: área declarada contaminada (piso aplicado)', pontos: G.pisoAreaContaminada, baseTecnica: 'CONAMA 420/2009 — contaminação confirmada domina a estimativa' })
  } else if (s?.estanqueidadeReprovada && score < G.pisoEstanqueidadeReprovada) {
    score = G.pisoEstanqueidadeReprovada
    fatores.push({ descricao: 'EVIDÊNCIA: estanqueidade reprovada (piso aplicado)', pontos: G.pisoEstanqueidadeReprovada, baseTecnica: 'ABNT NBR 13.784 — falha de estanqueidade = vazamento provável' })
  } else if (s?.monitoramentoNaoConforme && score < G.pisoMonitoramentoNaoConforme) {
    score = G.pisoMonitoramentoNaoConforme
    fatores.push({ descricao: 'EVIDÊNCIA: monitoramento acima do VMP (piso aplicado)', pontos: G.pisoMonitoramentoNaoConforme, baseTecnica: 'CONAMA 396 — VMP excedido em poço de monitoramento' })
  }

  // ordena por contribuição (maior primeiro) — leitura humana
  fatores.sort((a, b) => b.pontos - a.pontos)

  return { score, nivel: nivelDeScore(score), fatores, beta: !W.assinado, pesosVersao: W.versao }
}
