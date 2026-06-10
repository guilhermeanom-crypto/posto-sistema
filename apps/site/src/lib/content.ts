const SISTEMA_BASE_URL = (
  process.env.NEXT_PUBLIC_SISTEMA_BASE_URL ?? 'https://sistema.habilisconsultoria.com.br'
).replace(/\/$/, '')

export const SITE_PUBLICO_URL = '/'
export const SISTEMA_URL = '/sistema'
export const SISTEMA_EQUIPE_URL = `${SISTEMA_BASE_URL}/login`
export const SISTEMA_CAMPO_URL = `${SISTEMA_BASE_URL}/equipe/login`
export const SISTEMA_PORTAL_URL = `${SISTEMA_BASE_URL}/portal/login`

export const CONTATO = {
  endereco: 'Rua C-240, Quadra 561, Lote 17, Jardim América — Goiânia/GO',
  telefone: '(62) 3996-4151',
  whatsapp: '5562999990001',
  email: 'contato@habilis.com.br',
  horario: 'Segunda a sexta, das 8h às 18h',
}

export const NAV = [
  { label: 'Sobre a Hábilis', href: '/sobre' },
  { label: 'Serviços', href: '/servicos' },
  { label: 'Projetos', href: '/projetos' },
  { label: 'Clientes', href: '/clientes' },
  { label: 'Contato', href: '/contato' },
  { label: 'Notícias e informativos', href: '/noticias' },
  { label: 'Trabalhe conosco', href: '/trabalhe-conosco' },
  { label: 'Canal de denúncias', href: '/canal-de-denuncias' },
] as const

export const NUMEROS = [
  { valor: '+15 anos', label: 'de experiência técnica em licenciamento, patrimônio e conformidade' },
  { valor: '+208 projetos', label: 'frentes executadas em contextos regulatórios distintos' },
  { valor: '+200 clientes', label: 'operações atendidas com suporte técnico especializado' },
  { valor: 'Multissetorial', label: 'mineração, energia, obras, postos, rodovias, ferrovias e loteamentos' },
]

export type ServiceItem = {
  slug: string
  titulo: string
  sigla: string
  resumo: string
  icone?: string
  imagem?: string
  valor?: string
}

export type AreaAtuacao = {
  id: string
  label: string
  titulo: string
  resumo: string
  image: string
  imageAlt: string
  itens: ServiceItem[]
}

