import type { PrismaClient, StatusCompliance, StatusLicenca, StatusAutoInfracao } from '@prisma/client'

interface SeedOperationalScenariosArgs {
  prisma: PrismaClient
  tenantId: string
  adminId: string
  coordenadorId: string
  analistaId: string
  empreendimentos: Array<{
    id: string
    nome: string
    nomeFantasia: string | null
    codigoInterno: string | null
    cidade: string | null
    estado: string | null
  }>
}

function addDays(base: Date, days: number) {
  const date = new Date(base)
  date.setDate(date.getDate() + days)
  return date
}

function addYears(base: Date, years: number) {
  const date = new Date(base)
  date.setFullYear(date.getFullYear() + years)
  return date
}

function atMidday(date: Date) {
  const copy = new Date(date)
  copy.setHours(12, 0, 0, 0)
  return copy
}

function levelFromScore(score: number) {
  if (score >= 75) return 'CRITICO'
  if (score >= 50) return 'ALTO'
  if (score >= 25) return 'MEDIO'
  return 'BAIXO'
}

function licenseStatusFromDays(days: number): StatusLicenca {
  if (days < 0) return 'VENCIDA'
  if (days <= 90) return 'A_RENOVAR'
  return 'VIGENTE'
}

function autoStatusForScenario(status: StatusCompliance, index: number): StatusAutoInfracao {
  if (status === 'EMERGENCIA') return index % 2 === 0 ? 'EM_DEFESA' : 'EM_RECURSO'
  if (status === 'CRITICO') return index % 3 === 0 ? 'RECEBIDO' : 'EM_DEFESA'
  if (status === 'ATENCAO') return 'AGUARDANDO_JULGAMENTO'
  return 'ENCERRADO'
}

function scenarioFromStatus(status: StatusCompliance, index: number) {
  if (status === 'REGULAR') {
    return {
      licencaOffset: 210 + (index % 60),
      alvaraOffset: 180 + (index % 90),
      docSstOffset: 150 + (index % 70),
      calibracaoOffset: 95 + (index % 50),
      testeOffset: 140 + (index % 80),
      outorgaOffset: 240 + (index % 90),
      autoPrazoOffset: 75 + (index % 20),
      monitoramentoResultado: 'CONFORME',
      laudoAguaResultado: 'CONFORME',
      riskBase: 16,
    }
  }

  if (status === 'ATENCAO') {
    return {
      licencaOffset: 12 + (index % 28),
      alvaraOffset: 45 + (index % 40),
      docSstOffset: 28 + (index % 40),
      calibracaoOffset: 18 + (index % 35),
      testeOffset: 24 + (index % 35),
      outorgaOffset: 40 + (index % 45),
      autoPrazoOffset: 18 + (index % 14),
      monitoramentoResultado: index % 2 === 0 ? 'ATENCAO' : 'CONFORME',
      laudoAguaResultado: 'ATENCAO',
      riskBase: 41,
    }
  }

  if (status === 'CRITICO') {
    return {
      licencaOffset: -18 - (index % 35),
      alvaraOffset: 8 + (index % 15),
      docSstOffset: -6 - (index % 18),
      calibracaoOffset: 5 + (index % 10),
      testeOffset: 10 + (index % 14),
      outorgaOffset: 16 + (index % 18),
      autoPrazoOffset: 4 + (index % 6),
      monitoramentoResultado: 'NAO_CONFORME',
      laudoAguaResultado: 'ATENCAO',
      riskBase: 67,
    }
  }

  return {
    licencaOffset: -45 - (index % 45),
    alvaraOffset: -12 - (index % 20),
    docSstOffset: -15 - (index % 18),
    calibracaoOffset: -4 - (index % 10),
    testeOffset: -7 - (index % 14),
    outorgaOffset: -20 - (index % 20),
    autoPrazoOffset: 1 + (index % 3),
    monitoramentoResultado: 'NAO_CONFORME',
    laudoAguaResultado: 'NAO_CONFORME',
    riskBase: 84,
  }
}

