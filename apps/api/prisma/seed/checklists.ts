import type { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Checklists Operacionais — templates obrigatórios para postos de combustíveis
// Cobre exigências de: NBR 13784 (SASC), NR-20, INMETRO, CONAMA 273,
// NBR 5419 (SPDA), IT do CBM, NR-5 (CIPA).
// ─────────────────────────────────────────────────────────────────────────────

interface Item {
  ordem: number
  descricao: string
  obrigatorio?: boolean
  categoria?: string
}

interface Template {
  nome: string
  descricao: string
  modulo: string
  periodicidade: string
  itens: Item[]
}

const TEMPLATES: Template[] = [
  {
    nome: 'Inspeção visual diária do SASC',
    descricao: 'Verificação visual do Sistema de Armazenamento Subterrâneo de Combustível conforme NBR 13784.',
    modulo: 'ESTANQUEIDADE',
    periodicidade: 'DIARIO',
    itens: [
      { ordem: 1, descricao: 'Tampas de bocas-de-visita íntegras e tracadas' },
      { ordem: 2, descricao: 'Câmaras de descarga sem combustível, água ou resíduos' },
      { ordem: 3, descricao: 'Câmaras de calçada de bombas sem vazamentos visíveis' },
      { ordem: 4, descricao: 'Sinalização de área de descarga visível e legível' },
      { ordem: 5, descricao: 'Sensores intersticiais (parede dupla) sem alarme ativo', obrigatorio: false },
      { ordem: 6, descricao: 'ATG sem alarmes pendentes', obrigatorio: false },
      { ordem: 7, descricao: 'Ausência de odor anormal de hidrocarbonetos' },
    ],
  },
  {
    nome: 'Verificação diária de bombas e bicos',
    descricao: 'Inspeção pré-operacional de bombas medidoras (INMETRO Portaria 559/2016 + NR-20).',
    modulo: 'ANP',
    periodicidade: 'DIARIO',
    itens: [
      { ordem: 1, descricao: 'Selo INMETRO visível e dentro do prazo' },
      { ordem: 2, descricao: 'Lacres metrológicos íntegros (sem violação)' },
      { ordem: 3, descricao: 'Painel/display funcional, sem erros' },
      { ordem: 4, descricao: 'Mangueira sem ressecamento, trincas ou vazamentos' },
      { ordem: 5, descricao: 'Bico de abastecimento com gatilho funcional' },
      { ordem: 6, descricao: 'Câmara de contenção da bomba seca e limpa' },
      { ordem: 7, descricao: 'Aterramento conectado e sem corrosão' },
    ],
  },
  {
    nome: 'Descarga segura de combustível',
    descricao: 'Procedimento obrigatório a cada carga recebida (NR-20 + Portaria CETESB 75/2017).',
    modulo: 'OPERACIONAL',
    periodicidade: 'DIARIO',
    itens: [
      { ordem: 1, descricao: 'Caminhão posicionado em área demarcada e nivelada', categoria: 'Pré-descarga' },
      { ordem: 2, descricao: 'Motor desligado e calços de roda aplicados', categoria: 'Pré-descarga' },
      { ordem: 3, descricao: 'Cordão de isolamento instalado (raio mínimo)', categoria: 'Pré-descarga' },
      { ordem: 4, descricao: 'Aterramento equipotencial conectado caminhão↔tanque', categoria: 'Pré-descarga' },
      { ordem: 5, descricao: 'Extintores PQS posicionados próximos', categoria: 'Pré-descarga' },
      { ordem: 6, descricao: 'Análise de proveta executada (densidade/teor) e CONFORME', categoria: 'Recebimento' },
      { ordem: 7, descricao: 'Lacre da carga conferido contra nota fiscal', categoria: 'Recebimento' },
      { ordem: 8, descricao: 'Câmara de descarga seca antes da operação', categoria: 'Recebimento' },
      { ordem: 9, descricao: 'Operador NR-20 nível Avançado I presente durante toda descarga', categoria: 'Operação' },
      { ordem: 10, descricao: 'Bombeamento finalizado, mangotes drenados', categoria: 'Pós-descarga' },
      { ordem: 11, descricao: 'Câmara de descarga inspecionada após descarga', categoria: 'Pós-descarga' },
    ],
  },
  {
    nome: 'Limpeza e drenagem do SAO',
    descricao: 'Manutenção mensal do Separador Água-Óleo (CONAMA 273/2000 + condicionante de LO).',
    modulo: 'AMBIENTAL',
    periodicidade: 'MENSAL',
    itens: [
      { ordem: 1, descricao: 'Inspeção visual: nível de óleo na primeira câmara' },
      { ordem: 2, descricao: 'Drenagem da água tratada para rede pluvial/coletor' },
      { ordem: 3, descricao: 'Retirada de óleo sobrenadante' },
      { ordem: 4, descricao: 'Limpeza de canaletas e grades de captação' },
      { ordem: 5, descricao: 'Verificação do sifão hidráulico' },
      { ordem: 6, descricao: 'MTR emitido para óleo retirado (acondicionamento adequado)' },
      { ordem: 7, descricao: 'Registro fotográfico antes/depois' },
    ],
  },
  {
    nome: 'Verificação SPDA / Aterramento',
    descricao: 'Inspeção anual do Sistema de Proteção contra Descargas Atmosféricas (NBR 5419).',
    modulo: 'OPERACIONAL',
    periodicidade: 'ANUAL',
    itens: [
      { ordem: 1, descricao: 'Continuidade elétrica de captores aferida' },
      { ordem: 2, descricao: 'Hastes de aterramento com resistência ≤10 ohm (laudo)' },
      { ordem: 3, descricao: 'Cabos de descida sem corrosão ou rompimento' },
      { ordem: 4, descricao: 'Equipotencialização de tubulações e tanques verificada' },
      { ordem: 5, descricao: 'ART de inspeção emitida por engenheiro responsável' },
      { ordem: 6, descricao: 'Laudo arquivado e disponível para fiscalização' },
    ],
  },
  {
    nome: 'Inspeção mensal de câmaras de contenção',
    descricao: 'Verificação de câmaras de spill, calçada e acesso (NBR 13784).',
    modulo: 'ESTANQUEIDADE',
    periodicidade: 'MENSAL',
    itens: [
      { ordem: 1, descricao: 'Estanqueidade das câmaras (sem infiltração de água externa)' },
      { ordem: 2, descricao: 'Ausência de combustível ou resíduos no fundo' },
      { ordem: 3, descricao: 'Tampa íntegra com vedação adequada' },
      { ordem: 4, descricao: 'Conexões de tubulação visíveis sem vazamento' },
      { ordem: 5, descricao: 'Sensores eletrônicos (se houver) testados', obrigatorio: false },
      { ordem: 6, descricao: 'Limpeza realizada e registrada' },
    ],
  },
  {
    nome: 'Inspeção mensal de extintores e hidrantes',
    descricao: 'Verificação dos equipamentos de combate a incêndio (IT do CBM).',
    modulo: 'SST',
    periodicidade: 'MENSAL',
    itens: [
      { ordem: 1, descricao: 'Todos os extintores presentes em seus locais sinalizados' },
      { ordem: 2, descricao: 'Pressão dentro da faixa verde no manômetro' },
      { ordem: 3, descricao: 'Lacre íntegro' },
      { ordem: 4, descricao: 'Validade da carga vigente' },
      { ordem: 5, descricao: 'Validade do teste hidrostático vigente' },
      { ordem: 6, descricao: 'Acesso desobstruído (sem objetos à frente)' },
      { ordem: 7, descricao: 'Hidrantes com mangueiras enroladas e esguicho presente', obrigatorio: false },
      { ordem: 8, descricao: 'Pressurização do hidrante testada (se aplicável)', obrigatorio: false },
    ],
  },
  {
    nome: 'Teste trimestral da iluminação de emergência',
    descricao: 'Verificação operacional dos blocos autônomos (IT do CBM).',
    modulo: 'SST',
    periodicidade: 'TRIMESTRAL',
    itens: [
      { ordem: 1, descricao: 'Todos os blocos autônomos identificados' },
      { ordem: 2, descricao: 'Acionamento manual: lâmpadas acendem' },
      { ordem: 3, descricao: 'Autonomia mínima de 1h após corte de energia' },
      { ordem: 4, descricao: 'LEDs/lâmpadas sem queima' },
      { ordem: 5, descricao: 'Sinalização de rotas de fuga visível' },
    ],
  },
  {
    nome: 'Inspeção semanal da pista',
    descricao: 'Verificação operacional de pavimento, sinalização e organização.',
    modulo: 'OPERACIONAL',
    periodicidade: 'SEMANAL',
    itens: [
      { ordem: 1, descricao: 'Pavimento sem manchas de combustível ou óleo' },
      { ordem: 2, descricao: 'Faixas de sinalização visíveis' },
      { ordem: 3, descricao: 'Placas de orientação legíveis' },
      { ordem: 4, descricao: 'Ausência de objetos soltos na pista' },
      { ordem: 5, descricao: 'Iluminação geral funcionando' },
      { ordem: 6, descricao: 'Coletores de resíduos disponíveis e adequados' },
    ],
  },
  {
    nome: 'Pré-turno NR-20 (Inflamáveis)',
    descricao: 'Verificação operacional obrigatória no início de cada turno (NR-20 item 20.10).',
    modulo: 'SST',
    periodicidade: 'DIARIO',
    itens: [
      { ordem: 1, descricao: 'Operadores escalados possuem NR-20 vigente' },
      { ordem: 2, descricao: 'EPIs adequados disponíveis (calçado, luva, óculos)' },
      { ordem: 3, descricao: 'Plano de emergência conhecido e acessível' },
      { ordem: 4, descricao: 'Comunicação com supervisão funcional (rádio/telefone)' },
      { ordem: 5, descricao: 'Sem condições anormais reportadas pelo turno anterior' },
      { ordem: 6, descricao: 'Registro de eventuais ocorrências no livro de turno' },
    ],
  },
  {
    nome: 'Inspeção mensal CIPA',
    descricao: 'Inspeção de segurança realizada pela Comissão (NR-5 item 5.16).',
    modulo: 'SST',
    periodicidade: 'MENSAL',
    itens: [
      { ordem: 1, descricao: 'Riscos do mapa de riscos atualizados' },
      { ordem: 2, descricao: 'Áreas de risco sinalizadas adequadamente' },
      { ordem: 3, descricao: 'EPIs em uso corretamente pelos colaboradores' },
      { ordem: 4, descricao: 'Saídas de emergência desobstruídas' },
      { ordem: 5, descricao: 'Rotas de fuga sinalizadas e iluminadas' },
      { ordem: 6, descricao: 'Registro de quase-acidentes do mês revisado' },
      { ordem: 7, descricao: 'Ata da reunião mensal redigida e arquivada' },
    ],
  },
]

export async function seedChecklists(prisma: PrismaClient, tenantId: string) {
  let createdCount = 0
  let skippedCount = 0

  for (const tpl of TEMPLATES) {
    const existing = await prisma.checklistTemplate.findFirst({
      where: { tenantId, nome: tpl.nome },
      select: { id: true },
    })
    if (existing) {
      skippedCount += 1
      continue
    }
    await prisma.checklistTemplate.create({
      data: {
        tenantId,
        nome: tpl.nome,
        descricao: tpl.descricao,
        modulo: tpl.modulo,
        periodicidade: tpl.periodicidade,
        ativo: true,
        itens: {
          create: tpl.itens.map((it) => ({
            ordem: it.ordem,
            descricao: it.descricao,
            obrigatorio: it.obrigatorio ?? true,
            categoria: it.categoria,
          })),
        },
      },
    })
    createdCount += 1
  }

  console.log(`✅ Checklists: ${createdCount} templates criados, ${skippedCount} já existentes`)
}