export const AREAS_ATUACAO: AreaAtuacao[] = [
  {
    id: 'operacoes-regulatorias',
    label: 'Operação multiempreendimento',
    titulo: 'Licenciamento, conformidade e gestão operacional',
    resumo:
      'O sistema Hábilis organiza a rotina regulatória de qualquer empreendimento com exigência de licença, condicionantes, documentos, passivos, campo e leitura executiva.',
    image: '/images/habilis/servico-postos-combustiveis-operacoes-reguladas.png',
    imageAlt:
      'Operação regulatória aplicada a postos de combustíveis, documentação crítica e gestão contínua de conformidade.',
    itens: [
      {
        slug: 'licenciamento-ambiental-empreendimentos',
        titulo: 'Licenciamento ambiental de empreendimentos',
        sigla: 'LP · LI · LO · LAS',
        resumo:
          'Condução de licenças prévias, de instalação, de operação e ritos simplificados junto a órgãos estaduais, federais e municipais, com cronograma e trilha documental rastreável.',
        icone: 'FileText',
        imagem: '/site/foco-licenca-empreendimento.jpg',
        valor: 'LP, LI, LO com cronograma viável e trilha auditável.',
      },
      {
        slug: 'gestao-condicionantes-obrigacoes',
        titulo: 'Gestão de condicionantes e obrigações críticas',
        sigla: 'D-90 · D-30 · D-7',
        resumo:
          'Matriz de obrigações, rotina de cobrança interna, evidências e alertas para não perder prazo nem deixar passivo documental se formar.',
        icone: 'CalendarClock',
        imagem: '/site/foco-condicionantes.jpg',
        valor: 'Nenhum prazo perdido. Nenhum passivo silencioso.',
      },
      {
        slug: 'dossie-documental-auditoria',
        titulo: 'Dossiê documental e prontidão para auditoria',
        sigla: 'Documentos · Protocolos',
        resumo:
          'Centralização de licenças, protocolos, relatórios, laudos e comunicações em base pronta para auditoria, fiscalização e consulta executiva.',
        icone: 'FolderSearch',
        imagem: '/site/foco-dossie.jpg',
        valor: 'Base pronta para auditoria a qualquer momento.',
      },
      {
        slug: 'outorgas-cadastros-interfaces',
        titulo: 'Outorgas, cadastros e interfaces acessórias',
        sigla: 'Órgãos · Cadastros',
        resumo:
          'Acompanhamento de cadastros, registros, outorgas e exigências complementares que compõem a vida regulatória de ativos complexos.',
        icone: 'Stamp',
        imagem: '/site/foco-outorgas.jpg',
        valor: 'Vida regulatória completa, não só a licença principal.',
      },
      {
        slug: 'operacao-segura-e-avcb',
        titulo: 'Operação segura, SST e AVCB',
        sigla: 'PGR · PCMSO · AVCB',
        resumo:
          'Integração entre exigências de bombeiros, saúde e segurança ocupacional e rotinas de campo para ambientes com criticidade operacional.',
        icone: 'HardHat',
        imagem: '/site/foco-sst-avcb.jpg',
        valor: 'Bombeiros, saúde e segurança no mesmo cronograma.',
      },
      {
        slug: 'defesas-tecnicas-autos',
        titulo: 'Defesas técnicas, autos e respostas regulatórias',
        sigla: 'IBAMA · SEMAD · IPHAN',
        resumo:
          'Resposta técnico-regulatória a autos de infração, exigências e passivos, com leitura documental, estratégia de sustentação e coordenação de próximos passos.',
        icone: 'Scale',
        imagem: '/site/foco-defesas-tecnicas.jpg',
        valor: 'Auto não vira passivo. Vira resposta técnica.',
      },
    ],
  },
  {
    id: 'licenciamento-regularizacao',
    label: 'Licenciamento e governança',
    titulo: 'Licenciamento, monitoramento e regularização ambiental',
    resumo:
      'A Hábilis também opera frentes clássicas de consultoria ambiental: licenciamento, outorgas, monitoramentos, inventários e governança regulatória para empreendimentos de diferentes portes.',
    image: '/images/habilis/servico-industrial-licenciamento-condicionantes.png',
    imageAlt:
      'Equipe técnica em frente de licenciamento, condicionantes e regularização ambiental.',
    itens: [
      {
        slug: 'outorga-hidrica',
        titulo: 'Outorga e gestão de recursos hídricos',
        sigla: 'Poço · Captação',
        resumo:
          'Regularização de captações, poços e uso de recursos hídricos, com apoio documental, monitoramento e interface com órgãos competentes.',
        icone: 'Droplets',
      },
      {
        slug: 'monitoramentos-ambientais',
        titulo: 'Monitoramentos ambientais',
        sigla: 'Água · Solo · Ar',
        resumo:
          'Campanhas periódicas, interpretação de resultados e relatórios para qualidade de água, solo, emissões e demais indicadores ambientais.',
        icone: 'Activity',
      },
      {
        slug: 'gestao-condicionantes',
        titulo: 'Gestão de condicionantes',
        sigla: 'D-90 · D-30 · D-7',
        resumo:
          'Matriz de obrigações, calendário executivo e comprovação documental para condicionantes ambientais, operacionais e de obras.',
        icone: 'CalendarClock',
      },
      {
        slug: 'inventarios-relatorios',
        titulo: 'Inventários e relatórios ambientais',
        sigla: 'Inventário · Diagnóstico',
        resumo:
          'Levantamentos, diagnósticos, relatórios técnicos e consolidação de base para auditorias, licenças e tomada de decisão.',
        icone: 'ClipboardList',
      },
    ],
  },
  {
    id: 'territorio-rural',
    label: 'Território e rural',
    titulo: 'CAR, regularização fundiária e supressão vegetal',
    resumo:
      'Nas frentes territoriais, a Hábilis atua em leitura fundiária, cadastro ambiental, estudos para uso do solo e preparação técnica para intervenções vegetais e regularização de ativos.',
    image: '/images/habilis/servico-rural-car-leitura-territorial.png',
    imageAlt:
      'Leitura territorial rural, CAR, georreferenciamento e análise fundiária aplicada.',
    itens: [
      {
        slug: 'car-e-cra',
        titulo: 'CAR e cadastros territoriais',
        sigla: 'CAR · SIG',
        resumo:
          'Leitura territorial, apoio cadastral, compatibilização de polígonos e organização técnica para passivos, reservas e uso do solo.',
        icone: 'MapPin',
      },
      {
        slug: 'regularizacao-fundiaria',
        titulo: 'Regularização fundiária',
        sigla: 'Imóvel · Posse · Dominialidade',
        resumo:
          'Apoio documental e leitura técnica para organização fundiária de ativos, empreendimentos e áreas com exigência de lastro territorial.',
        icone: 'Compass',
      },
      {
        slug: 'supressao-vegetal',
        titulo: 'Supressão vegetal e intervenções',
        sigla: 'ASV · Inventário',
        resumo:
          'Preparação de estudos, inventários, peças técnicas e interface com licenciadores para intervenções em vegetação e áreas sensíveis.',
        icone: 'TreePine',
      },
      {
        slug: 'planejamento-uso-solo',
        titulo: 'Planejamento territorial e uso do solo',
        sigla: 'Diagnóstico · Viabilidade',
        resumo:
          'Leitura de restrições, oportunidades e conflitos territoriais para implantação, expansão ou reordenamento de empreendimentos.',
        icone: 'Map',
      },
    ],
  },
  {
    id: 'patrimonio-cultural',
    label: 'Patrimônio e projetos especiais',
    titulo: 'Patrimônio cultural, inventários e arqueologia aplicada',
    resumo:
      'O site oficial da Hábilis ainda mostra com força essa origem: patrimônio cultural brasileiro, licenciamento arqueológico e acompanhamento de empreendimentos de infraestrutura, mineração e energia.',
    image: '/images/habilis/servico-arqueologia-patrimonio-cultural.png',
    imageAlt:
      'Patrimônio cultural, arqueologia aplicada e monitoramento técnico em campo.',
    itens: [
      {
        slug: 'fca',
        titulo: 'Ficha de Caracterização da Atividade',
        sigla: 'FCA',
        resumo:
          'Estruturação da FCA como base para instrução inicial de processos de patrimônio cultural e licenciamento arqueológico junto ao IPHAN.',
        icone: 'FileText',
      },
      {
        slug: 'aipi',
        titulo: 'Avaliação de Impacto ao Patrimônio Imaterial',
        sigla: 'AIPI',
        resumo:
          'Leitura de impacto sobre referências culturais, salvaguarda e relação entre empreendimento, território e comunidades.',
        icone: 'Users',
      },
      {
        slug: 'papipa-paipa',
        titulo: 'PAPIPA, PAIPA e diagnósticos arqueológicos',
        sigla: 'PAPIPA · PAIPA',
        resumo:
          'Estudos de potencial, impacto e diagnóstico arqueológico para instrução de licenças, implantação de ativos e adequação perante o IPHAN.',
        icone: 'Search',
      },
      {
        slug: 'pgpa-monitoramento',
        titulo: 'PGPA, resgate e monitoramento arqueológico',
        sigla: 'PGPA · Campo',
        resumo:
          'Acompanhamento em campo, gestão patrimonial e execução de planos associados a obras civis, energia, mineração, rodovias e ferrovias.',
        icone: 'Landmark',
      },
    ],
  },
]