export async function seedOperationalScenarios({
  prisma,
  tenantId,
  adminId,
  coordenadorId,
  analistaId,
  empreendimentos,
}: SeedOperationalScenariosArgs) {
  const today = atMidday(new Date())
  const empreendimentoIds = empreendimentos.map((item) => item.id)
  const latestSnapshots = await prisma.complianceSnapshot.findMany({
    where: { tenantId, empreendimentoId: { in: empreendimentoIds } },
    orderBy: [{ empreendimentoId: 'asc' }, { calculadoEm: 'desc' }],
    distinct: ['empreendimentoId'],
    select: {
      empreendimentoId: true,
      statusCompliance: true,
      indiceConformidade: true,
    },
  })

  const snapshotByEmpreendimento = new Map(
    latestSnapshots.map((snapshot) => [snapshot.empreendimentoId, snapshot]),
  )

  const transportadorasBase = [
    {
      nome: 'EcoTrans Residuos Industriais',
      cnpj: '01111000000191',
      licencaAmbiental: 'CETESB-LTR-2026-001',
      validadeLicenca: addDays(today, 240),
      telefone: '1132214455',
      email: 'operacao@ecotransdemo.com.br',
    },
    {
      nome: 'Verde Coleta Ambiental',
      cnpj: '02222000000182',
      licencaAmbiental: 'CETESB-LTR-2026-014',
      validadeLicenca: addDays(today, 120),
      telefone: '1140017788',
      email: 'agenda@verdecoleta.com.br',
    },
    {
      nome: 'Rota Circular Destinacao',
      cnpj: '03333000000173',
      licencaAmbiental: 'CETESB-LTR-2026-021',
      validadeLicenca: addDays(today, 75),
      telefone: '1199554400',
      email: 'comercial@rotacircular.com.br',
    },
  ]

  const transportadoras = []
  for (const item of transportadorasBase) {
    const transportadora = await prisma.transportadora.upsert({
      where: { tenantId_cnpj: { tenantId, cnpj: item.cnpj } },
      update: {
        nome: item.nome,
        licencaAmbiental: item.licencaAmbiental,
        validadeLicenca: item.validadeLicenca,
        telefone: item.telefone,
        email: item.email,
        ativo: true,
      },
      create: {
        tenantId,
        nome: item.nome,
        cnpj: item.cnpj,
        licencaAmbiental: item.licencaAmbiental,
        validadeLicenca: item.validadeLicenca,
        telefone: item.telefone,
        email: item.email,
      },
    })
    transportadoras.push(transportadora)
  }

  const publicacoesBase = Array.from({ length: 10 }, (_, index) => ({
    fonte: index % 2 === 0 ? 'DOU' : 'DOE_SP',
    dataPublicacao: addDays(today, -3 - index * 6),
    secao: index % 2 === 0 ? 'Seção 1' : 'Executivo',
    titulo: `Publicação regulatória demo ${String(index + 1).padStart(2, '0')} para postos de combustíveis`,
    conteudo: 'Carga fictícia para simular monitoramento legislativo com classificação e impacto automático.',
    url: `https://demo.postocompliance.local/legislacao/${index + 1}`,
    keywordsMatch: index % 2 === 0 ? ['postos', 'combustíveis', 'licença'] : ['tanques', 'monitoramento'],
    relevante: true,
    classificacao: index % 3 === 0 ? 'RESOLUCAO' : index % 3 === 1 ? 'PORTARIA' : 'INSTRUCAO_NORMATIVA',
    impacto: index < 3 ? 'ALTO' : index < 7 ? 'MEDIO' : 'BAIXO',
    resumoIA: 'Resumo sintético gerado para ambiente de demonstração com foco em obrigações para postos.',
  }))

  for (const item of publicacoesBase) {
    const existente = await prisma.publicacaoDO.findFirst({
      where: { fonte: item.fonte, dataPublicacao: item.dataPublicacao, url: item.url },
    })

    if (existente) {
      await prisma.publicacaoDO.update({
        where: { id: existente.id },
        data: {
          secao: item.secao,
          titulo: item.titulo,
          conteudo: item.conteudo,
          keywordsMatch: item.keywordsMatch,
          relevante: item.relevante,
          classificacao: item.classificacao,
          impacto: item.impacto,
          resumoIA: item.resumoIA,
        },
      })
    } else {
      await prisma.publicacaoDO.create({ data: item })
    }
  }

  for (const [index, empreendimento] of empreendimentos.entries()) {
    const snapshot = snapshotByEmpreendimento.get(empreendimento.id)
    const statusCompliance = snapshot?.statusCompliance ?? 'ATENCAO'
    const scenario = scenarioFromStatus(statusCompliance, index)
    const codigo = empreendimento.codigoInterno ?? `POST-${String(index + 1).padStart(3, '0')}`
    const nomeCurto = empreendimento.nomeFantasia ?? empreendimento.nome

    const licencaNumero = `LIC-${codigo}-LO`
    const licencaExistente = await prisma.licencaAmbiental.findFirst({
      where: { tenantId, empreendimentoId: empreendimento.id, numero: licencaNumero },
    })

    const licenca = licencaExistente
      ? await prisma.licencaAmbiental.update({
        where: { id: licencaExistente.id },
        data: {
          tipo: 'LO',
          orgaoEmissor: 'CETESB',
          responsavelTecnico: 'Eng. Carla Pires',
          dataEmissao: addYears(today, -2),
          dataVencimento: addDays(today, scenario.licencaOffset),
          status: licenseStatusFromDays(scenario.licencaOffset),
          observacoes: `Licença operacional fictícia para cenários de gestão do ${codigo}.`,
        },
      })
      : await prisma.licencaAmbiental.create({
        data: {
          tenantId,
          empreendimentoId: empreendimento.id,
          tipo: 'LO',
          numero: licencaNumero,
          orgaoEmissor: 'CETESB',
          responsavelTecnico: 'Eng. Carla Pires',
          dataEmissao: addYears(today, -2),
          dataVencimento: addDays(today, scenario.licencaOffset),
          status: licenseStatusFromDays(scenario.licencaOffset),
          observacoes: `Licença operacional fictícia para cenários de gestão do ${codigo}.`,
        },
      })

    const condicoesLicenca = [
      {
        numero: '1',
        descricao: `Apresentar relatório anual de operação e resíduos do ${codigo}.`,
        prazo: addDays(today, Math.max(scenario.licencaOffset - 30, 12)),
        status: statusCompliance === 'REGULAR' ? 'CUMPRIDA' : statusCompliance === 'ATENCAO' ? 'EM_CUMPRIMENTO' : 'PENDENTE',
      },
      {
        numero: '2',
        descricao: `Protocolar comprovação de treinamentos e emergência do ${codigo}.`,
        prazo: addDays(today, statusCompliance === 'REGULAR' ? 120 : statusCompliance === 'ATENCAO' ? 35 : -5),
        status: statusCompliance === 'REGULAR' ? 'EM_CUMPRIMENTO' : statusCompliance === 'ATENCAO' ? 'PENDENTE' : 'VENCIDA',
      },
    ]

    for (const item of condicoesLicenca) {
      const existente = await prisma.condicaoLicenca.findFirst({
        where: { licencaId: licenca.id, numero: item.numero },
      })

      if (existente) {
        await prisma.condicaoLicenca.update({
          where: { id: existente.id },
          data: {
            descricao: item.descricao,
            prazo: item.prazo,
            status: item.status,
          },
        })
      } else {
        await prisma.condicaoLicenca.create({
          data: {
            licencaId: licenca.id,
            numero: item.numero,
            descricao: item.descricao,
            prazo: item.prazo,
            status: item.status,
          },
        })
      }
    }

    const alvaraTipo = index % 4 === 0 ? 'AVCB' : index % 4 === 1 ? 'ALVARA_FUNCIONAMENTO' : index % 4 === 2 ? 'LICENCA_SANITARIA' : 'HABITE_SE'
    const alvaraNumero = `ALV-${codigo}-${String(index + 10).padStart(3, '0')}`
    const alvaraExistente = await prisma.alvaraUrbanistico.findFirst({
      where: { tenantId, empreendimentoId: empreendimento.id, numero: alvaraNumero },
    })
    const alvaraOffset = alvaraTipo === 'AVCB' && statusCompliance !== 'REGULAR'
      ? scenario.alvaraOffset - 10
      : scenario.alvaraOffset

    if (alvaraExistente) {
      await prisma.alvaraUrbanistico.update({
        where: { id: alvaraExistente.id },
        data: {
          tipo: alvaraTipo as never,
          orgaoEmissor: alvaraTipo === 'LICENCA_SANITARIA' ? 'Vigilância Sanitária Municipal' : 'Prefeitura Municipal',
          dataEmissao: addYears(today, -1),
          dataVencimento: addDays(today, alvaraOffset),
          status: licenseStatusFromDays(alvaraOffset),
          observacoes: `Alvará demo configurado para validar vencimentos e painéis do ${codigo}.`,
        },
      })
    } else {
      await prisma.alvaraUrbanistico.create({
        data: {
          tenantId,
          empreendimentoId: empreendimento.id,
          tipo: alvaraTipo as never,
          numero: alvaraNumero,
          orgaoEmissor: alvaraTipo === 'LICENCA_SANITARIA' ? 'Vigilância Sanitária Municipal' : 'Prefeitura Municipal',
          dataEmissao: addYears(today, -1),
          dataVencimento: addDays(today, alvaraOffset),
          status: licenseStatusFromDays(alvaraOffset),
          observacoes: `Alvará demo configurado para validar vencimentos e painéis do ${codigo}.`,
        },
      })
    }

    const funcionarioBase = [
      {
        nome: `Operador ${String(index + 1).padStart(2, '0')} ${nomeCurto.split(' ')[0]}`,
        cpf: `000000${String(index + 1).padStart(5, '0')}`,
        cargo: 'Frentista',
        dataAdmissao: addDays(today, -420 - index * 3),
      },
      {
        nome: `Gestor ${String(index + 1).padStart(2, '0')} ${nomeCurto.split(' ')[0]}`,
        cpf: `111111${String(index + 1).padStart(5, '0')}`,
        cargo: 'Gerente de Pista',
        dataAdmissao: addDays(today, -620 - index * 2),
      },
    ]

    const funcionarios = []
    for (const item of funcionarioBase) {
      const existente = await prisma.funcionario.findFirst({
        where: { tenantId, empreendimentoId: empreendimento.id, cpf: item.cpf },
      })
      const funcionario = existente
        ? await prisma.funcionario.update({
          where: { id: existente.id },
          data: {
            nome: item.nome,
            cargo: item.cargo,
            dataAdmissao: item.dataAdmissao,
            ativo: true,
          },
        })
        : await prisma.funcionario.create({
          data: {
            tenantId,
            empreendimentoId: empreendimento.id,
            nome: item.nome,
            cpf: item.cpf,
            cargo: item.cargo,
            dataAdmissao: item.dataAdmissao,
          },
        })
      funcionarios.push(funcionario)
    }

    for (const [employeeIndex, funcionario] of funcionarios.entries()) {
      const dataExame = addDays(today, -45 - employeeIndex * 18)
      const dataVencimento = addDays(today, scenario.docSstOffset + employeeIndex * 20)
      const existente = await prisma.aSO.findFirst({
        where: {
          tenantId,
          empreendimentoId: empreendimento.id,
          funcionarioId: funcionario.id,
          tipo: employeeIndex === 0 ? 'PERIODICO' : 'ADMISSIONAL',
        },
      })

      if (existente) {
        await prisma.aSO.update({
          where: { id: existente.id },
          data: {
            funcionarioNome: funcionario.nome,
            funcionarioCPF: funcionario.cpf,
            cargo: funcionario.cargo,
            dataExame,
            dataVencimento,
            aptidao: statusCompliance === 'EMERGENCIA' && employeeIndex === 0 ? 'APTO_RESTRICOES' : 'APTO',
            medicoResponsavel: 'Dr. Marcelo Lima',
            observacoes: `ASO demo vinculado ao empreendimento ${codigo}.`,
          },
        })
      } else {
        await prisma.aSO.create({
          data: {
            tenantId,
            empreendimentoId: empreendimento.id,
            funcionarioId: funcionario.id,
            funcionarioNome: funcionario.nome,
            funcionarioCPF: funcionario.cpf,
            cargo: funcionario.cargo,
            tipo: employeeIndex === 0 ? 'PERIODICO' : 'ADMISSIONAL',
            dataExame,
            dataVencimento,
            aptidao: statusCompliance === 'EMERGENCIA' && employeeIndex === 0 ? 'APTO_RESTRICOES' : 'APTO',
            medicoResponsavel: 'Dr. Marcelo Lima',
            observacoes: `ASO demo vinculado ao empreendimento ${codigo}.`,
          },
        })
      }
    }

    const docsSstBase = [
      { tipo: 'PCMSO', responsavel: 'Dra. Helena Duarte', extraOffset: 0 },
      { tipo: 'PGR', responsavel: 'Eng. Rafael Moraes', extraOffset: 35 },
    ]

    for (const item of docsSstBase) {
      const existente = await prisma.documentoSST.findFirst({
        where: { tenantId, empreendimentoId: empreendimento.id, tipo: item.tipo },
      })
      const dataVencimento = addDays(today, scenario.docSstOffset + item.extraOffset)
      const status = dataVencimento < today ? 'VENCIDO' : dataVencimento <= addDays(today, 90) ? 'A_RENOVAR' : 'VIGENTE'

      if (existente) {
        await prisma.documentoSST.update({
          where: { id: existente.id },
          data: {
            responsavel: item.responsavel,
            dataElaboracao: addYears(today, -1),
            dataVencimento,
            status,
            observacoes: `Documento SST demo do ${codigo}.`,
          },
        })
      } else {
        await prisma.documentoSST.create({
          data: {
            tenantId,
            empreendimentoId: empreendimento.id,
            tipo: item.tipo,
            responsavel: item.responsavel,
            dataElaboracao: addYears(today, -1),
            dataVencimento,
            status,
            observacoes: `Documento SST demo do ${codigo}.`,
          },
        })
      }
    }

    for (const pumpNumber of [1, 2]) {
      await prisma.bombaAbastecimento.upsert({
        where: { empreendimentoId_numero: { empreendimentoId: empreendimento.id, numero: pumpNumber } },
        update: {
          tenantId,
          fabricante: pumpNumber === 1 ? 'Wayne' : 'Gilbarco',
          modelo: pumpNumber === 1 ? 'Helix 5000' : 'SK700-II',
          numeroDeSerie: `${codigo}-BOMBA-${pumpNumber}`,
          combustiveis: pumpNumber === 1 ? ['Gasolina Comum', 'Etanol'] : ['Diesel S10', 'Gasolina Aditivada'],
          ultimaCalibracao: addDays(today, -120 + pumpNumber * 10),
          proximaCalibracao: addDays(today, scenario.calibracaoOffset + pumpNumber * 4),
          stickerInmetro: `INM-${codigo}-${pumpNumber}`,
          status: statusCompliance === 'EMERGENCIA' && pumpNumber === 2 ? 'MANUTENCAO' : 'ATIVO',
          observacoes: `Bomba demo para testes do módulo ANP/INMETRO (${codigo}).`,
        },
        create: {
          tenantId,
          empreendimentoId: empreendimento.id,
          numero: pumpNumber,
          fabricante: pumpNumber === 1 ? 'Wayne' : 'Gilbarco',
          modelo: pumpNumber === 1 ? 'Helix 5000' : 'SK700-II',
          numeroDeSerie: `${codigo}-BOMBA-${pumpNumber}`,
          combustiveis: pumpNumber === 1 ? ['Gasolina Comum', 'Etanol'] : ['Diesel S10', 'Gasolina Aditivada'],
          ultimaCalibracao: addDays(today, -120 + pumpNumber * 10),
          proximaCalibracao: addDays(today, scenario.calibracaoOffset + pumpNumber * 4),
          stickerInmetro: `INM-${codigo}-${pumpNumber}`,
          status: statusCompliance === 'EMERGENCIA' && pumpNumber === 2 ? 'MANUTENCAO' : 'ATIVO',
          observacoes: `Bomba demo para testes do módulo ANP/INMETRO (${codigo}).`,
        },
      })
    }

    for (const tankNumber of [1, 2]) {
      const tanque = await prisma.tanque.upsert({
        where: { empreendimentoId_numero: { empreendimentoId: empreendimento.id, numero: tankNumber } },
        update: {
          tenantId,
          capacidadeLitros: tankNumber === 1 ? 15000 : 30000,
          combustivel: tankNumber === 1 ? 'Gasolina' : 'Diesel',
          material: tankNumber === 1 ? 'DUPLA_PAREDE' : 'ACO',
          dataInstalacao: addYears(today, -6),
          status: statusCompliance === 'EMERGENCIA' && tankNumber === 2 ? 'INTERDITADO' : 'ATIVO',
          observacoes: `Tanque demo do ${codigo}.`,
        },
        create: {
          tenantId,
          empreendimentoId: empreendimento.id,
          numero: tankNumber,
          capacidadeLitros: tankNumber === 1 ? 15000 : 30000,
          combustivel: tankNumber === 1 ? 'Gasolina' : 'Diesel',
          material: tankNumber === 1 ? 'DUPLA_PAREDE' : 'ACO',
          dataInstalacao: addYears(today, -6),
          status: statusCompliance === 'EMERGENCIA' && tankNumber === 2 ? 'INTERDITADO' : 'ATIVO',
          observacoes: `Tanque demo do ${codigo}.`,
        },
      })

      const testeData = addDays(today, -180 + tankNumber * 12)
      const testeExistente = await prisma.testeEstanqueidade.findFirst({
        where: { tanqueId: tanque.id, dataExecucao: testeData },
      })

      if (testeExistente) {
        await prisma.testeEstanqueidade.update({
          where: { id: testeExistente.id },
          data: {
            empresa: 'Leak Test Brasil',
            responsavel: 'Luciana Rocha',
            resultado: statusCompliance === 'EMERGENCIA' && tankNumber === 2 ? 'REPROVADO' : statusCompliance === 'CRITICO' && tankNumber === 2 ? 'INCONCLUSIVO' : 'APROVADO',
            metodo: 'Pressao monitorada',
            proximoTeste: addDays(today, scenario.testeOffset + tankNumber * 5),
            observacoes: `Teste demo do tanque ${tankNumber} no ${codigo}.`,
          },
        })
      } else {
        await prisma.testeEstanqueidade.create({
          data: {
            tanqueId: tanque.id,
            empresa: 'Leak Test Brasil',
            responsavel: 'Luciana Rocha',
            dataExecucao: testeData,
            resultado: statusCompliance === 'EMERGENCIA' && tankNumber === 2 ? 'REPROVADO' : statusCompliance === 'CRITICO' && tankNumber === 2 ? 'INCONCLUSIVO' : 'APROVADO',
            metodo: 'Pressao monitorada',
            proximoTeste: addDays(today, scenario.testeOffset + tankNumber * 5),
            observacoes: `Teste demo do tanque ${tankNumber} no ${codigo}.`,
          },
        })
      }
    }

    if (index % 2 === 0) {
      const transportadora = transportadoras[index % transportadoras.length]!
      const numeroMTR = `MTR-${codigo}-${String(index + 1).padStart(3, '0')}`
      const mtrExistente = await prisma.mTR.findFirst({
        where: { tenantId, empreendimentoId: empreendimento.id, numeroMTR },
      })

      if (mtrExistente) {
        await prisma.mTR.update({
          where: { id: mtrExistente.id },
          data: {
            transportadoraId: transportadora.id,
            dataEmissao: addDays(today, -18 - index),
            dataColeta: addDays(today, -15 - index),
            residuos: [
              { tipo: 'Lodo oleoso', quantidade: 220 + index * 3, unidade: 'kg', destinacao: 'coprocessamento' },
              { tipo: 'Embalagens contaminadas', quantidade: 40 + index, unidade: 'kg', destinacao: 'reciclagem classe I' },
            ],
            status: statusCompliance === 'REGULAR' ? 'ENCERRADO' : statusCompliance === 'ATENCAO' ? 'DESTINADO' : 'COLETADO',
            observacoes: `MTR demo emitido para o ${codigo}.`,
          },
        })
      } else {
        await prisma.mTR.create({
          data: {
            tenantId,
            empreendimentoId: empreendimento.id,
            transportadoraId: transportadora.id,
            numeroMTR,
            dataEmissao: addDays(today, -18 - index),
            dataColeta: addDays(today, -15 - index),
            residuos: [
              { tipo: 'Lodo oleoso', quantidade: 220 + index * 3, unidade: 'kg', destinacao: 'coprocessamento' },
              { tipo: 'Embalagens contaminadas', quantidade: 40 + index, unidade: 'kg', destinacao: 'reciclagem classe I' },
            ],
            status: statusCompliance === 'REGULAR' ? 'ENCERRADO' : statusCompliance === 'ATENCAO' ? 'DESTINADO' : 'COLETADO',
            observacoes: `MTR demo emitido para o ${codigo}.`,
          },
        })
      }
    }

    if (index % 3 !== 1) {
      const pocoCodigo = `PA-${String(index + 1).padStart(3, '0')}`
      const pocoExistente = await prisma.pocoArtesiano.findFirst({
        where: { tenantId, empreendimentoId: empreendimento.id, codigo: pocoCodigo },
      })

      const poco = pocoExistente
        ? await prisma.pocoArtesiano.update({
          where: { id: pocoExistente.id },
          data: {
            profundidade: 85 + index,
            coordenadas: empreendimento.cidade ? `${empreendimento.cidade}/${empreendimento.estado}` : null,
            outorgaDAEE: `DAEE-${codigo}`,
            validadeOutorga: addDays(today, scenario.outorgaOffset),
            vazaoAutorizada: 18 + index * 0.2,
            dataPerforacao: addYears(today, -8),
            status: statusCompliance === 'EMERGENCIA' ? 'INTERDITADO' : 'ATIVO',
            observacoes: `Poço artesiano demo do ${codigo}.`,
          },
        })
        : await prisma.pocoArtesiano.create({
          data: {
            tenantId,
            empreendimentoId: empreendimento.id,
            codigo: pocoCodigo,
            profundidade: 85 + index,
            coordenadas: empreendimento.cidade ? `${empreendimento.cidade}/${empreendimento.estado}` : null,
            outorgaDAEE: `DAEE-${codigo}`,
            validadeOutorga: addDays(today, scenario.outorgaOffset),
            vazaoAutorizada: 18 + index * 0.2,
            dataPerforacao: addYears(today, -8),
            status: statusCompliance === 'EMERGENCIA' ? 'INTERDITADO' : 'ATIVO',
            observacoes: `Poço artesiano demo do ${codigo}.`,
          },
        })

      const laudoData = addDays(today, -20 - index)
      const laudoExistente = await prisma.laudoAgua.findFirst({
        where: { pocoId: poco.id, dataCampanha: laudoData },
      })
      const parametrosAgua = [
        { nome: 'Coliformes totais', valorMedido: statusCompliance === 'EMERGENCIA' ? 15 : statusCompliance === 'CRITICO' ? 7 : 0.3, limite: 1, unidade: 'NMP/100mL', conforme: statusCompliance === 'REGULAR' },
        { nome: 'Nitrato', valorMedido: statusCompliance === 'REGULAR' ? 3.2 : statusCompliance === 'ATENCAO' ? 7.8 : 12.4, limite: 10, unidade: 'mg/L', conforme: !['CRITICO', 'EMERGENCIA'].includes(statusCompliance) },
      ]

      if (laudoExistente) {
        await prisma.laudoAgua.update({
          where: { id: laudoExistente.id },
          data: {
            laboratorio: 'Laboratorio Aqualab',
            resultado: scenario.laudoAguaResultado,
            parametros: parametrosAgua.map((item) => ({
              nome: item.nome,
              valorMedido: item.valorMedido,
              limiteVMP: item.limite,
              unidade: item.unidade,
              conforme: item.conforme,
            })),
            observacoes: `Laudo demo do poço ${pocoCodigo}.`,
          },
        })
      } else {
        await prisma.laudoAgua.create({
          data: {
            pocoId: poco.id,
            dataCampanha: laudoData,
            laboratorio: 'Laboratorio Aqualab',
            resultado: scenario.laudoAguaResultado,
            parametros: parametrosAgua.map((item) => ({
              nome: item.nome,
              valorMedido: item.valorMedido,
              limiteVMP: item.limite,
              unidade: item.unidade,
              conforme: item.conforme,
            })),
            observacoes: `Laudo demo do poço ${pocoCodigo}.`,
          },
        })
      }
    }

    if (index % 2 === 0 || statusCompliance !== 'REGULAR') {
      const pocoMonCodigo = `PM-${String(index + 1).padStart(3, '0')}`
      const pocoMonExistente = await prisma.pocoMonitoramento.findFirst({
        where: { tenantId, empreendimentoId: empreendimento.id, codigo: pocoMonCodigo },
      })

      const pocoMonitoramento = pocoMonExistente
        ? await prisma.pocoMonitoramento.update({
          where: { id: pocoMonExistente.id },
          data: {
            profundidade: 10 + index * 0.4,
            coordenadas: `PM-${index + 1},${index + 2}`,
            dataInstalacao: addYears(today, -5),
            status: statusCompliance === 'EMERGENCIA' ? 'DANIFICADO' : 'ATIVO',
          },
        })
        : await prisma.pocoMonitoramento.create({
          data: {
            tenantId,
            empreendimentoId: empreendimento.id,
            codigo: pocoMonCodigo,
            profundidade: 10 + index * 0.4,
            coordenadas: `PM-${index + 1},${index + 2}`,
            dataInstalacao: addYears(today, -5),
            status: statusCompliance === 'EMERGENCIA' ? 'DANIFICADO' : 'ATIVO',
          },
        })

      const campanhaData = addDays(today, -12 - index)
      const campanhaExistente = await prisma.campanhaMonitoramento.findFirst({
        where: {
          tenantId,
          empreendimentoId: empreendimento.id,
          pocoMonitoramentoId: pocoMonitoramento.id,
          dataColeta: campanhaData,
        },
      })
      const parametrosCampanha = [
        { nome: 'BTEX', valorMedido: statusCompliance === 'REGULAR' ? 0.002 : statusCompliance === 'ATENCAO' ? 0.045 : 0.21, limiteVMP: 0.05, unidade: 'mg/L', emAlerta: !['REGULAR'].includes(statusCompliance) },
        { nome: 'TPH', valorMedido: statusCompliance === 'REGULAR' ? 0.03 : statusCompliance === 'ATENCAO' ? 0.08 : 0.27, limiteVMP: 0.1, unidade: 'mg/L', emAlerta: ['CRITICO', 'EMERGENCIA'].includes(statusCompliance) },
      ]

      const campanha = campanhaExistente
        ? await prisma.campanhaMonitoramento.update({
          where: { id: campanhaExistente.id },
          data: {
            tipo: 'AGUA_SUBTERRANEA',
            laboratorio: 'GeoCheck Ambiental',
            resultado: scenario.monitoramentoResultado,
            observacoes: `Campanha demo de monitoramento do ${codigo}.`,
            parametros: {
              deleteMany: {},
              create: parametrosCampanha,
            },
          },
          include: { parametros: true },
        })
        : await prisma.campanhaMonitoramento.create({
          data: {
            tenantId,
            empreendimentoId: empreendimento.id,
            pocoMonitoramentoId: pocoMonitoramento.id,
            tipo: 'AGUA_SUBTERRANEA',
            dataColeta: campanhaData,
            laboratorio: 'GeoCheck Ambiental',
            resultado: scenario.monitoramentoResultado,
            observacoes: `Campanha demo de monitoramento do ${codigo}.`,
            parametros: { create: parametrosCampanha },
          },
          include: { parametros: true },
        })

      void campanha
    }

    if (statusCompliance !== 'REGULAR' || index % 6 === 0) {
      const numeroAuto = `AUTO-${codigo}-${String(index + 1).padStart(3, '0')}`
      const autoExistente = await prisma.autoInfracao.findFirst({
        where: { tenantId, numeroAuto },
      })

      const auto = autoExistente
        ? await prisma.autoInfracao.update({
          where: { id: autoExistente.id },
          data: {
            empreendimentoId: empreendimento.id,
            orgao: statusCompliance === 'ATENCAO' ? 'ANP' : statusCompliance === 'REGULAR' ? 'PREFEITURA' : 'CETESB',
            dataLavratura: addDays(today, -8 - index),
            dataRecebimento: addDays(today, -6 - index),
            artigo: statusCompliance === 'REGULAR' ? 'Código de Posturas' : 'Resolução aplicável ao armazenamento',
            descricao: `Auto fictício para simular gestão de defesa e recursos no empreendimento ${codigo}.`,
            valorMulta: statusCompliance === 'REGULAR' ? 1500 : statusCompliance === 'ATENCAO' ? 4200 : 12800,
            prazoDefesa: addDays(today, scenario.autoPrazoOffset),
            status: autoStatusForScenario(statusCompliance, index),
            observacoes: `Controle demo do auto ${numeroAuto}.`,
          },
        })
        : await prisma.autoInfracao.create({
          data: {
            tenantId,
            empreendimentoId: empreendimento.id,
            orgao: statusCompliance === 'ATENCAO' ? 'ANP' : statusCompliance === 'REGULAR' ? 'PREFEITURA' : 'CETESB',
            numeroAuto,
            dataLavratura: addDays(today, -8 - index),
            dataRecebimento: addDays(today, -6 - index),
            artigo: statusCompliance === 'REGULAR' ? 'Código de Posturas' : 'Resolução aplicável ao armazenamento',
            descricao: `Auto fictício para simular gestão de defesa e recursos no empreendimento ${codigo}.`,
            valorMulta: statusCompliance === 'REGULAR' ? 1500 : statusCompliance === 'ATENCAO' ? 4200 : 12800,
            prazoDefesa: addDays(today, scenario.autoPrazoOffset),
            status: autoStatusForScenario(statusCompliance, index),
            observacoes: `Controle demo do auto ${numeroAuto}.`,
          },
        })

      if (['EM_RECURSO', 'AGUARDANDO_JULGAMENTO'].includes(auto.status)) {
        const recursoExistente = await prisma.recursoAdministrativo.findFirst({
          where: { autoId: auto.id, instancia: 'PRIMEIRA' },
        })
        if (recursoExistente) {
          await prisma.recursoAdministrativo.update({
            where: { id: recursoExistente.id },
            data: {
              dataProtocolo: addDays(today, -2),
              prazoResposta: addDays(today, 25),
              numeroProtocolo: `REC-${codigo}-01`,
              resultado: auto.status === 'AGUARDANDO_JULGAMENTO' ? 'PENDENTE' : 'PARCIALMENTE_FAVORAVEL',
              observacoes: `Recurso administrativo demo do auto ${numeroAuto}.`,
            },
          })
        } else {
          await prisma.recursoAdministrativo.create({
            data: {
              autoId: auto.id,
              instancia: 'PRIMEIRA',
              dataProtocolo: addDays(today, -2),
              prazoResposta: addDays(today, 25),
              numeroProtocolo: `REC-${codigo}-01`,
              resultado: auto.status === 'AGUARDANDO_JULGAMENTO' ? 'PENDENTE' : 'PARCIALMENTE_FAVORAVEL',
              observacoes: `Recurso administrativo demo do auto ${numeroAuto}.`,
            },
          })
        }
      }

      if (statusCompliance === 'CRITICO' || statusCompliance === 'EMERGENCIA') {
        const defesaExistente = await prisma.defesaTecnica.findFirst({ where: { autoId: auto.id } })
        if (defesaExistente) {
          await prisma.defesaTecnica.update({
            where: { id: defesaExistente.id },
            data: {
              rascunhoIA: `Rascunho técnico demo para o auto ${numeroAuto}, destacando controles e providências já implantados.`,
              revisaoHumana: 'Documento revisado parcialmente pelo coordenador para ambiente de demonstração.',
              status: statusCompliance === 'EMERGENCIA' ? 'REVISADO' : 'RASCUNHO',
            },
          })
        } else {
          await prisma.defesaTecnica.create({
            data: {
              autoId: auto.id,
              rascunhoIA: `Rascunho técnico demo para o auto ${numeroAuto}, destacando controles e providências já implantados.`,
              revisaoHumana: 'Documento revisado parcialmente pelo coordenador para ambiente de demonstração.',
              status: statusCompliance === 'EMERGENCIA' ? 'REVISADO' : 'RASCUNHO',
            },
          })
        }
      }
    }

    const scoreFactors = {
      CETESB: [
        { descricao: 'Status da licença ambiental', pontos: statusCompliance === 'REGULAR' ? 6 : statusCompliance === 'ATENCAO' ? 18 : 34 },
        { descricao: 'Campanhas de monitoramento recentes', pontos: scenario.monitoramentoResultado === 'CONFORME' ? 0 : scenario.monitoramentoResultado === 'ATENCAO' ? 12 : 24 },
      ],
      ANP: [
        { descricao: 'Calibração de bombas', pontos: scenario.calibracaoOffset > 60 ? 4 : scenario.calibracaoOffset > 0 ? 18 : 28 },
        { descricao: 'Histórico regulatório ANP', pontos: statusCompliance === 'REGULAR' ? 3 : statusCompliance === 'ATENCAO' ? 12 : 20 },
      ],
      INMETRO: [
        { descricao: 'Selo e sticker de verificação', pontos: scenario.calibracaoOffset > 30 ? 5 : scenario.calibracaoOffset > 0 ? 14 : 22 },
        { descricao: 'Condições de equipamentos', pontos: statusCompliance === 'EMERGENCIA' ? 24 : statusCompliance === 'CRITICO' ? 18 : 6 },
      ],
      BOMBEIROS: [
        { descricao: 'AVCB e alvarás urbanos', pontos: alvaraOffset > 120 ? 4 : alvaraOffset > 0 ? 14 : 30 },
        { descricao: 'Treinamentos e prontidão', pontos: statusCompliance === 'REGULAR' ? 5 : statusCompliance === 'ATENCAO' ? 10 : 19 },
      ],
    }

    for (const orgao of ['CETESB', 'ANP', 'INMETRO', 'BOMBEIROS'] as const) {
      const fatores = scoreFactors[orgao]
      const score = Math.min(
        99,
        scenario.riskBase + fatores.reduce((total, fator) => total + fator.pontos, 0),
      )
      await prisma.scoreRisco.upsert({
        where: { empreendimentoId_orgao: { empreendimentoId: empreendimento.id, orgao } },
        update: {
          tenantId,
          score,
          nivel: levelFromScore(score),
          fatores,
          recomendacoes: [
            `Revisar plano de ação prioritário do órgão ${orgao}.`,
            `Atualizar evidências e cronograma do ${codigo}.`,
            `Executar checagem operacional antes da próxima janela de fiscalização.`,
          ],
          calculadoEm: today,
        },
        create: {
          tenantId,
          empreendimentoId: empreendimento.id,
          orgao,
          score,
          nivel: levelFromScore(score),
          fatores,
          recomendacoes: [
            `Revisar plano de ação prioritário do órgão ${orgao}.`,
            `Atualizar evidências e cronograma do ${codigo}.`,
            `Executar checagem operacional antes da próxima janela de fiscalização.`,
          ],
          calculadoEm: today,
        },
      })
    }

    const alertasBase = []
    if (scenario.licencaOffset <= 45) {
      alertasBase.push({
        tipo: scenario.licencaOffset < 0 ? 'COMPLIANCE_CRITICO' : 'VENCIMENTO_DOCUMENTO',
        nivel: scenario.licencaOffset < 0 ? 'CRITICO' : scenario.licencaOffset <= 15 ? 'ALTO' : 'MEDIO',
        titulo: `Licença ambiental ${scenario.licencaOffset < 0 ? 'vencida' : 'próxima do vencimento'} — ${codigo}`,
        mensagem: scenario.licencaOffset < 0
          ? `A licença ambiental do ${nomeCurto} está vencida e exige regularização imediata.`
          : `A licença ambiental do ${nomeCurto} vence em ${scenario.licencaOffset} dias.`,
        entidadeTipo: 'LicencaAmbiental',
        entidadeId: licenca.id,
      })
    }

    if (scenario.autoPrazoOffset <= 7 && (statusCompliance === 'CRITICO' || statusCompliance === 'EMERGENCIA' || index % 6 === 0)) {
      const auto = await prisma.autoInfracao.findFirst({
        where: { tenantId, empreendimentoId: empreendimento.id },
        orderBy: { criadoEm: 'desc' },
      })

      if (auto) {
        alertasBase.push({
          tipo: 'COMPLIANCE_CRITICO',
          nivel: scenario.autoPrazoOffset <= 3 ? 'CRITICO' : 'ALTO',
          titulo: `Prazo de defesa próximo — ${codigo}`,
          mensagem: `O auto ${auto.numeroAuto} do ${nomeCurto} tem prazo de defesa em ${scenario.autoPrazoOffset} dia(s).`,
          entidadeTipo: 'AutoInfracao',
          entidadeId: auto.id,
        })
      }
    }

    if (scenario.monitoramentoResultado === 'NAO_CONFORME') {
      const campanha = await prisma.campanhaMonitoramento.findFirst({
        where: { tenantId, empreendimentoId: empreendimento.id },
        orderBy: { dataColeta: 'desc' },
      })

      if (campanha) {
        alertasBase.push({
          tipo: 'COMPLIANCE_CRITICO',
          nivel: 'CRITICO',
          titulo: `Campanha não conforme — ${codigo}`,
          mensagem: `A última campanha de monitoramento do ${nomeCurto} retornou resultado não conforme.`,
          entidadeTipo: 'CampanhaMonitoramento',
          entidadeId: campanha.id,
        })
      }
    }

    for (const alertaData of alertasBase) {
      const existente = await prisma.alerta.findFirst({
        where: { tenantId, titulo: alertaData.titulo, entidadeId: alertaData.entidadeId ?? null },
      })
      const alerta = existente
        ? await prisma.alerta.update({
          where: { id: existente.id },
          data: {
            empreendimentoId: empreendimento.id,
            tipo: alertaData.tipo as never,
            nivel: alertaData.nivel as never,
            mensagem: alertaData.mensagem,
            entidadeTipo: alertaData.entidadeTipo,
            entidadeId: alertaData.entidadeId,
            dados: { origem: 'seed-operational-scenarios', codigo },
          },
        })
        : await prisma.alerta.create({
          data: {
            tenantId,
            empreendimentoId: empreendimento.id,
            tipo: alertaData.tipo as never,
            nivel: alertaData.nivel as never,
            titulo: alertaData.titulo,
            mensagem: alertaData.mensagem,
            entidadeTipo: alertaData.entidadeTipo,
            entidadeId: alertaData.entidadeId,
            dados: { origem: 'seed-operational-scenarios', codigo },
          },
        })

      for (const usuarioId of [adminId, coordenadorId, analistaId]) {
        await prisma.alertaDestinatario.upsert({
          where: { alertaId_usuarioId: { alertaId: alerta.id, usuarioId } },
          update: { canais: ['EMAIL', 'WHATSAPP'], lido: false, lidoEm: null },
          create: { alertaId: alerta.id, usuarioId, canais: ['EMAIL', 'WHATSAPP'] },
        })
      }
    }

    if (index < 15) {
      const numero = `55119990${String(index + 1).padStart(4, '0')}`
      await prisma.contatoWhatsApp.upsert({
        where: { tenantId_numero: { tenantId, numero } },
        update: {
          nome: `Responsável ${codigo}`,
          empreendimentoId: empreendimento.id,
          ativo: true,
        },
        create: {
          tenantId,
          numero,
          nome: `Responsável ${codigo}`,
          empreendimentoId: empreendimento.id,
        },
      })

      const mensagensBase = [
        {
          direcao: 'ENVIADA',
          tipo: 'TEXTO',
          conteudo: `Alerta automático: o posto ${codigo} possui pendências acompanhadas pelo painel de compliance.`,
        },
        {
          direcao: 'RECEBIDA',
          tipo: 'TEXTO',
          conteudo: `Qual o status operacional do ${codigo}?`,
        },
      ]

      for (const mensagem of mensagensBase) {
        const existente = await prisma.mensagemWhatsApp.findFirst({
          where: { tenantId, numero, direcao: mensagem.direcao, conteudo: mensagem.conteudo },
        })

        if (!existente) {
          await prisma.mensagemWhatsApp.create({
            data: {
              tenantId,
              numero,
              direcao: mensagem.direcao,
              tipo: mensagem.tipo,
              conteudo: mensagem.conteudo,
            },
          })
        }
      }
    }
  }
}
