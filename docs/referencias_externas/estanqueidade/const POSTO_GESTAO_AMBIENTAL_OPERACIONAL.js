const POSTO_GESTAO_AMBIENTAL_OPERACIONAL = {
  empreendimento: {
    tipo: "Posto de Combustível",
    objetivo: "Estruturar a operação completa de Gestão Ambiental com rotinas, controles, documentos, inspeções, respostas a desvios e governança técnica.",
    escopo: [
      "Conformidade legal e documental",
      "Inspeção operacional de campo",
      "Controle ambiental preventivo",
      "Gestão de resíduos",
      "Controle de efluentes e águas oleosas",
      "Monitoramento de tanques, pistas e SASC",
      "Plano de resposta a emergências ambientais",
      "Treinamento e cultura operacional",
      "Auditoria interna e plano de ação"
    ]
  },

  setores_operacionais: {
    administrativo: {
      objetivo: "Garantir regularidade documental, licenças, contratos, registros e evidências.",
      rotinas: [
        "Conferir validade de licenças e condicionantes",
        "Controlar contratos de coleta, destinação e manutenção",
        "Arquivar MTR, CDF, certificados e relatórios",
        "Atualizar painel de obrigações ambientais",
        "Registrar não conformidades e ações corretivas"
      ]
    },

    pista_de_abastecimento: {
      objetivo: "Controlar riscos de vazamento, derramamento e contaminação por operação diária.",
      pontos_criticos: [
        "Canaletas",
        "Piso impermeável",
        "Bombas",
        "Bicos e mangueiras",
        "Descarga selada",
        "Caixas separadoras"
      ],
      rotinas: [
        "Inspecionar presença de fissuras no piso",
        "Verificar gotejamento em bicos e conexões",
        "Avaliar canaletas e drenagem oleosa",
        "Checar kit de emergência ambiental",
        "Confirmar limpeza segura da pista"
      ]
    },

    area_de_descarga: {
      objetivo: "Garantir segurança e conformidade no recebimento de combustíveis.",
      pontos_criticos: [
        "Bocais de descarga",
        "Vedação",
        "Sinalização",
        "Aterramento",
        "Controle de derrames",
        "Acesso restrito"
      ],
      rotinas: [
        "Inspecionar integridade da área antes da descarga",
        "Validar procedimento operacional do recebimento",
        "Conferir sinais de extravasamento ou respingos",
        "Registrar qualquer anormalidade no recebimento",
        "Verificar limpeza e estanqueidade após operação"
      ]
    },

    sistema_de_armazenamento_subterraneo_de_combustiveis: {
      sigla: "SASC",
      objetivo: "Controlar integridade ambiental dos tanques, linhas e acessórios.",
      componentes: [
        "Tanques",
        "Linhas",
        "Válvulas",
        "Câmaras de contenção",
        "Respiros",
        "Bocas de visita",
        "Sensores e alarmes, quando existentes"
      ],
      rotinas: [
        "Checar sinais visuais de infiltração ou vazamento",
        "Inspecionar câmaras de contenção",
        "Controlar registros de manutenção e testes",
        "Verificar funcionamento de dispositivos de segurança",
        "Auditar histórico de ocorrências"
      ]
    },

    separador_agua_oleo: {
      sigla: "SAO",
      objetivo: "Garantir retenção de óleos e sólidos antes do descarte/encaminhamento.",
      pontos_criticos: [
        "Entrada",
        "Caixas de passagem",
        "Compartimentos",
        "Saída",
        "Acúmulo de lodo e óleo",
        "Tampa e vedação"
      ],
      rotinas: [
        "Inspecionar nível de óleo acumulado",
        "Verificar assoreamento/lodo",
        "Controlar limpeza periódica",
        "Arquivar comprovantes de sucção/destinação",
        "Impedir descarte irregular"
      ]
    },

    lavagem_e_troca_de_oleo: {
      objetivo: "Controlar geração de resíduos oleosos, embalagens contaminadas e efluentes.",
      rotinas: [
        "Segregar resíduos contaminados",
        "Armazenar óleo usado em recipientes adequados",
        "Inspecionar área impermeável",
        "Conferir contenção secundária",
        "Validar coleta por empresa licenciada"
      ]
    },

    loja_conveniencia_e_apoio: {
      objetivo: "Gerir resíduos comuns, recicláveis e perigosos associados à operação de apoio.",
      rotinas: [
        "Segregar recicláveis e rejeitos",
        "Controlar resíduos de limpeza",
        "Inspecionar armazenamento temporário",
        "Garantir organização e sinalização"
      ]
    },

    area_externa_e_perimetro: {
      objetivo: "Prevenir passivos por drenagem inadequada, descarte irregular e contaminação difusa.",
      rotinas: [
        "Inspecionar drenagem pluvial",
        "Verificar ausência de descarte indevido",
        "Avaliar contenções e acessos",
        "Observar sinais de solo contaminado",
        "Conferir organização geral"
      ]
    }
  },

  rotina_operacional: {
    diaria: [
      "Inspeção visual da pista, bombas, canaletas e bocais",
      "Checagem de derrames, gotejamentos e manchas",
      "Verificação do kit de emergência ambiental",
      "Conferência da organização do abrigo de resíduos",
      "Registro fotográfico de anomalias"
    ],

    semanal: [
      "Inspeção detalhada da SAO",
      "Verificação do armazenamento temporário de resíduos",
      "Conferência do painel de documentos obrigatórios",
      "Análise de ocorrências e reincidências",
      "Reunião rápida com encarregado operacional"
    ],

    quinzenal: [
      "Auditoria interna simplificada",
      "Revisão de checklists preenchidos",
      "Validação de evidências fotográficas",
      "Atualização do plano de ação corretivo"
    ],

    mensal: [
      "Relatório ambiental operacional do posto",
      "Revisão de condicionantes e vencimentos",
      "Controle de coleta e destinação de resíduos",
      "Inspeção técnica ampliada em todos os setores",
      "Treinamento orientativo de rotina"
    ],

    trimestral: [
      "Auditoria técnica gerencial",
      "Revisão dos indicadores ambientais",
      "Teste da prontidão de resposta a emergência",
      "Revisão dos prestadores ambientais"
    ],

    semestral: [
      "Avaliação macro de conformidade",
      "Revisão da matriz de risco operacional",
      "Atualização dos POPs ambientais",
      "Treinamento de reciclagem"
    ],

    anual: [
      "Diagnóstico ambiental consolidado",
      "Plano anual de melhorias",
      "Revisão completa do sistema documental",
      "Auditoria executiva da gestão ambiental"
    ]
  },

  checklists: {
    checklist_pista: [
      "Piso íntegro e impermeável",
      "Sem trincas ou afundamentos",
      "Sem derramamento visível",
      "Bombas sem vazamento",
      "Bicos e mangueiras íntegros",
      "Canaletas limpas e funcionais",
      "Kit de contenção disponível",
      "Sinalização visível"
    ],

    checklist_descarga: [
      "Área limpa e desobstruída",
      "Bocais íntegros",
      "Tampas vedando adequadamente",
      "Ausência de sinais de extravasamento",
      "Dispositivos de contenção disponíveis",
      "Procedimento conhecido pela equipe"
    ],

    checklist_sao: [
      "Caixa acessível",
      "Sem transbordamento",
      "Sem acúmulo excessivo de óleo",
      "Sem acúmulo excessivo de lodo",
      "Última limpeza registrada",
      "Destinação comprovada"
    ],

    checklist_residuos: [
      "Abrigo identificado",
      "Recipientes adequados",
      "Segregação correta",
      "Perigosos separados",
      "Sem vazamentos",
      "Coleta externa documentada",
      "MTR/CDF arquivados"
    ],

    checklist_documental: [
      "Licença ambiental válida",
      "Condicionantes controladas",
      "Comprovantes de coleta disponíveis",
      "Relatórios organizados",
      "Registros de manutenção arquivados",
      "Plano de emergência disponível",
      "Treinamentos registrados"
    ]
  },

  gestao_de_residuos: {
    classes_controladas: [
      {
        residuo: "Óleo lubrificante usado ou contaminado",
        acondicionamento: "Bombona/tanque específico com contenção",
        destino: "Coletor autorizado/licenciado",
        evidencia: ["Comprovante de coleta", "CDF", "Registro de volume"]
      },
      {
        residuo: "Filtros contaminados",
        acondicionamento: "Recipiente fechado e identificado",
        destino: "Empresa licenciada",
        evidencia: ["MTR", "CDF"]
      },
      {
        residuo: "Estopas/panos contaminados",
        acondicionamento: "Contentor para resíduos perigosos",
        destino: "Destinação ambientalmente adequada",
        evidencia: ["Registro interno", "MTR/CDF"]
      },
      {
        residuo: "Embalagens contaminadas",
        acondicionamento: "Separadas e identificadas",
        destino: "Logística reversa/destinador licenciado",
        evidencia: ["Comprovante de devolução/coleta"]
      },
      {
        residuo: "Lodo da SAO",
        acondicionamento: "Conforme retirada especializada",
        destino: "Empresa licenciada",
        evidencia: ["Ordem de serviço", "Manifesto", "CDF"]
      },
      {
        residuo: "Resíduos recicláveis",
        acondicionamento: "Segregação limpa e coberta",
        destino: "Cooperativa/empresa regular",
        evidencia: ["Registro de coleta"]
      },
      {
        residuo: "Rejeitos comuns",
        acondicionamento: "Coletores comuns",
        destino: "Coleta municipal/privada regular",
        evidencia: ["Rotina operacional"]
      }
    ]
  },

  controle_de_efluentes: {
    fontes: [
      "Drenagem oleosa da pista",
      "Área de troca de óleo",
      "Lavagem, quando existente",
      "Caixas de contenção e passagem"
    ],
    controles: [
      "Direcionamento correto para sistema compatível",
      "Proibição de lançamento irregular",
      "Inspeção periódica da SAO",
      "Controle de limpeza e remoção de lodo/óleo",
      "Registro de manutenção"
    ],
    desvios_criticos: [
      "Transbordamento",
      "Odor anormal persistente",
      "Presença de óleo na saída",
      "Lançamento para drenagem pluvial"
    ]
  },

  monitoramento_e_inspecao: {
    metodologia: {
      etapa_1_planejamento: [
        "Definir roteiro da visita",
        "Separar checklists aplicáveis",
        "Verificar pendências anteriores",
        "Preparar câmera e evidências"
      ],
      etapa_2_campo: [
        "Realizar inspeção por setor",
        "Registrar fotos e anomalias",
        "Classificar risco de cada desvio",
        "Conversar com responsável local"
      ],
      etapa_3_analise: [
        "Consolidar achados",
        "Cruzar achados com obrigações ambientais",
        "Definir ação corretiva/preventiva",
        "Estabelecer prazo e responsável"
      ],
      etapa_4_relatorio: [
        "Emitir relatório técnico operacional",
        "Atualizar painel de conformidade",
        "Gerar plano de ação",
        "Protocolar evidências"
      ]
    },

    classificacao_de_risco: {
      baixo: "Desvio sem potencial imediato relevante, mas que exige ajuste.",
      medio: "Desvio com potencial de reincidência ou impacto operacional.",
      alto: "Desvio com risco de autuação, contaminação ou passivo.",
      critico: "Situação com potencial real de dano ambiental relevante ou interrupção operacional."
    }
  },

  nao_conformidades: {
    fluxo: [
      "Identificar não conformidade",
      "Registrar evidência fotográfica e descritiva",
      "Classificar risco",
      "Definir ação imediata de contenção",
      "Abrir plano de ação corretiva",
      "Designar responsável e prazo",
      "Verificar eficácia da correção",
      "Encerrar somente com evidência"
    ],

    exemplos: [
      {
        nc: "Gotejamento em bomba",
        acao_imediata: "Isolar ponto, comunicar responsável e acionar manutenção",
        acao_corretiva: "Substituição/reparo do componente",
        evidencia_de_fechamento: "Foto pós-correção e ordem de serviço"
      },
      {
        nc: "SAO saturada",
        acao_imediata: "Interromper lançamento crítico e agendar sucção",
        acao_corretiva: "Limpeza completa e registro da destinação",
        evidencia_de_fechamento: "CDF + foto da condição regular"
      },
      {
        nc: "Abrigo de resíduos inadequado",
        acao_imediata: "Reorganizar e segregar temporariamente",
        acao_corretiva: "Adequar estrutura, identificação e contenção",
        evidencia_de_fechamento: "Check fotográfico + checklist"
      }
    ]
  },

  plano_de_resposta_a_emergencias_ambientais: {
    cenarios: [
      "Derramamento de combustível na pista",
      "Extravasamento durante descarga",
      "Vazamento em linha/bomba",
      "Falha em recipiente de óleo usado",
      "Contaminação visível em solo/sistema drenante"
    ],

    resposta_padrao: [
      "Interromper a fonte geradora",
      "Isolar a área",
      "Aplicar material absorvente/contenção",
      "Impedir chegada à drenagem pluvial",
      "Comunicar responsável interno",
      "Registrar ocorrência",
      "Destinar resíduos gerados da contenção",
      "Avaliar necessidade de acionamento técnico especializado"
    ],

    recursos_minimos: [
      "Kit de emergência ambiental",
      "Absorventes",
      "Pá e recipiente de acondicionamento",
      "EPIs compatíveis",
      "Sinalização de isolamento",
      "Lista de contatos de emergência"
    ]
  },

  documentos_e_controles: {
    obrigatorios_na_gestao: [
      "Licença ambiental vigente",
      "Condicionantes organizadas",
      "Plano de atendimento a emergências",
      "Checklists de inspeção",
      "Relatórios mensais",
      "Registros fotográficos",
      "Comprovantes de coleta e destinação",
      "Ordens de serviço de manutenção",
      "Plano de ação de não conformidades",
      "Treinamentos e orientações internas"
    ],

    painel_de_vencimentos: [
      "Licença ambiental",
      "Coletas periódicas",
      "Limpeza de SAO",
      "Contratos ambientais",
      "Treinamentos",
      "Auditorias internas"
    ]
  },

  indicadores_kpi: {
    conformidade_documental_percentual: {
      formula: "(documentos válidos / documentos exigidos) * 100",
      meta: ">= 95%"
    },
    taxa_de_nao_conformidades_abertas: {
      formula: "quantidade de NCs abertas no período",
      meta: "redução contínua"
    },
    tempo_medio_de_fechamento_de_nc: {
      formula: "soma dos dias para fechamento / quantidade de NCs fechadas",
      meta: "<= 15 dias, conforme criticidade"
    },
    coletas_comprovadas_percentual: {
      formula: "(coletas com evidência / coletas previstas) * 100",
      meta: "100%"
    },
    aderencia_a_inspecoes: {
      formula: "(inspeções realizadas / inspeções planejadas) * 100",
      meta: "100%"
    }
  },

  papeis_e_responsabilidades: {
    habillis_consultoria: [
      "Estruturar sistema de gestão ambiental do posto",
      "Realizar inspeções técnicas periódicas",
      "Emitir relatórios e planos de ação",
      "Controlar documentos, evidências e pendências",
      "Orientar equipe operacional",
      "Monitorar conformidade e risco"
    ],

    gerente_do_posto: [
      "Garantir execução diária das rotinas",
      "Acompanhar correção de desvios",
      "Disponibilizar documentos e acesso",
      "Acionar prestadores quando necessário"
    ],

    encarregado_operacional: [
      "Executar checklists",
      "Comunicar incidentes e desvios",
      "Apoiar segregação e organização",
      "Cumprir procedimentos de rotina"
    ],

    empresa_terceirizada_licenciada: [
      "Realizar coleta/destinação regular",
      "Emitir comprovantes formais",
      "Atender requisitos ambientais aplicáveis"
    ]
  },

  entrega_habillis: {
    onboarding: [
      "Levantamento inicial",
      "Diagnóstico operacional do posto",
      "Implantação dos checklists",
      "Criação do painel documental",
      "Definição do plano de visitas"
    ],

    operacao_continua: [
      "Inspeções periódicas",
      "Relatório mensal",
      "Plano de ação corretiva",
      "Gestão documental",
      "Acompanhamento de resíduos e efluentes",
      "Suporte técnico ao responsável do posto"
    ],

    governanca: [
      "Dashboard de conformidade",
      "Histórico de evidências",
      "Matriz de risco ambiental",
      "Indicadores de desempenho",
      "Roteiro de melhoria contínua"
    ]
  }
};