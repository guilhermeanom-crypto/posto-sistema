import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// SEED — Catálogo de Obrigações Regulatórias Base
//
// Cobre as obrigações mais comuns para posto revendedor varejista de
// combustíveis no Brasil. Dividido por módulo:
//
//   AMBIENTAL       — licenciamento ambiental estadual
//   ANP             — registro e fiscalização ANP/INMETRO
//   SST             — saúde e segurança do trabalho (CLT + NRs)
//   URBANISTICO     — bombeiros, prefeitura, vigilância sanitária
//   MONITORAMENTO   — águas subterrâneas, campanhas periódicas
//   LOGISTICA_REVERSA — destinação de resíduos perigosos
//
// Fonte normativa principal:
//   - Resolução CONAMA 273/2000 (postos de combustíveis)
//   - Portaria ANP 116/2000 e Portaria ANP 202/2017
//   - NBR 13786, NBR 15212, NBR 14605
//   - NR-20, NR-9 (PPRA/PGR), NR-7 (PCMSO), NR-23
//   - Lei 12.305/2010 (PNRS), Decreto 10.936/2022
// ─────────────────────────────────────────────────────────────────────────────

type ObrigacaoInput = {
  codigo: string
  tipoEmpreendimento: string
  uf?: string
  modulo: string
  descricao: string
  fundamentoLegal?: string
  periodicidade: string
  tipoDocumentoRef?: string
  criticidade: string
  diasAlertaAntes: number[]
  observacoes?: string
}