export const SERVICOS = AREAS_ATUACAO.flatMap((area) => area.itens)
export const SERVICOS_FOCO = AREAS_ATUACAO[0]?.itens ?? []
export const ATUACOES_AMPLIADAS = AREAS_ATUACAO.slice(1)

export const SERVICOS_INTERNOS_ESSENCIAIS = [
  {
    titulo: 'Licenciamento e processos',
    resumo:
      'MCE, EAS, RAS, RCA, PCA, LP, LI, LO, renovação, retificação, diligências e acompanhamento processual.',
  },
  {
    titulo: 'Outorgas e recursos hídricos',
    resumo:
      'Declarações de uso, solicitações e renovação de outorga, cadastros hídricos, captações, poços e estudos de demanda.',
  },
  {
    titulo: 'Passivos e áreas contaminadas',
    resumo:
      'Diagnóstico, investigação, planos de intervenção, remediação, monitoramento e encerramento técnico de passivos.',
  },
  {
    titulo: 'Fauna, flora e monitoramentos',
    resumo:
      'Inventários, monitoramentos, supressão vegetal, compensações e leituras ambientais de apoio ao licenciamento.',
  },
] as const

export type ServicoPrestado = {
  slug: string
  titulo: string
  resumo: string
  itens: readonly string[]
  icone: string
  imagem: string
  valor: string
}

