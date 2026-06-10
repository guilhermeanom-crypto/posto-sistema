const LOGISTICA_REVERSA_POSTO_COLETIVO = {
  modelo_operacional: {
    tipo: "Sistema Coletivo via Entidade Gestora",
    base_legal: [
      "Lei 12.305/2010 (PNRS)",
      "Decreto 10.936/2022",
      "Decreto 11.413/2023 (Créditos de Reciclagem)",
      "Sistema Recicla Goiás"
    ],
    principio: "Responsabilidade Compartilhada + Compensação por Equivalência de Massa",
    estrategia:
      "O posto não executa a reciclagem direta — ele COMPENSA sua massa colocada no mercado via aquisição de créditos certificados"
  },

  enquadramento_do_posto: {
    papel: "Comerciante/Distribuidor",
    obrigacoes: [
      "Participar de sistema de logística reversa",
      "Comprovar destinação adequada",
      "Manter rastreabilidade documental",
      "Atender metas ambientais"
    ],
    observacao_estrategica:
      "Posto NÃO estrutura sistema próprio → ADERE ao coletivo (reduz custo e complexidade)"
  },

  fluxos_aplicaveis_no_posto: {
    obrigatorios: [
      "Embalagens de óleo lubrificante",
      "Óleo lubrificante usado (OLUC)",
      "Filtros contaminados",
      "Estopas e resíduos contaminados"
    ],
    complementares: [
      "Plásticos em geral (conveniência)",
      "Latas e metais",
      "Papel e papelão",
      "Pilhas e baterias",
      "Lâmpadas"
    ]
  },

  metodologia_operacional: {
    etapa_1_diagnostico: {
      descricao: "Levantamento da massa de resíduos gerados/comercializados",
      inputs: [
        "Notas fiscais de compra",
        "Volume de óleo vendido",
        "Consumo operacional",
        "Histórico do posto"
      ],
      output: "Massa anual estimada por tipo de resíduo"
    },

    etapa_2_classificacao: {
      descricao: "Classificação por cadeia de logística reversa",
      saida: [
        "Embalagens plásticas",
        "Resíduos perigosos",
        "Recicláveis comuns"
      ]
    },

    etapa_3_adesao_sistema: {
      descricao: "Adesão à entidade gestora homologada",
      acoes: [
        "Cadastro no sistema (ex: Recicla Goiás)",
        "Vinculação à entidade gestora",
        "Formalização contratual"
      ]
    },

    etapa_4_calculo_meta: {
      descricao: "Definição da meta de compensação",
      metodo: "Equivalência de massa",
      formula: "massa_colocada_no_mercado x coeficiente_setorial",
      resultado: "Meta anual de compensação (kg ou ton)"
    },

    etapa_5_compensacao: {
      descricao: "Aquisição de créditos de reciclagem",
      origem_creditos: [
        "Cooperativas",
        "Operadores logísticos",
        "Recicladoras"
      ],
      garantia:
        "Créditos lastreados em notas fiscais e validados por verificadores independentes"
    },

    etapa_6_rastreabilidade: {
      descricao: "Garantia de integridade do sistema",
      documentos: [
        "Notas fiscais de reciclagem",
        "Certificados de crédito",
        "Relatórios da entidade gestora",
        "Auditoria independente"
      ]
    },

    etapa_7_certificacao: {
      descricao: "Comprovação de atendimento à logística reversa",
      saida: [
        "Certificado de compensação",
        "Relatório anual",
        "Comprovação para fiscalização"
      ]
    },

    etapa_8_relatorio_anual: {
      descricao: "Entrega de resultados",
      conteudo: [
        "Massa declarada",
        "Meta",
        "Créditos adquiridos",
        "Saldo de conformidade"
      ]
    }
  },

  estrutura_fisica_no_posto: {
    nao_e_foco_principal: true,
    mas_necessario: [
      "Área de segregação",
      "Bombonas para OLUC",
      "Armazenamento temporário",
      "Identificação de resíduos",
      "Controle interno básico"
    ],
    observacao:
      "No modelo coletivo, a estrutura física é simplificada — foco é documental e compensatório"
  },

  rastreabilidade: {
    pilares: [
      "Nota fiscal",
      "Lastro real de reciclagem",
      "Verificação independente",
      "Evitar dupla contagem"
    ],
    risco_critico:
      "Compra de crédito sem lastro → irregularidade grave"
  },

  riscos_de_nao_conformidade: {
    ambientais: [
      "Contaminação do solo",
      "Contaminação hídrica",
      "Resíduos perigosos sem controle"
    ],
    legais: [
      "Multas ambientais",
      "Auto de infração",
      "Embargo",
      "Problemas no licenciamento"
    ],
    estrategicos: [
      "Perda de credibilidade",
      "Risco em auditorias",
      "Problemas com renovação de licença"
    ]
  },

  integracao_com_licenciamento: {
    obrigatorio: true,
    relacao: [
      "Condicionantes ambientais",
      "Renovação de licença",
      "Fiscalização SEMAD/AMMA"
    ],
    evidencia_exigida: [
      "Comprovação de logística reversa ativa",
      "Relatórios atualizados",
      "Certificados válidos"
    ]
  },

  operacao_habilis: {
    papel: "Gestão completa do sistema",
    entregas: [
      "Diagnóstico regulatório",
      "Cálculo de massa",
      "Adesão ao sistema coletivo",
      "Gestão de créditos",
      "Monitoramento contínuo",
      "Relatórios e auditoria",
      "Integração com licenciamento"
    ],

    diferencial: [
      "Não vendemos coleta → vendemos CONFORMIDADE",
      "Gestão estratégica de risco ambiental",
      "Integração com operação do posto",
      "Rastreabilidade auditável"
    ]
  },

  fluxo_executivo_resumido: [
    "Levantar massa de resíduos",
    "Classificar fluxos obrigatórios",
    "Cadastrar no sistema coletivo",
    "Definir meta de compensação",
    "Comprar créditos de reciclagem",
    "Garantir rastreabilidade",
    "Emitir certificado",
    "Apresentar relatório anual"
  ]
};