const OBRIGACOES: ObrigacaoInput[] = [
  // ── AMBIENTAL ──────────────────────────────────────────────────────────────
  {
    codigo: 'AMB-001',
    tipoEmpreendimento: 'revendedor',
    modulo: 'AMBIENTAL',
    descricao: 'Licença de Operação (LO) — órgão ambiental estadual',
    fundamentoLegal: 'Resolução CONAMA 237/1997; Resolução CONAMA 273/2000, Art. 3º',
    periodicidade: 'QUADRIENAL',
    tipoDocumentoRef: 'Licença de Operação',
    criticidade: 'CRITICA',
    diasAlertaAntes: [180, 120, 90, 60, 30],
    observacoes: 'Prazo de validade varia por estado (SP: 4 anos). Renovação deve ser solicitada com antecedência mínima de 120 dias.',
  },
  {
    codigo: 'AMB-002',
    tipoEmpreendimento: 'revendedor',
    modulo: 'AMBIENTAL',
    descricao: 'Plano de Gerenciamento de Resíduos Sólidos (PGRS)',
    fundamentoLegal: 'Lei 12.305/2010, Art. 20; Decreto 10.936/2022',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'PGRS — Plano de Gerenciamento de Resíduos Sólidos',
    criticidade: 'ALTA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Deve ser elaborado por responsável técnico e conter destinação de todos os resíduos gerados (óleos, filtros, embalagens, efluentes).',
  },
  {
    codigo: 'AMB-003',
    tipoEmpreendimento: 'revendedor',
    modulo: 'AMBIENTAL',
    descricao: 'Plano de Atendimento a Emergências (PAE)',
    fundamentoLegal: 'Resolução CONAMA 273/2000, Art. 5º, §1º',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'PAE — Plano de Atendimento a Emergências',
    criticidade: 'ALTA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Revisão anual obrigatória. Deve contemplar vazamentos, incêndios e contaminação de solo/água.',
  },
  {
    codigo: 'AMB-004',
    tipoEmpreendimento: 'revendedor',
    modulo: 'AMBIENTAL',
    descricao: 'Teste de estanqueidade de tanques subterrâneos',
    fundamentoLegal: 'Resolução CONAMA 273/2000, Art. 5º, II; NBR 13786',
    periodicidade: 'QUINQUENAL',
    tipoDocumentoRef: 'Laudo de Estanqueidade de Tanques',
    criticidade: 'CRITICA',
    diasAlertaAntes: [180, 120, 60, 30],
    observacoes: 'A cada 5 anos ou sempre que houver suspeita de vazamento. Laudo assinado por RT com ART.',
  },
  {
    codigo: 'AMB-005',
    tipoEmpreendimento: 'revendedor',
    modulo: 'AMBIENTAL',
    descricao: 'Teste de estanqueidade de tubulações e conexões',
    fundamentoLegal: 'Resolução CONAMA 273/2000; NBR 15212',
    periodicidade: 'QUINQUENAL',
    tipoDocumentoRef: 'Laudo de Estanqueidade de Tubulações',
    criticidade: 'ALTA',
    diasAlertaAntes: [180, 120, 60, 30],
    observacoes: 'Inclui tubulações de sucção, recalque e respiro. Executar junto ao teste de tanques.',
  },
  {
    codigo: 'AMB-006',
    tipoEmpreendimento: 'revendedor',
    modulo: 'AMBIENTAL',
    descricao: 'Relatório de avaliação de passivo ambiental (se área suspeita ou contaminada)',
    fundamentoLegal: 'Resolução CONAMA 420/2009; Decisão de Diretoria CETESB 038/2017/C (SP)',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Relatório de Investigação Ambiental',
    criticidade: 'ALTA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Obrigatório somente se área classificada como suspeita ou contaminada pelo órgão ambiental.',
  },

  // ── ANP / INMETRO ──────────────────────────────────────────────────────────
  {
    codigo: 'ANP-001',
    tipoEmpreendimento: 'revendedor',
    modulo: 'ANP',
    descricao: 'Registro ANP como Revendedor Varejista de Combustíveis',
    fundamentoLegal: 'Portaria ANP 116/2000; Resolução ANP 41/2013',
    periodicidade: 'UNICA',
    tipoDocumentoRef: 'Certificado de Registro ANP',
    criticidade: 'CRITICA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Registro permanente. Deve ser atualizado em caso de mudança societária, de localização ou de produtos comercializados.',
  },
  {
    codigo: 'ANP-002',
    tipoEmpreendimento: 'revendedor',
    modulo: 'ANP',
    descricao: 'Calibração/aferição de bombas de abastecimento (INMETRO)',
    fundamentoLegal: 'Portaria INMETRO 169/2011; Resolução ANP 41/2013',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Certificado de Calibração de Bombas',
    criticidade: 'CRITICA',
    diasAlertaAntes: [90, 60, 30, 15],
    observacoes: 'Cada bico de abastecimento deve ser aferido anualmente por empresa credenciada ao INMETRO. Lacre obrigatório.',
  },
  {
    codigo: 'ANP-003',
    tipoEmpreendimento: 'revendedor',
    modulo: 'ANP',
    descricao: 'Envio de dados de estoque via SCANC (Sistema de Controle ANP)',
    fundamentoLegal: 'Resolução ANP 41/2013, Art. 25',
    periodicidade: 'MENSAL',
    tipoDocumentoRef: 'Comprovante de envio SCANC',
    criticidade: 'ALTA',
    diasAlertaAntes: [10, 5],
    observacoes: 'Declaração mensal de movimentação de combustíveis. Prazo: até dia 10 do mês seguinte.',
  },
  {
    codigo: 'ANP-004',
    tipoEmpreendimento: 'revendedor',
    modulo: 'ANP',
    descricao: 'Qualidade dos combustíveis — coleta e análise de amostras',
    fundamentoLegal: 'Resolução ANP 830/2021 (gasolina); Resolução ANP 50/2013 (etanol)',
    periodicidade: 'SEMESTRAL',
    tipoDocumentoRef: 'Laudo de Qualidade de Combustíveis',
    criticidade: 'ALTA',
    diasAlertaAntes: [60, 30],
    observacoes: 'Pode ser solicitado pela ANP a qualquer momento. Posto deve guardar amostras contraprova por 30 dias.',
  },
  {
    codigo: 'ANP-005',
    tipoEmpreendimento: 'revendedor',
    modulo: 'ANP',
    descricao: 'Medição volumétrica de tanques (tanque régua/sonda)',
    fundamentoLegal: 'Portaria ANP 116/2000; NBR 14605',
    periodicidade: 'DIARIA',
    tipoDocumentoRef: 'Registro de Medição de Tanques',
    criticidade: 'MEDIA',
    diasAlertaAntes: [3, 1],
    observacoes: 'Controle interno diário. Registro deve ser mantido por no mínimo 12 meses.',
  },

  // ── SST — SAÚDE E SEGURANÇA DO TRABALHO ───────────────────────────────────
  {
    codigo: 'SST-001',
    tipoEmpreendimento: 'revendedor',
    modulo: 'SST',
    descricao: 'PGR — Programa de Gerenciamento de Riscos (substitui PPRA)',
    fundamentoLegal: 'NR-1 (Portaria MTP 1.419/2022); NR-20 (líquidos combustíveis)',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'PGR — Programa de Gerenciamento de Riscos',
    criticidade: 'CRITICA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Elaborado por técnico ou engenheiro de segurança. Inclui inventário de riscos, plano de ação e evidências de implementação.',
  },
  {
    codigo: 'SST-002',
    tipoEmpreendimento: 'revendedor',
    modulo: 'SST',
    descricao: 'PCMSO — Programa de Controle Médico de Saúde Ocupacional',
    fundamentoLegal: 'NR-7 (Portaria MTb 3.214/1978)',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'PCMSO — Programa de Controle Médico',
    criticidade: 'CRITICA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Elaborado por médico do trabalho. Deve contemplar exposição a vapores de combustíveis (benzeno, tolueno, xileno).',
  },
  {
    codigo: 'SST-003',
    tipoEmpreendimento: 'revendedor',
    modulo: 'SST',
    descricao: 'ASO — Atestado de Saúde Ocupacional (por funcionário)',
    fundamentoLegal: 'NR-7, item 7.5',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'ASO — Atestado de Saúde Ocupacional',
    criticidade: 'ALTA',
    diasAlertaAntes: [60, 30, 15],
    observacoes: 'Admissional, periódico (anual para expostos a risco), retorno ao trabalho e demissional. Todos os funcionários.',
  },
  {
    codigo: 'SST-004',
    tipoEmpreendimento: 'revendedor',
    modulo: 'SST',
    descricao: 'Laudo de insalubridade e periculosidade',
    fundamentoLegal: 'NR-15; NR-16; CLT Art. 192',
    periodicidade: 'BIENAL',
    tipoDocumentoRef: 'Laudo de Insalubridade/Periculosidade',
    criticidade: 'ALTA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Frentistas e operadores de pista têm direito a adicional de periculosidade (30%). Deve ser renovado a cada 2 anos ou quando houver mudança nas condições de trabalho.',
  },
  {
    codigo: 'SST-005',
    tipoEmpreendimento: 'revendedor',
    modulo: 'SST',
    descricao: 'Treinamento de brigada de incêndio e primeiros socorros',
    fundamentoLegal: 'NR-23; IT-17 CBMSP (SP)',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Certificado de Treinamento de Brigada',
    criticidade: 'ALTA',
    diasAlertaAntes: [60, 30],
    observacoes: 'Mínimo de 1 brigadista por turno. Treinamento prático com combate a incêndio em líquidos inflamáveis.',
  },
  {
    codigo: 'SST-006',
    tipoEmpreendimento: 'revendedor',
    modulo: 'SST',
    descricao: 'Treinamento NR-20 — Inflamáveis e Combustíveis (para frentistas)',
    fundamentoLegal: 'NR-20 (Portaria SIT 308/2012)',
    periodicidade: 'BIENAL',
    tipoDocumentoRef: 'Certificado de Treinamento NR-20',
    criticidade: 'ALTA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Carga horária mínima: 8h para operação básica. Treinamento reciclagem a cada 2 anos.',
  },
  {
    codigo: 'SST-007',
    tipoEmpreendimento: 'revendedor',
    modulo: 'SST',
    descricao: 'Fichas de entrega de EPI (por funcionário)',
    fundamentoLegal: 'NR-6; CLT Art. 166',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Ficha de Controle de EPI',
    criticidade: 'MEDIA',
    diasAlertaAntes: [30],
    observacoes: 'Frentistas: luvas, calçado de segurança, uniforme antichama. Registro individual de entrega com assinatura.',
  },
  {
    codigo: 'SST-008',
    tipoEmpreendimento: 'revendedor',
    modulo: 'SST',
    descricao: 'CIPA — Comissão Interna de Prevenção de Acidentes (quando exigível)',
    fundamentoLegal: 'NR-5 (Portaria MTP 1.419/2022)',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Ata de eleição e treinamento CIPA',
    criticidade: 'MEDIA',
    diasAlertaAntes: [60, 30],
    observacoes: 'Obrigatória para estabelecimentos com 20 ou mais empregados (grupo C-1). Verificar tabela do Quadro I da NR-5.',
  },

  // ── URBANÍSTICO / BOMBEIROS / PREFEITURA ───────────────────────────────────
  {
    codigo: 'URB-001',
    tipoEmpreendimento: 'revendedor',
    modulo: 'URBANISTICO',
    descricao: 'AVCB — Auto de Vistoria do Corpo de Bombeiros',
    fundamentoLegal: 'Decreto Estadual (varia por UF); IT CBMSP (SP)',
    periodicidade: 'TRIENAL',
    tipoDocumentoRef: 'AVCB — Auto de Vistoria do Corpo de Bombeiros',
    criticidade: 'CRITICA',
    diasAlertaAntes: [180, 120, 60, 30],
    observacoes: 'Validade de 3 anos (SP). Renovação exige laudo de instalação e manutenção dos sistemas de combate a incêndio.',
  },
  {
    codigo: 'URB-002',
    tipoEmpreendimento: 'revendedor',
    modulo: 'URBANISTICO',
    descricao: 'Alvará de Funcionamento (Prefeitura Municipal)',
    fundamentoLegal: 'Lei Orgânica Municipal; Lei Complementar 123/2006',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Alvará de Funcionamento',
    criticidade: 'CRITICA',
    diasAlertaAntes: [90, 60, 30, 15],
    observacoes: 'Renovação anual. Algumas prefeituras exigem AVCB vigente como pré-requisito para renovação do alvará.',
  },
  {
    codigo: 'URB-003',
    tipoEmpreendimento: 'revendedor',
    modulo: 'URBANISTICO',
    descricao: 'Licença Sanitária (quando houver loja de conveniência ou área de alimentação)',
    fundamentoLegal: 'Lei 8.080/1990; RDC ANVISA 216/2004',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Licença Sanitária',
    criticidade: 'ALTA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Obrigatória somente se houver comercialização de alimentos ou bebidas. Emitida pela Vigilância Sanitária municipal.',
  },
  {
    codigo: 'URB-004',
    tipoEmpreendimento: 'revendedor',
    modulo: 'URBANISTICO',
    descricao: 'Manutenção e certificação de extintores de incêndio',
    fundamentoLegal: 'NBR 12962; IT-21 CBMSP (SP)',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Laudo de Manutenção de Extintores',
    criticidade: 'ALTA',
    diasAlertaAntes: [60, 30],
    observacoes: 'Manutenção anual obrigatória por empresa credenciada. Recarga a cada 5 anos ou após uso. Laudo individual por extintor.',
  },
  {
    codigo: 'URB-005',
    tipoEmpreendimento: 'revendedor',
    modulo: 'URBANISTICO',
    descricao: 'Laudo elétrico e SPDA (sistema de proteção contra descargas atmosféricas)',
    fundamentoLegal: 'NBR 5419; NBR 5410; NR-10',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Laudo de Instalações Elétricas e SPDA',
    criticidade: 'ALTA',
    diasAlertaAntes: [90, 60, 30],
    observacoes: 'Inspeção anual das instalações elétricas em áreas classificadas (ZEP/ZER) e do sistema de aterramento. ART obrigatória.',
  },
  {
    codigo: 'URB-006',
    tipoEmpreendimento: 'revendedor',
    modulo: 'URBANISTICO',
    descricao: 'ART/RRT do responsável técnico pelas instalações',
    fundamentoLegal: 'Lei 6.496/1977 (ART); Resolução CFT 1025/2009',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'ART ou RRT do Responsável Técnico',
    criticidade: 'ALTA',
    diasAlertaAntes: [60, 30],
    observacoes: 'ART de acompanhamento anual do responsável técnico pelas instalações do posto. Exigida pela maioria dos órgãos no momento de renovação de licenças.',
  },

  // ── MONITORAMENTO AMBIENTAL ────────────────────────────────────────────────
  {
    codigo: 'MON-001',
    tipoEmpreendimento: 'revendedor',
    modulo: 'MONITORAMENTO',
    descricao: 'Campanha de monitoramento de qualidade da água subterrânea (poços de monitoramento)',
    fundamentoLegal: 'Resolução CONAMA 273/2000, Art. 5º; Resolução CONAMA 420/2009',
    periodicidade: 'SEMESTRAL',
    tipoDocumentoRef: 'Relatório de Campanha de Monitoramento',
    criticidade: 'ALTA',
    diasAlertaAntes: [60, 30, 15],
    observacoes: 'Coleta semestral nos poços de monitoramento instalados a montante e jusante do lençol freático. Parâmetros mínimos: BTX, PAH, BTEX.',
  },
  {
    codigo: 'MON-002',
    tipoEmpreendimento: 'revendedor',
    modulo: 'MONITORAMENTO',
    descricao: 'Relatório de monitoramento ambiental ao órgão licenciador',
    fundamentoLegal: 'Condicionante da Licença de Operação',
    periodicidade: 'SEMESTRAL',
    tipoDocumentoRef: 'Relatório de Monitoramento Ambiental',
    criticidade: 'ALTA',
    diasAlertaAntes: [60, 30, 15],
    observacoes: 'Prazo de entrega geralmente estipulado na condicionante da LO. Deve acompanhar os laudos de análise dos poços.',
  },
  {
    codigo: 'MON-003',
    tipoEmpreendimento: 'revendedor',
    modulo: 'MONITORAMENTO',
    descricao: 'Medição de nível d\'água nos poços (nível estático e piezométrico)',
    fundamentoLegal: 'Condicionante da LO; Resolução CONAMA 273/2000',
    periodicidade: 'MENSAL',
    tipoDocumentoRef: 'Planilha de Medição de Nível d\'Água',
    criticidade: 'MEDIA',
    diasAlertaAntes: [10, 5],
    observacoes: 'Medição com sonda de nível antes de cada campanha de coleta e mensalmente. Registro em planilha padronizada.',
  },
  {
    codigo: 'MON-004',
    tipoEmpreendimento: 'revendedor',
    modulo: 'MONITORAMENTO',
    descricao: 'Outorga de uso de recurso hídrico (poço artesiano, quando aplicável)',
    fundamentoLegal: 'Lei 9.433/1997; Resolução CNRH 16/2001',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Outorga de Uso de Recurso Hídrico',
    criticidade: 'ALTA',
    diasAlertaAntes: [180, 90, 30],
    observacoes: 'Obrigatória somente se houver captação de água subterrânea para uso (lavagem, irrigação). Emitida pela ANA ou órgão estadual.',
  },

  // ── LOGÍSTICA REVERSA ──────────────────────────────────────────────────────
  {
    codigo: 'LOG-001',
    tipoEmpreendimento: 'revendedor',
    modulo: 'LOGISTICA_REVERSA',
    descricao: 'Destinação de óleo lubrificante usado e contaminado (OLUC) com MTR',
    fundamentoLegal: 'Resolução CONAMA 362/2005; Lei 12.305/2010',
    periodicidade: 'TRIMESTRAL',
    tipoDocumentoRef: 'MTR — Manifesto de Transporte de Resíduos (OLUC)',
    criticidade: 'ALTA',
    diasAlertaAntes: [30, 15],
    observacoes: 'OLUC deve ser coletado por empresa licenciada. MTR emitido pelo SINIR. Frequência mínima: sempre que o tambor (200L) estiver cheio ou a cada 3 meses.',
  },
  {
    codigo: 'LOG-002',
    tipoEmpreendimento: 'revendedor',
    modulo: 'LOGISTICA_REVERSA',
    descricao: 'Destinação de filtros de óleo usados com MTR',
    fundamentoLegal: 'Resolução CONAMA 362/2005; Decreto 10.936/2022',
    periodicidade: 'TRIMESTRAL',
    tipoDocumentoRef: 'MTR — Manifesto de Transporte de Resíduos (filtros)',
    criticidade: 'ALTA',
    diasAlertaAntes: [30, 15],
    observacoes: 'Filtros de óleo são classificados como resíduo perigoso (classe I). Devem ser drenados antes do armazenamento.',
  },
  {
    codigo: 'LOG-003',
    tipoEmpreendimento: 'revendedor',
    modulo: 'LOGISTICA_REVERSA',
    descricao: 'Destinação de embalagens de lubrificantes (sistema de logística reversa)',
    fundamentoLegal: 'Resolução CONAMA 416/2009; Decreto 10.936/2022',
    periodicidade: 'TRIMESTRAL',
    tipoDocumentoRef: 'Comprovante de Devolução de Embalagens',
    criticidade: 'MEDIA',
    diasAlertaAntes: [30],
    observacoes: 'Embalagens plásticas de lubrificantes devem ser devolvidas ao fabricante/distribuidor via ponto de coleta. Registro de devolução obrigatório.',
  },
  {
    codigo: 'LOG-004',
    tipoEmpreendimento: 'revendedor',
    modulo: 'LOGISTICA_REVERSA',
    descricao: 'Destinação de pneus inservíveis (quando houver troca de pneus no posto)',
    fundamentoLegal: 'Resolução CONAMA 416/2009',
    periodicidade: 'SEMESTRAL',
    tipoDocumentoRef: 'Comprovante de Destinação de Pneus',
    criticidade: 'MEDIA',
    diasAlertaAntes: [30],
    observacoes: 'Obrigatório somente se o posto realizar troca de pneus. Destinação via Reciclanip ou coletores licenciados.',
  },
  {
    codigo: 'LOG-005',
    tipoEmpreendimento: 'revendedor',
    modulo: 'LOGISTICA_REVERSA',
    descricao: 'Declaração anual de geração e destinação de resíduos (SIGOR/SINIR)',
    fundamentoLegal: 'Lei 12.305/2010, Art. 41; Decreto 10.936/2022, Art. 41',
    periodicidade: 'ANUAL',
    tipoDocumentoRef: 'Declaração Anual de Resíduos (SIGOR)',
    criticidade: 'ALTA',
    diasAlertaAntes: [60, 30, 15],
    observacoes: 'Declaração anual até 31 de março no sistema SIGOR (SP) ou SINIR (federal). Inclui todos os resíduos gerados no ano anterior.',
  },
]