export const SERVICOS_PRESTADOS_ESSENCIAIS: readonly ServicoPrestado[] = [
  {
    slug: 'licenciamento-regularizacao',
    titulo: 'Licenciamento e regularização ambiental',
    resumo:
      'Estruturação de processos, licenças, relatórios, condicionantes, diligências e acompanhamento junto aos órgãos ambientais.',
    itens: [
      'LP, LI, LO e renovações',
      'Regularização de empreendimentos em operação',
      'Relatórios, memoriais e dossiês',
      'Condicionantes e exigências',
      'Apoio a protocolos e acompanhamento',
    ],
    icone: 'FileText',
    imagem: '/images/habilis/servico-industrial-licenciamento-condicionantes.png',
    valor: 'Reduz prazo de licença e retrabalho com o órgão licenciador.',
  },
  {
    slug: 'outorgas-recursos-hidricos',
    titulo: 'Outorgas e recursos hídricos',
    resumo:
      'Atuação sobre captações, poços, usos da água, cadastros e estudos técnicos que suportam regularização hídrica.',
    itens: [
      'Solicitação e renovação de outorga',
      'Poços, captações e usos insignificantes',
      'Estudos de demanda e suporte técnico',
      'Organização documental e protocolo',
      'Integração com licenciamento ambiental',
    ],
    icone: 'Droplets',
    imagem: '/site/servico-recursos-hidricos.jpg',
    valor: 'Captação regularizada, auditável e sem risco de embargo hídrico.',
  },
  {
    slug: 'passivos-areas-contaminadas',
    titulo: 'Passivos e áreas contaminadas',
    resumo:
      'Diagnóstico, investigação, planos de intervenção e encerramento técnico de áreas com passivo ambiental.',
    itens: [
      'Diagnóstico preliminar',
      'Matriz de risco',
      'Organização de laudos e investigações',
      'Interface com laboratórios e terceiros',
      'Plano de ação e acompanhamento',
    ],
    icone: 'FlaskConical',
    imagem: '/site/servico-passivos.jpg',
    valor: 'Encerra passivo com lastro técnico e jurídico defensável.',
  },
  {
    slug: 'fauna-flora-supressao',
    titulo: 'Fauna, flora e supressão vegetal',
    resumo:
      'Inventários, monitoramentos, resgate, caracterização florística e suporte técnico para intervenções vegetais.',
    itens: [
      'Inventário florestal',
      'Autorização de supressão',
      'Levantamento de fauna e flora',
      'Compensações e condicionantes',
      'Acompanhamento técnico',
    ],
    icone: 'Leaf',
    imagem: '/site/servico-fauna-flora.jpg',
    valor: 'Mantém o cronograma vivo mesmo em área ambientalmente sensível.',
  },
  {
    slug: 'car-regularizacao-rural',
    titulo: 'CAR, regularização rural e leitura territorial',
    resumo:
      'Cadastro Ambiental Rural, retificações, análise de APP/Reserva Legal e diagnóstico rural para empreendimentos territoriais.',
    itens: [
      'CAR e retificações',
      'APP e Reserva Legal',
      'Diagnóstico rural',
      'Análise geoespacial',
      'Apoio a DAI/PRA quando aplicável',
    ],
    icone: 'MapPin',
    imagem: '/images/habilis/servico-rural-car-leitura-territorial.png',
    valor: 'Base territorial organizada para decisão ambiental e fundiária.',
  },
  {
    slug: 'patrimonio-cultural-arqueologia',
    titulo: 'Patrimônio cultural e arqueologia',
    resumo:
      'Base histórica da Hábilis: FCA, AIPI, PAIPA, PAPIPA, PGPA, PAIPE, diagnóstico, prospecção, resgate e educação patrimonial.',
    itens: [
      'FCA',
      'AIPI',
      'PAIPA, PAPIPA e PGPA',
      'PAIPE',
      'Diagnóstico, prospecção e resgate',
      'Educação patrimonial',
    ],
    icone: 'Landmark',
    imagem: '/images/habilis/servico-arqueologia-patrimonio-cultural.png',
    valor: 'Experiência histórica da Hábilis aplicada ao licenciamento.',
  },
  {
    slug: 'espeleologia-cavidades',
    titulo: 'Espeleologia e cavidades',
    resumo:
      'Leitura técnica do terreno para áreas com potencial espeleológico, cavidades naturais subterrâneas, análise geológica e suporte ao licenciamento.',
    itens: [
      'Potencial espeleológico',
      'Cavidades naturais subterrâneas',
      'Análise geológica e geomorfológica',
      'Mapas e evidências de campo',
      'Suporte ao licenciamento',
    ],
    icone: 'Mountain',
    imagem: '/images/habilis/servico-espeleologia-cavidades.png',
    valor: 'Leitura técnica do terreno para reduzir risco em áreas sensíveis.',
  },
  {
    slug: 'mineracao-grandes-empreendimentos',
    titulo: 'Mineração e grandes empreendimentos',
    resumo:
      'Licenciamento, condicionantes, patrimônio cultural, áreas sensíveis, inventários, relatórios e acompanhamento técnico para operações de alto risco regulatório.',
    itens: [
      'Licenciamento e condicionantes',
      'Patrimônio cultural integrado',
      'Áreas sensíveis',
      'Inventários e relatórios',
      'Acompanhamento técnico e dossiês',
    ],
    icone: 'HardHat',
    imagem: '/images/habilis/servico-mineracao-licenciamento-campo.png',
    valor: 'Suporte técnico para operações com alto risco regulatório.',
  },
  {
    slug: 'urbano-obras-expansao',
    titulo: 'Urbano, obras e expansão territorial',
    resumo:
      'Leitura territorial integrada à obra e à documentação para loteamentos, construção civil e projetos em expansão.',
    itens: [
      'Leitura territorial',
      'Uso do solo',
      'Licenças e autorizações',
      'Loteamentos e construção civil',
      'Suporte a projetos em expansão',
    ],
    icone: 'Building2',
    imagem: '/images/habilis/servico-urbano-regularizacao-territorial.png',
    valor: 'Integra território, obra e regularidade documental.',
  },
  {
    slug: 'postos-combustiveis',
    titulo: 'Postos de combustíveis e operações reguladas',
    resumo:
      'Regularidade ambiental e operacional contínua para postos: uso do solo, SASC, SAO, resíduos, outorga, AVCB e gestão de terceiros.',
    itens: [
      'Uso do solo e licenciamento',
      'SASC e estanqueidade',
      'SAO e efluentes',
      'Resíduos, OLUC, MTR e CDF',
      'Outorga, AVCB e terceiros',
      'Gestão contínua de regularidade',
    ],
    icone: 'Fuel',
    imagem: '/images/habilis/servico-postos-combustiveis-operacoes-reguladas.png',
    valor: 'Regularidade ambiental e operacional para postos em funcionamento.',
  },
  {
    slug: 'gestao-condicionantes',
    titulo: 'Gestão de condicionantes e conformidade',
    resumo:
      'Matriz de condicionantes, controle de prazos, status report, evidências de atendimento, dossiê auditável e interface com o Sistema Hábilis.',
    itens: [
      'Matriz de condicionantes',
      'Controle de prazos',
      'Status report',
      'Evidências de atendimento',
      'Dossiê de conformidade',
      'Interface com Sistema Hábilis',
    ],
    icone: 'CalendarClock',
    imagem: '/images/habilis/servico-gestao-condicionantes-conformidade.png',
    valor: 'Menos vencimentos perdidos, mais evidência pronta para auditoria.',
  },
]

