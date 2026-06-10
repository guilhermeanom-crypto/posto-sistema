import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import { seedOperationalScenarios } from './seed/operational-scenarios.js'
import { seedObrigacoesRegulatorias } from './seed/obrigacoes-regulatorias.js'
import { seedServicosConsultoriaEPrecificacao } from './seed/servicos-consultoria.js'
import { seedBaseInterface } from './seed/servicos-consultoria-base-interface.js'
import { seedChecklists } from './seed/checklists.js'
import { seedPgrsERegras } from './seed/pgrs-regras.js'

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE SEED
// Cria dados iniciais para desenvolvimento e demonstração.
//
// Senha padrão: Demo@1234 (ou a variável de ambiente SEED_ADMIN_PASSWORD)
// Para trocar depois: pnpm --filter api reset-password
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

// Senha padrão configurável via env
const SENHA_PADRAO = process.env.SEED_ADMIN_PASSWORD ?? 'Demo@1234'

async function main() {
  // Guarda de produção: o seed cria usuários demo com senha conhecida (Demo@1234).
  // Bloqueia execução acidental contra o banco de produção.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    console.error(
      '⛔ Seed demo bloqueado em produção (NODE_ENV=production). ' +
        'Para forçar conscientemente, defina ALLOW_PROD_SEED=true.',
    )
    process.exit(1)
  }

  console.log('🌱 Iniciando seed...')

  // ── Tenant ─────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      nome: 'Rede Posto Demo',
      slug: 'demo',
      plano: 'ENTERPRISE',
      ativo: true,
      limiteEmpreendimentos: 100,
    },
  })
  console.log(`✅ Tenant: ${tenant.nome} (${tenant.id})`)

  // ── Empresa ────────────────────────────────────────────────────────────────
  const empresa = await prisma.empresa.upsert({
    where: { tenantId_cnpj: { tenantId: tenant.id, cnpj: '12345678000100' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Rede Posto Demo LTDA',
      razaoSocial: 'Rede Posto Demo LTDA',
      cnpj: '12345678000100',
      ativo: true,
    },
  })
  console.log(`✅ Empresa: ${empresa.razaoSocial}`)

  // ── Usuários ───────────────────────────────────────────────────────────────
  const senhaHash = await argon2.hash(SENHA_PADRAO, { type: argon2.argon2id })

  const admin = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@postodemo.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Admin Demo',
      email: 'admin@postodemo.com.br',
      senhaHash,
      perfil: 'ADMIN_TENANT',
      ativo: true,
    },
  })

  const coordenador = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'coord@postodemo.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Coordenador Demo',
      email: 'coord@postodemo.com.br',
      senhaHash,
      perfil: 'COORDENADOR',
      ativo: true,
    },
  })

  const analista = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'analista@postodemo.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Analista Demo',
      email: 'analista@postodemo.com.br',
      senhaHash,
      perfil: 'ANALISTA',
      ativo: true,
    },
  })

  console.log(`✅ Usuários: ${admin.email}, ${coordenador.email}, ${analista.email}`)

  // ── Órgãos reguladores ─────────────────────────────────────────────────────
  // OrgaoRegulador tem unique composto (tenantId, sigla, estadoUf, municipio).
  // Usando findFirst + create para evitar problemas com campos nullable no upsert.
  async function upsertOrgao(data: {
    tenantId: string
    nome: string
    sigla: string
    esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL'
    tipo: 'AMBIENTAL' | 'SEGURANCA' | 'COMERCIAL' | 'SANITARIO' | 'METROLOGIA' | 'TRANSPORTE' | 'TRIBUTARIO' | 'OUTROS'
    estadoUf?: string
    municipio?: string
    site?: string
  }) {
    const existente = await prisma.orgaoRegulador.findFirst({
      where: { tenantId: data.tenantId, sigla: data.sigla, estadoUf: data.estadoUf ?? null, municipio: data.municipio ?? null },
    })
    if (existente) return existente
    return prisma.orgaoRegulador.create({ data })
  }

  const anp = await upsertOrgao({
    tenantId: tenant.id,
    nome: 'Agência Nacional do Petróleo, Gás Natural e Biocombustíveis',
    sigla: 'ANP',
    esfera: 'FEDERAL',
    tipo: 'COMERCIAL',
    site: 'https://www.gov.br/anp',
  })

  const cetesb = await upsertOrgao({
    tenantId: tenant.id,
    nome: 'Companhia Ambiental do Estado de São Paulo',
    sigla: 'CETESB',
    esfera: 'ESTADUAL',
    tipo: 'AMBIENTAL',
    estadoUf: 'SP',
  })

  const bombeiros = await upsertOrgao({
    tenantId: tenant.id,
    nome: 'Corpo de Bombeiros Militar do Estado de São Paulo',
    sigla: 'CBMSP',
    esfera: 'ESTADUAL',
    tipo: 'SEGURANCA',
    estadoUf: 'SP',
  })

  console.log(`✅ Órgãos: ${anp.sigla}, ${cetesb.sigla}, ${bombeiros.sigla}`)

  // ── Tipos de documento ─────────────────────────────────────────────────────
  // TipoDocumento: unique (tenantId, nome) — sem campo 'codigo'
  async function upsertTipoDocumento(data: {
    tenantId: string
    nome: string
    descricao?: string
    categoria: 'LICENCA' | 'ALVARA' | 'CERTIFICADO' | 'LAUDO' | 'RELATORIO' | 'ART_RRT' | 'CONTRATO' | 'DOCUMENTO_SOCIETARIO' | 'COMPROVANTE' | 'DECLARACAO' | 'OUTROS'
    temValidade?: boolean
    validadeMediaMeses?: number
  }) {
    const existente = await prisma.tipoDocumento.findFirst({ where: { tenantId: data.tenantId, nome: data.nome } })
    if (existente) return existente
    return prisma.tipoDocumento.create({ data })
  }

  const tdHabitese = await upsertTipoDocumento({
    tenantId: tenant.id,
    nome: 'Auto de Conclusão (Habite-se)',
    categoria: 'ALVARA',
    descricao: 'Documento de conclusão de obra emitido pela prefeitura',
    temValidade: false,
  })

  const tdLoCetesb = await upsertTipoDocumento({
    tenantId: tenant.id,
    nome: 'Licença de Operação CETESB',
    categoria: 'LICENCA',
    descricao: 'Licença ambiental de operação emitida pela CETESB',
    temValidade: true,
    validadeMediaMeses: 48,
  })

  const tdAvcb = await upsertTipoDocumento({
    tenantId: tenant.id,
    nome: 'Auto de Vistoria do Corpo de Bombeiros (AVCB)',
    categoria: 'CERTIFICADO',
    descricao: 'Certificado de regularidade perante o Corpo de Bombeiros',
    temValidade: true,
    validadeMediaMeses: 36,
  })

  const tdRegAnp = await upsertTipoDocumento({
    tenantId: tenant.id,
    nome: 'Registro ANP',
    categoria: 'OUTROS',
    descricao: 'Certificado de registro como revendedor varejista de combustíveis',
    temValidade: false,
  })

  const tdPgrss = await upsertTipoDocumento({
    tenantId: tenant.id,
    nome: 'PGRSS — Plano de Gerenciamento de Resíduos Sólidos',
    categoria: 'RELATORIO',
    descricao: 'Plano de gerenciamento de resíduos exigido pela CETESB',
    temValidade: true,
    validadeMediaMeses: 12,
  })

  console.log(`✅ Tipos de documento: 5`)

  // ── Tipo de processo: Licença de Operação CETESB ───────────────────────────
  // TipoProcesso: sem campo 'codigo', sem unique por código — findFirst + create
  let tipoLoCetesb = await prisma.tipoProcesso.findFirst({
    where: { tenantId: tenant.id, nome: 'Licença de Operação CETESB — Novo Processo' },
  })
  if (!tipoLoCetesb) {
    tipoLoCetesb = await prisma.tipoProcesso.create({
      data: {
        tenantId: tenant.id,
        orgaoId: cetesb.id,
        nome: 'Licença de Operação CETESB — Novo Processo',
        categoria: 'LICENCA',
        descricao: 'Processo para obtenção da primeira Licença de Operação junto à CETESB',
        diasAntecedenciaRenovacao: 120,
        ativo: true,
      },
    })
  }

  const fasesData = [
    { nome: 'Preparação Documental', ordem: 1, descricao: 'Levantamento e organização dos documentos necessários' },
    { nome: 'Protocolo', ordem: 2, descricao: 'Protocolo do processo junto à CETESB' },
    { nome: 'Análise Técnica', ordem: 3, descricao: 'Análise técnica realizada pela CETESB' },
    { nome: 'Vistoria', ordem: 4, descricao: 'Vistoria in loco do empreendimento' },
    { nome: 'Emissão', ordem: 5, descricao: 'Emissão da Licença de Operação' },
  ]

  const fases = []
  for (const fase of fasesData) {
    const f = await prisma.faseTipoProcesso.upsert({
      where: { tipoProcessoId_ordem: { tipoProcessoId: tipoLoCetesb.id, ordem: fase.ordem } },
      update: {},
      create: { tipoProcessoId: tipoLoCetesb.id, ...fase },
    })
    fases.push(f)
  }
  console.log(`✅ Tipo de processo: ${tipoLoCetesb.nome} (${fases.length} fases)`)

  // RequisitoTipoProcesso: sem unique constraint — findFirst + create
  if (fases[0]) {
    const reqExistente = await prisma.requisitoTipoProcesso.findFirst({
      where: { tipoProcessoId: tipoLoCetesb.id, tipoDocumentoId: tdPgrss.id },
    })
    if (!reqExistente) {
      await prisma.requisitoTipoProcesso.create({
        data: {
          tipoProcessoId: tipoLoCetesb.id,
          tipoDocumentoId: tdPgrss.id,
          faseTipoProcessoId: fases[0].id,
          ordem: 1,
          obrigatorio: true,
          descricaoEspecifica: 'PGRSS atualizado e assinado pelo responsável técnico',
        },
      })
    }
  }

  // ── Empreendimentos de exemplo ─────────────────────────────────────────────
  // Empreendimento: sem unique (tenantId, codigoInterno) — findFirst + create
  async function upsertEmpreendimento(data: Parameters<typeof prisma.empreendimento.create>[0]['data']) {
    const existente = await prisma.empreendimento.findFirst({
      where: { tenantId: data.tenantId as string, codigoInterno: data.codigoInterno as string },
    })
    if (existente) return existente
    return prisma.empreendimento.create({ data })
  }

  const cidadesSeed = [
    { cidade: 'São Paulo', bairro: 'Bela Vista', estado: 'SP', cepBase: 1310000, latitude: -23.5637, longitude: -46.6523 },
    { cidade: 'São Paulo', bairro: 'Consolação', estado: 'SP', cepBase: 1302000, latitude: -23.5568, longitude: -46.6606 },
    { cidade: 'Campinas', bairro: 'Cambuí', estado: 'SP', cepBase: 1302500, latitude: -22.9056, longitude: -47.0608 },
    { cidade: 'Ribeirão Preto', bairro: 'Jardim América', estado: 'SP', cepBase: 1402020, latitude: -21.1767, longitude: -47.8208 },
    { cidade: 'São José dos Campos', bairro: 'Jardim Aquarius', estado: 'SP', cepBase: 1224600, latitude: -23.2237, longitude: -45.9009 },
    { cidade: 'Sorocaba', bairro: 'Campolim', estado: 'SP', cepBase: 1804700, latitude: -23.5275, longitude: -47.4747 },
    { cidade: 'Santos', bairro: 'Gonzaga', estado: 'SP', cepBase: 1106000, latitude: -23.9675, longitude: -46.3336 },
    { cidade: 'Bauru', bairro: 'Vila Aviação', estado: 'SP', cepBase: 1701800, latitude: -22.3145, longitude: -49.0587 },
    { cidade: 'São José do Rio Preto', bairro: 'Redentora', estado: 'SP', cepBase: 1501520, latitude: -20.8113, longitude: -49.3758 },
    { cidade: 'Piracicaba', bairro: 'Alto', estado: 'SP', cepBase: 1341900, latitude: -22.7253, longitude: -47.6492 },
  ]
  const bandeirasSeed = ['Branca', 'Shell', 'Ipiranga', 'Petrobras', 'Raizen', 'ALE']
  const logradourosSeed = ['Av. Brasil', 'Rod. Anhanguera', 'Rua das Palmeiras', 'Av. Independência', 'Rod. Washington Luiz', 'Av. dos Bandeirantes']
  const nomesSeed = ['Norte', 'Sul', 'Leste', 'Oeste', 'Prime', 'Parque', 'Portal', 'Jardins', 'Express', 'Vale']

  const empreendimentosSeed = [
    {
      nome: 'Posto Demo Centro',
      nomeFantasia: 'Posto Demo Centro',
      codigoInterno: 'POST-001',
      cnpj: '12345678000200',
      bandeira: 'Branca',
      logradouro: 'Av. Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310100',
      latitude: -23.5637,
      longitude: -46.6523,
    },
    {
      nome: 'Posto Demo Sul',
      nomeFantasia: 'Posto Demo Sul',
      codigoInterno: 'POST-002',
      cnpj: '12345678000300',
      bandeira: 'Shell',
      logradouro: 'Rua da Consolação',
      numero: '500',
      bairro: 'Consolação',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01302000',
      latitude: -23.5568,
      longitude: -46.6606,
    },
    ...Array.from({ length: 48 }, (_, idx) => {
      const numero = idx + 3
      const cidadeRef = cidadesSeed[idx % cidadesSeed.length]!
      const nomeRef = nomesSeed[idx % nomesSeed.length]!
      const bandeira = bandeirasSeed[idx % bandeirasSeed.length]!
      const logradouro = logradourosSeed[idx % logradourosSeed.length]!
      const cep = String(cidadeRef.cepBase + idx).padStart(8, '0')
      const sufixoCnpj = String(numero).padStart(3, '0')

      return {
        nome: `Auto Posto ${nomeRef} ${cidadeRef.cidade}`,
        nomeFantasia: `Posto ${nomeRef} ${cidadeRef.cidade}`,
        codigoInterno: `POST-${String(numero).padStart(3, '0')}`,
        cnpj: `12345678${sufixoCnpj}00`,
        bandeira,
        logradouro,
        numero: String(100 + idx * 7),
        bairro: cidadeRef.bairro,
        cidade: cidadeRef.cidade,
        estado: cidadeRef.estado,
        cep,
        latitude: cidadeRef.latitude + idx * 0.0017,
        longitude: cidadeRef.longitude - idx * 0.0013,
      }
    }),
  ]

  const empreendimentos: Array<Awaited<ReturnType<typeof upsertEmpreendimento>>> = []
  for (const item of empreendimentosSeed) {
    empreendimentos.push(await upsertEmpreendimento({
      tenantId: tenant.id,
      empresaId: empresa.id,
      nome: item.nome,
      nomeFantasia: item.nomeFantasia,
      codigoInterno: item.codigoInterno,
      cnpj: item.cnpj,
      tipo: 'POSTO_COMBUSTIVEL',
      bandeira: item.bandeira,
      logradouro: item.logradouro,
      numero: item.numero,
      bairro: item.bairro,
      cidade: item.cidade,
      estado: item.estado,
      cep: item.cep,
      latitude: item.latitude,
      longitude: item.longitude,
      ativo: true,
    }))
  }
  const emp1 = empreendimentos[0]!
  console.log(`✅ Empreendimentos: ${empreendimentos.length}`)

  async function upsertComplianceSnapshot(
    empreendimentoId: string,
    data: {
      indiceConformidade: number
      statusCompliance: 'REGULAR' | 'ATENCAO' | 'CRITICO' | 'EMERGENCIA'
      documentosValidos: number
      documentosTotal: number
      processosRegulares: number
      processosTotal: number
      condicionantesCumpridas: number
      condicionantesAtivas: number
      detalhes?: object
    },
  ) {
    const existente = await prisma.complianceSnapshot.findFirst({
      where: { tenantId: tenant.id, empreendimentoId },
      orderBy: { calculadoEm: 'desc' },
    })
    if (existente) {
      return prisma.complianceSnapshot.update({
        where: { id: existente.id },
        data,
      })
    }
    return prisma.complianceSnapshot.create({
      data: {
        tenantId: tenant.id,
        empreendimentoId,
        ...data,
      },
    })
  }

  async function upsertProcessoPorProtocolo(
    empreendimentoId: string,
    numeroProtocolo: string,
    data: Parameters<typeof prisma.processo.create>[0]['data'],
  ) {
    const existente = await prisma.processo.findFirst({
      where: { tenantId: tenant.id, empreendimentoId, numeroProtocolo },
    })
    if (existente) {
      return prisma.processo.update({
        where: { id: existente.id },
        data,
      })
    }
    return prisma.processo.create({ data })
  }

  async function upsertDocumentoPorNome(
    empreendimentoId: string,
    nome: string,
    data: Parameters<typeof prisma.documento.create>[0]['data'],
  ) {
    const existente = await prisma.documento.findFirst({
      where: { tenantId: tenant.id, empreendimentoId, nome },
    })
    if (existente) {
      return prisma.documento.update({
        where: { id: existente.id },
        data,
      })
    }
    return prisma.documento.create({ data })
  }

  async function upsertTarefaPorTitulo(
    empreendimentoId: string,
    titulo: string,
    data: Parameters<typeof prisma.tarefa.create>[0]['data'],
  ) {
    const existente = await prisma.tarefa.findFirst({
      where: { tenantId: tenant.id, empreendimentoId, titulo },
    })
    if (existente) {
      return prisma.tarefa.update({
        where: { id: existente.id },
        data,
      })
    }
    return prisma.tarefa.create({ data })
  }

  // ── Snapshots de compliance iniciais ──────────────────────────────────────
  for (const [i, emp] of empreendimentos.entries()) {
    const statusBase: Array<'REGULAR' | 'ATENCAO' | 'CRITICO' | 'EMERGENCIA'> = [
      'REGULAR',
      'ATENCAO',
      'REGULAR',
      'ATENCAO',
      'CRITICO',
      'REGULAR',
      'ATENCAO',
      'CRITICO',
      'EMERGENCIA',
      'ATENCAO',
    ]
    const statusCompliance = statusBase[i % statusBase.length]!
    const indiceConformidade =
      i === 0
        ? 92.5
        : i === 1
          ? 71.3
          : statusCompliance === 'REGULAR'
            ? 84 + (i % 11)
            : statusCompliance === 'ATENCAO'
              ? 64 + (i % 9)
              : statusCompliance === 'CRITICO'
                ? 39 + (i % 11)
                : 18 + (i % 12)
    const documentosTotal = 8 + (i % 5)
    const documentosValidos =
      statusCompliance === 'REGULAR'
        ? documentosTotal - 1
        : statusCompliance === 'ATENCAO'
          ? Math.max(documentosTotal - 3, 3)
          : statusCompliance === 'CRITICO'
            ? Math.max(documentosTotal - 5, 2)
            : Math.max(documentosTotal - 6, 1)
    const processosTotal = i === 1 ? 0 : 1 + (i % 3 === 0 ? 1 : 0)
    const processosRegulares =
      processosTotal === 0
        ? 0
        : statusCompliance === 'REGULAR'
          ? processosTotal
          : statusCompliance === 'ATENCAO'
            ? Math.max(processosTotal - 1, 1)
            : 0
    const condicionantesAtivas = 3 + (i % 4)
    const condicionantesCumpridas =
      statusCompliance === 'REGULAR'
        ? condicionantesAtivas
        : statusCompliance === 'ATENCAO'
          ? condicionantesAtivas - 1
          : Math.max(condicionantesAtivas - 3, 0)

    await upsertComplianceSnapshot(emp.id, {
      indiceConformidade,
      statusCompliance,
      documentosValidos,
      documentosTotal,
      processosRegulares,
      processosTotal,
      condicionantesCumpridas,
      condicionantesAtivas,
      detalhes: {
        origem: 'seed-demo-50-postos',
        codigoInterno: emp.codigoInterno,
        statusCompliance,
      },
    })

    if (i < 2) continue

    const codigo = emp.codigoInterno ?? `POST-${String(i + 1).padStart(3, '0')}`
    const nomeRef = emp.nomeFantasia ?? emp.nome
    const processoStatus: Array<'EM_ELABORACAO' | 'EM_ANALISE' | 'EXIGENCIA_DOCUMENTAL' | 'EM_RENOVACAO' | 'DEFERIDO' | 'VENCIDO'> = [
      'EM_ELABORACAO',
      'EM_ANALISE',
      'EXIGENCIA_DOCUMENTAL',
      'EM_RENOVACAO',
      'DEFERIDO',
      'VENCIDO',
    ]
    const statusProcesso = processoStatus[i % processoStatus.length]!
    const processoPrincipal = await upsertProcessoPorProtocolo(emp.id, `PROC-${codigo}-01`, {
      tenantId: tenant.id,
      empreendimentoId: emp.id,
      tipoProcessoId: tipoLoCetesb.id,
      orgaoId: cetesb.id,
      status: statusProcesso,
      faseAtualOrdem: statusProcesso === 'DEFERIDO' ? 5 : statusProcesso === 'EM_ANALISE' ? 3 : 2,
      numeroProtocolo: `PROC-${codigo}-01`,
      dataAbertura: new Date(2025, (i + 1) % 12, 5 + (i % 20)),
      dataProtocolo: new Date(2025, (i + 2) % 12, 8 + (i % 18)),
      dataVencimento: new Date(2026, (i + 4) % 12, 10 + (i % 15)),
      responsavelId: i % 2 === 0 ? coordenador.id : analista.id,
      observacoes: `Processo fictício gerado automaticamente para validação da base demo (${codigo}).`,
    })

    if (i % 6 === 0) {
      await upsertProcessoPorProtocolo(emp.id, `PROC-${codigo}-02`, {
        tenantId: tenant.id,
        empreendimentoId: emp.id,
        tipoProcessoId: tipoLoCetesb.id,
        orgaoId: cetesb.id,
        status: 'EM_RENOVACAO',
        faseAtualOrdem: 2,
        numeroProtocolo: `PROC-${codigo}-02`,
        dataAbertura: new Date(2025, (i + 3) % 12, 3 + (i % 12)),
        dataProtocolo: new Date(2025, (i + 4) % 12, 9 + (i % 10)),
        dataVencimento: new Date(2026, (i + 6) % 12, 12 + (i % 10)),
        responsavelId: coordenador.id,
        observacoes: `Renovação fictícia vinculada ao empreendimento ${codigo}.`,
      })
    }

    const statusLo: 'APROVADO' | 'A_RENOVAR' | 'VENCIDO' =
      statusCompliance === 'REGULAR' ? 'APROVADO' : statusCompliance === 'ATENCAO' ? 'A_RENOVAR' : 'VENCIDO'
    const statusAvcb: 'APROVADO' | 'A_RENOVAR' | 'VENCIDO' =
      statusCompliance === 'EMERGENCIA' ? 'VENCIDO' : statusCompliance === 'CRITICO' ? 'A_RENOVAR' : 'APROVADO'
    const statusAnp: 'APROVADO' | 'PENDENTE' =
      statusCompliance === 'REGULAR' ? 'APROVADO' : 'PENDENTE'

    await upsertDocumentoPorNome(emp.id, `Licença de Operação CETESB — ${nomeRef}`, {
      tenantId: tenant.id,
      empreendimentoId: emp.id,
      processoId: processoPrincipal.id,
      tipoDocumentoId: tdLoCetesb.id,
      nome: `Licença de Operação CETESB — ${nomeRef}`,
      status: statusLo,
      dataEmissao: new Date(2024, i % 12, 5),
      dataValidade: new Date(2026, (i + 3) % 12, 20),
      orgaoEmissor: 'CETESB',
      alertaDiasAntes: [120, 90, 60, 30, 15],
    })

    await upsertDocumentoPorNome(emp.id, `AVCB — ${nomeRef}`, {
      tenantId: tenant.id,
      empreendimentoId: emp.id,
      tipoDocumentoId: tdAvcb.id,
      nome: `AVCB — ${nomeRef}`,
      status: statusAvcb,
      dataEmissao: new Date(2025, (i + 5) % 12, 12),
      dataValidade: new Date(2026, (i + 7) % 12, 18),
      orgaoEmissor: 'CBMSP',
      alertaDiasAntes: [120, 60, 30],
    })

    await upsertDocumentoPorNome(emp.id, `Registro ANP — ${nomeRef}`, {
      tenantId: tenant.id,
      empreendimentoId: emp.id,
      tipoDocumentoId: tdRegAnp.id,
      nome: `Registro ANP — ${nomeRef}`,
      status: statusAnp,
      orgaoEmissor: 'ANP',
      alertaDiasAntes: [90, 60, 30],
    })

    const tarefasBase = [
      {
        titulo: `Revisar dossiê regulatório — ${codigo}`,
        descricao: `Conferir documentação principal do empreendimento ${nomeRef}.`,
        status: 'PENDENTE' as const,
        prioridade: statusCompliance === 'REGULAR' ? 'MEDIA' as const : 'ALTA' as const,
        responsavelId: analista.id,
      },
      {
        titulo: `Atualizar vencimentos críticos — ${codigo}`,
        descricao: `Validar próximos vencimentos e agendar providências do posto ${nomeRef}.`,
        status: statusCompliance === 'REGULAR' ? 'EM_ANDAMENTO' as const : 'PENDENTE' as const,
        prioridade: statusCompliance === 'EMERGENCIA' ? 'CRITICA' as const : 'ALTA' as const,
        responsavelId: coordenador.id,
      },
      {
        titulo: `Conferir regularidade operacional — ${codigo}`,
        descricao: `Checklist operacional fictício para carga de demonstração do posto ${nomeRef}.`,
        status: 'EM_ANDAMENTO' as const,
        prioridade: 'MEDIA' as const,
        responsavelId: i % 2 === 0 ? analista.id : coordenador.id,
      },
    ]

    const totalTarefasGeradas =
      statusCompliance === 'REGULAR' ? 1 : statusCompliance === 'ATENCAO' ? 2 : 3

    for (const [taskIndex, tarefa] of tarefasBase.slice(0, totalTarefasGeradas).entries()) {
      await upsertTarefaPorTitulo(emp.id, tarefa.titulo, {
        tenantId: tenant.id,
        empreendimentoId: emp.id,
        processoId: processoPrincipal.id,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        status: tarefa.status,
        prioridade: tarefa.prioridade,
        origem: 'MANUAL',
        responsavelId: tarefa.responsavelId,
        criadorId: admin.id,
        dataVencimento: new Date(2026, (i + taskIndex + 2) % 12, 8 + taskIndex * 4),
      })
    }
  }
  console.log(`✅ Snapshots de compliance criados`)

  // ── Acesso dos analistas aos empreendimentos ───────────────────────────────
  for (const emp of empreendimentos) {
    await prisma.empreendimentoAcesso.upsert({
      where: { usuarioId_empreendimentoId: { usuarioId: analista.id, empreendimentoId: emp.id } },
      update: {},
      create: { usuarioId: analista.id, empreendimentoId: emp.id },
    })
  }
  console.log(`✅ Acessos dos analistas configurados`)

  // ── Processo de exemplo ────────────────────────────────────────────────────
  let processo = await prisma.processo.findFirst({
    where: { tenantId: tenant.id, empreendimentoId: emp1.id, tipoProcessoId: tipoLoCetesb.id },
  })
  if (!processo) {
    processo = await prisma.processo.create({
      data: {
        tenantId: tenant.id,
        empreendimentoId: emp1.id,
        tipoProcessoId: tipoLoCetesb.id,
        orgaoId: cetesb.id,
        status: 'EM_ELABORACAO',
        faseAtualOrdem: 1,
        dataAbertura: new Date('2025-01-15'),
        dataVencimento: new Date('2026-01-15'),
        responsavelId: coordenador.id,
        observacoes: 'Processo de exemplo criado automaticamente pelo seed',
      },
    })
  }
  console.log(`✅ Processo: ${processo.id.slice(0, 8)}...`)

  // ── Documentos de exemplo ──────────────────────────────────────────────────
  async function criarDocumentoSe(
    tipoDocumentoId: string,
    nome: string,
    status: 'PENDENTE' | 'APROVADO' | 'VENCIDO' | 'A_RENOVAR',
    extra?: { dataEmissao?: Date; dataValidade?: Date; orgaoEmissor?: string; processoId?: string },
  ) {
    const existente = await prisma.documento.findFirst({
      where: { tenantId: tenant.id, empreendimentoId: emp1.id, tipoDocumentoId },
    })
    if (existente) return existente
    return prisma.documento.create({
      data: {
        tenantId: tenant.id,
        empreendimentoId: emp1.id,
        tipoDocumentoId,
        nome,
        status,
        alertaDiasAntes: [90, 60, 30, 15],
        ...extra,
      },
    })
  }

  const docLo = await criarDocumentoSe(tdLoCetesb.id, 'Licença de Operação CETESB — Posto Demo Centro', 'A_RENOVAR', {
    dataEmissao: new Date('2022-03-10'),
    dataValidade: new Date('2026-06-15'),
    orgaoEmissor: 'CETESB',
    processoId: processo.id,
  })

  const docAvcb = await criarDocumentoSe(tdAvcb.id, 'AVCB — Posto Demo Centro', 'APROVADO', {
    dataEmissao: new Date('2023-11-20'),
    dataValidade: new Date('2026-11-20'),
    orgaoEmissor: 'CBMSP',
  })

  const docRegAnp = await criarDocumentoSe(tdRegAnp.id, 'Registro ANP — Posto Demo Centro', 'APROVADO', {
    orgaoEmissor: 'ANP',
  })

  console.log(`✅ Documentos: ${[docLo, docAvcb, docRegAnp].length}`)
  void tdHabitese

  // ── Condicionante de exemplo ───────────────────────────────────────────────
  let condicionante = await prisma.condicionante.findFirst({
    where: { tenantId: tenant.id, empreendimentoId: emp1.id, processoId: processo.id },
  })
  if (!condicionante) {
    condicionante = await prisma.condicionante.create({
      data: {
        tenantId: tenant.id,
        empreendimentoId: emp1.id,
        processoId: processo.id,
        descricao: 'Monitoramento mensal de nível de água nos poços de monitoramento',
        tipo: 'MONITORAMENTO',
        status: 'PENDENTE',
        periodicidade: 'MENSAL',
        proximoVencimento: new Date('2026-05-01'),
        responsavelId: analista.id,
        diasAlertaAntes: [30, 15, 7],
      },
    })
  }
  console.log(`✅ Condicionante: ${condicionante.id.slice(0, 8)}...`)

  // ── Tarefas de exemplo ─────────────────────────────────────────────────────
  async function criarTarefaSe(titulo: string, data: Parameters<typeof prisma.tarefa.create>[0]['data']) {
    const existente = await prisma.tarefa.findFirst({ where: { tenantId: tenant.id, empreendimentoId: emp1.id, titulo } })
    if (existente) return existente
    return prisma.tarefa.create({ data })
  }

  const t1 = await criarTarefaSe('Renovar Licença de Operação CETESB', {
    tenantId: tenant.id,
    empreendimentoId: emp1.id,
    titulo: 'Renovar Licença de Operação CETESB',
    descricao: 'Dar início ao processo de renovação da LO junto à CETESB antes do vencimento',
    status: 'PENDENTE',
    prioridade: 'ALTA',
    origem: 'MANUAL',
    processoId: processo.id,
    responsavelId: coordenador.id,
    criadorId: admin.id,
    dataVencimento: new Date('2026-04-30'),
  })

  const t2 = await criarTarefaSe('Executar monitoramento de poços — Abril/2026', {
    tenantId: tenant.id,
    empreendimentoId: emp1.id,
    titulo: 'Executar monitoramento de poços — Abril/2026',
    descricao: 'Coleta de amostras e medição de nível nos 4 poços de monitoramento do terreno',
    status: 'PENDENTE',
    prioridade: 'MEDIA',
    origem: 'REGRA_CONDICIONANTE',
    condicionanteId: condicionante.id,
    responsavelId: analista.id,
    criadorId: admin.id,
    dataVencimento: new Date('2026-04-30'),
  })

  console.log(`✅ Tarefas: ${[t1, t2].length}`)

  await seedObrigacoesRegulatorias(prisma)
  await seedServicosConsultoriaEPrecificacao(prisma, tenant.id)
  await seedBaseInterface(prisma)

  await seedChecklists(prisma, tenant.id)
  await seedPgrsERegras(prisma)

  await seedOperationalScenarios({
    prisma,
    tenantId: tenant.id,
    adminId: admin.id,
    coordenadorId: coordenador.id,
    analistaId: analista.id,
    empreendimentos: empreendimentos.map((emp) => ({
      id: emp.id,
      nome: emp.nome,
      nomeFantasia: emp.nomeFantasia,
      codigoInterno: emp.codigoInterno,
      cidade: emp.cidade,
      estado: emp.estado,
    })),
  })
  console.log('✅ Cenários operacionais complementares carregados')

  console.log('\n✨ Seed concluído!\n')
  console.log('Credenciais de acesso:')
  console.log(`  Admin:       admin@postodemo.com.br  / ${SENHA_PADRAO}`)
  console.log(`  Coordenador: coord@postodemo.com.br  / ${SENHA_PADRAO}`)
  console.log(`  Analista:    analista@postodemo.com.br / ${SENHA_PADRAO}`)
  console.log('\nPara trocar a senha do admin: pnpm --filter api reset-password')
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