export async function seedObrigacoesRegulatorias(prisma: PrismaClient) {
  console.log('🌱 Seeding catálogo de obrigações regulatórias...')

  let criadas = 0
  let ignoradas = 0

  for (const obrigacao of OBRIGACOES) {
    const existente = await prisma.obrigacaoRegulatoriaBase.findUnique({
      where: { codigo: obrigacao.codigo },
    })

    if (existente) {
      // Atualiza caso algum campo tenha mudado
      await prisma.obrigacaoRegulatoriaBase.update({
        where: { codigo: obrigacao.codigo },
        data: obrigacao,
      })
      ignoradas++
    } else {
      await prisma.obrigacaoRegulatoriaBase.create({ data: obrigacao })
      criadas++
    }
  }

  console.log(`✅ Obrigações regulatórias: ${criadas} criadas, ${ignoradas} atualizadas (total: ${OBRIGACOES.length})`)

  // Resumo por módulo
  const porModulo = OBRIGACOES.reduce<Record<string, number>>((acc, o) => {
    acc[o.modulo] = (acc[o.modulo] ?? 0) + 1
    return acc
  }, {})
  for (const [modulo, qtd] of Object.entries(porModulo)) {
    console.log(`   ${modulo.padEnd(20)} ${qtd} obrigações`)
  }
}