export type SetorAtuacao = {
  titulo: string
  resumo: string
  icone: string
  imagem: string
}

export const SETORES_ATUACAO: readonly SetorAtuacao[] = [
  {
    titulo: 'Empreendimentos com rotina regulatória crítica',
    resumo: 'Operações que dependem de licença vigente, condicionantes monitoradas e documentação pronta para auditoria.',
    icone: 'Building2',
    imagem: '/site/setor-empreendimentos.jpg',
  },
  {
    titulo: 'Postos e redes de combustíveis',
    resumo: 'Operações urbanas, rodoviárias, multi-bandeira, lojas, troca de óleo e estruturas correlatas.',
    icone: 'Fuel',
    imagem: '/site/setor-postos.jpg',
  },
  {
    titulo: 'Mineração e grandes obras',
    resumo: 'Frentes com exigência de monitoramento, condicionantes complexas e interface multiórgão.',
    icone: 'Mountain',
    imagem: '/site/setor-mineracao.jpg',
  },
  {
    titulo: 'Energia e infraestrutura linear',
    resumo: 'Linhas de transmissão, parques eólicos, usinas, rodovias e ferrovias com exigências ambientais e patrimoniais.',
    icone: 'Wind',
    imagem: '/site/setor-energia.jpg',
  },
  {
    titulo: 'Distribuição, bases e transporte',
    resumo: 'Distribuidoras, bases de armazenamento, TRRs, cargas perigosas e cadeias de abastecimento.',
    icone: 'Truck',
    imagem: '/site/setor-distribuicao.jpg',
  },
  {
    titulo: 'Território, rural e ativos fundiários',
    resumo: 'CAR, leitura territorial, supressão, regularização e organização documental de ativos.',
    icone: 'Compass',
    imagem: '/site/setor-rural.jpg',
  },
  {
    titulo: 'Patrimônio cultural e projetos especiais',
    resumo: 'Atuação junto ao IPHAN em inventários, diagnósticos, programas e monitoramentos especializados.',
    icone: 'Landmark',
    imagem: '/site/setor-patrimonio.jpg',
  },
]

export const PROJETOS = [
  {
    cliente: 'Operação distribuída com múltiplos empreendimentos',
    uf: 'GO · TO · MT',
    area: 'Operação e conformidade',
    imagem: '/images/habilis/servico-gestao-condicionantes-conformidade.png',
    escopo:
      'Reestruturação do calendário regulatório, licenças, rotinas documentais e matriz de condicionantes para uma operação distribuída em diferentes perfis de ativo.',
  },
  {
    cliente: 'Base de combustíveis e distribuição',
    uf: 'GO',
    area: 'Licenciamento e monitoramento',
    imagem: '/images/habilis/servico-postos-combustiveis-operacoes-reguladas.png',
    escopo:
      'Integração entre regularização ambiental, recursos hídricos, monitoramentos e organização documental para auditoria e expansão operacional.',
  },
  {
    cliente: 'Ativo rural com passivos territoriais',
    uf: 'MT',
    area: 'Território e rural',
    imagem: '/images/habilis/servico-rural-car-leitura-territorial.png',
    escopo:
      'Leitura territorial, apoio a CAR, organização fundiária e preparação técnica para intervenções ambientais em áreas sensíveis.',
  },
  {
    cliente: 'Empreendimento de infraestrutura',
    uf: 'PA · MA',
    area: 'Patrimônio cultural',
    imagem: '/images/habilis/servico-arqueologia-patrimonio-cultural.png',
    escopo:
      'Acompanhamento patrimonial e monitoramento arqueológico em obra com exigência contínua de interface junto ao IPHAN.',
  },
  {
    cliente: 'Operação industrial em expansão',
    uf: 'DF · GO',
    area: 'Licenciamento e governança',
    imagem: '/images/habilis/servico-industrial-licenciamento-condicionantes.png',
    escopo:
      'Diagnóstico, condicionantes, relatórios e consolidação de base técnica para tomada de decisão e redução de risco regulatório.',
  },
  {
    cliente: 'Programa patrimonial em ativo energético',
    uf: 'BA · PI',
    area: 'Patrimônio e arqueologia aplicada',
    imagem: '/images/habilis/servico-espeleologia-cavidades.png',
    escopo:
      'Estruturação de peças como FCA, estudos de impacto e monitoramento de campo em corredor de infraestrutura energética.',
  },
]

export const ESTADOS_ATUACAO = ['GO', 'DF', 'MG', 'MT', 'MS', 'TO', 'BA', 'PA', 'MA', 'PI', 'RO', 'SP']

export const CLIENTES_PARCEIROS = [
  'Redes de postos e combustíveis',
  'Distribuidoras e bases logísticas',
  'Operações industriais em expansão',
  'Ativos rurais e territoriais',
  'Projetos de mineração',
  'Linhas de transmissão e energia',
  'Projetos rodoviários e ferroviários',
  'Construtoras e loteamentos',
  'Consultorias de engenharia parceiras',
  'Operações com interface patrimonial',
  'Empreendimentos com exigência multiórgão',
  'Clientes que precisam de governança executável',
]

export const NOTICIAS = [
  {
    slug: 'governanca-regulatoria-postos-multiplas-unidades',
    titulo: 'Como estruturar governança regulatória em redes de postos com múltiplas unidades',
    resumo:
      'Matriz de obrigações, janela de vencimentos, responsáveis nomeados e dossiê auditável: o que muda quando a operação cresce.',
    data: '2026-05-02',
    categoria: 'Postos e combustíveis',
  },
  {
    slug: 'fca-e-patrimonio-cultural-empreendimentos',
    titulo: 'FCA e patrimônio cultural: por que a peça inicial muda o curso do licenciamento',
    resumo:
      'A ficha de caracterização não é burocracia vazia. Ela organiza o enquadramento técnico e reduz retrabalho em projetos com interface junto ao IPHAN.',
    data: '2026-04-19',
    categoria: 'Patrimônio cultural',
  },
  {
    slug: 'car-regularizacao-fundiaria-e-expansao',
    titulo: 'CAR, leitura fundiária e expansão: onde os projetos perdem tempo sem perceber',
    resumo:
      'Sem leitura territorial consistente, o passivo aparece tarde. Mostramos como antecipar conflitos antes da fase crítica do licenciamento.',
    data: '2026-04-07',
    categoria: 'Território e rural',
  },
]

export const VAGAS = [
  {
    titulo: 'Analista Ambiental Pleno',
    local: 'Goiânia/GO — presencial',
    requisitos: ['Licenciamento e relatórios ambientais', 'Boa escrita técnica', 'Interface com órgãos e clientes'],
  },
  {
    titulo: 'Coordenador(a) de Campo',
    local: 'Centro-Norte — viagens frequentes',
    requisitos: ['Gestão de equipes em obra ou campo', 'Leitura operacional e documental', 'CNH B e disponibilidade'],
  },
  {
    titulo: 'Especialista Territorial ou Fundiário',
    local: 'Híbrido — Centro-Oeste',
    requisitos: ['CAR, georreferenciamento ou leitura fundiária', 'Organização documental', 'Capacidade analítica'],
  },
]

export const VALORES_HABILIS = [
  {
    titulo: 'Leitura integrada',
    texto:
      'Não separamos operação, território, patrimônio e risco regulatório em caixinhas independentes. A leitura é única e executável.',
  },
  {
    titulo: 'Rigor técnico',
    texto:
      'Toda entrega nasce de norma, evidência de campo e histórico documental. Técnica primeiro, discurso depois.',
  },
  {
    titulo: 'Cadência operacional',
    texto:
      'Mais do que produzir laudos, organizamos ritmo de execução, responsáveis, prazos críticos e próximos passos.',
  },
  {
    titulo: 'Transparência com o cliente',
    texto:
      'O cliente precisa enxergar o cenário real do ativo: o que vence, o que trava, o que depende de decisão e o que já está sob controle.',
  },
]
