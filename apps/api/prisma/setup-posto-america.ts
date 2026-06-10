/* eslint-disable no-console */
/// <reference types="node" />
import { PrismaClient, PrioridadeTarefa } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏪 Cadastrando Posto América...\n')

  const tenant = await prisma.tenant.findFirstOrThrow({ where: { slug: 'demo' } })
  console.log(`✅ Tenant: ${tenant.nome}`)

  // ── SEMMA Guapó ────────────────────────────────────────────────────────────
  const semmaExiste = await prisma.orgaoRegulador.findFirst({
    where: { tenantId: tenant.id, sigla: 'SEMMA-GUAPO' },
  })
  const semma = semmaExiste ?? await prisma.orgaoRegulador.create({
    data: {
      tenantId: tenant.id,
      nome: 'Secretaria Municipal de Meio Ambiente de Guapó',
      sigla: 'SEMMA-GUAPO',
      esfera: 'MUNICIPAL',
      tipo: 'AMBIENTAL',
      estadoUf: 'GO',
      municipio: 'Guapó',
    },
  })
  console.log(`✅ Órgão: ${semma.nome}`)

  // ── Empresa ────────────────────────────────────────────────────────────────
  const empresa = await prisma.empresa.upsert({
    where: { tenantId_cnpj: { tenantId: tenant.id, cnpj: '34144804000186' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'America Auto Posto Ltda',
      razaoSocial: 'America Auto Posto Ltda',
      cnpj: '34144804000186',
      inscricaoEstadual: '108108244',
      ativo: true,
    },
  })
  console.log(`✅ Empresa: ${empresa.razaoSocial}`)

  // ── Empreendimento ─────────────────────────────────────────────────────────
  const postoExiste = await prisma.empreendimento.findFirst({
    where: { tenantId: tenant.id, cnpj: '34144804000186' },
  })
  const posto = postoExiste ?? await prisma.empreendimento.create({
    data: {
      tenantId:     tenant.id,
      empresaId:    empresa.id,
      nome:         'America Auto Posto Ltda',
      nomeFantasia: 'Posto América',
      cnpj:         '34144804000186',
      codigoInterno: 'POST-001',
      bandeira:     'Bandeira Branca',
      tipo:         'POSTO_COMBUSTIVEL',
      logradouro:   'Rodovia BR-060',
      numero:       'S/N',
      complemento:  'KM 203',
      bairro:       'Zona Rural',
      cidade:       'Guapó',
      estado:       'GO',
      cep:          '75350000',
      latitude:     -16.9020278,
      longitude:    -49.6419611,
      atividades:   [
        'Comércio varejista de combustíveis (CNAE 4731-8-00)',
        'Comércio varejista de lubrificantes (CNAE 4732-6-00)',
      ],
      responsavelTecnicoNome: 'Sérgio Marques dos Santos',
      ativo: true,
    },
  })
  console.log(`✅ Empreendimento: ${posto.nomeFantasia} — ${posto.cidade}/${posto.estado}`)

  // ── LAO 033/2020 ───────────────────────────────────────────────────────────
  const laoExiste = await prisma.licencaAmbiental.findFirst({
    where: { tenantId: tenant.id, empreendimentoId: posto.id, numero: '033/2020' },
  })
  const lao = laoExiste ?? await prisma.licencaAmbiental.create({
    data: {
      tenantId:         tenant.id,
      empreendimentoId: posto.id,
      tipo:             'LAO',
      numero:           '033/2020',
      orgaoEmissor:     'SEMMA – Secretaria Municipal de Meio Ambiente de Guapó',
      dataEmissao:      new Date('2020-12-23'),
      dataVencimento:   new Date('2026-12-23'),
      status:           'A_RENOVAR',
      observacoes:      'Processo nº 22760/2020. Via retificada em 03/09/2025 (Eireli→Ltda).\nPRAZO PROTOCOLO RENOVAÇÃO: 23/08/2026.\nPré-requisitos vencidos: CERCON, Laudo Estanqueidade, Dispensa Outorga.',
      diasAlerta:       [120, 90, 60, 30, 15, 7],
    },
  })
  console.log(`✅ LAO ${lao.numero} — vence ${lao.dataVencimento.toLocaleDateString('pt-BR')}`)

  // ── Tanques ────────────────────────────────────────────────────────────────
  const defTanques = [
    { numero: 1, capacidadeLitros: 20000, combustivel: 'Gasolina Comum',    material: 'FIBRA', observacoes: 'Tanque tripartido 3×20m³ — compartimento 1' },
    { numero: 2, capacidadeLitros: 20000, combustivel: 'Etanol Hidratado',  material: 'FIBRA', observacoes: 'Tanque tripartido 3×20m³ — compartimento 2' },
    { numero: 3, capacidadeLitros: 20000, combustivel: 'Gasolina Aditivada',material: 'FIBRA', observacoes: 'Tanque tripartido 3×20m³ — compartimento 3' },
    { numero: 4, capacidadeLitros: 30000, combustivel: 'Diesel S10',        material: 'FIBRA', observacoes: 'Tanque bipartido 2×30m³ — compartimento 1' },
    { numero: 5, capacidadeLitros: 30000, combustivel: 'Diesel S500',       material: 'FIBRA', observacoes: 'Tanque bipartido 2×30m³ — compartimento 2' },
  ]
  const tanquesCriados = []
  for (const t of defTanques) {
    const ex = await prisma.tanque.findFirst({
      where: { empreendimentoId: posto.id, numero: t.numero },
    })
    const tanque = ex ?? await prisma.tanque.create({
      data: { tenantId: tenant.id, empreendimentoId: posto.id, status: 'ATIVO', ...t },
    })
    tanquesCriados.push(tanque)
  }
  console.log(`✅ Tanques: ${tanquesCriados.length} — 120.000 L total (60m³ GC/EC/GA + 60m³ DS10/DS500)`)

  // ── Laudo Estanqueidade — VENCIDO 27/04/2025 ──────────────────────────────
  for (const tanque of tanquesCriados) {
    const ex = await prisma.testeEstanqueidade.findFirst({
      where: { tanqueId: tanque.id },
    })
    if (!ex) {
      await prisma.testeEstanqueidade.create({
        data: {
          tanqueId:     tanque.id,
          empresa:      'Ecotec Engenharia e Consultoria',
          responsavel:  'Ecotec',
          dataExecucao: new Date('2023-04-27'),
          resultado:    'APROVADO',
          metodo:       'Pressão / Vácuo — ABNT NBR 13784',
          proximoTeste: new Date('2025-04-27'),
          nomeArquivo:  'Laudo_Ecotec_093-2023.pdf',
          observacoes:  'VENCIDO em 27/04/2025. Laudo bienal. Renovação obrigatória antes de 23/08/2026.',
        },
      })
    }
  }
  console.log(`✅ Laudo Estanqueidade: Ecotec 093-2023 (VENCIDO 27/04/2025)`)

  // ── Bombas ─────────────────────────────────────────────────────────────────
  const defBombas = [
    { numero: 1, fabricante: 'Gilbarco', combustiveis: ['Gasolina Comum', 'Etanol Hidratado', 'Gasolina Aditivada'], observacoes: 'Bomba 6 bicos — GC/EC/GA' },
    { numero: 2, fabricante: 'Gilbarco', combustiveis: ['Gasolina Comum', 'Etanol Hidratado', 'Gasolina Aditivada'], observacoes: 'Bomba 6 bicos — GC/EC/GA' },
    { numero: 3, fabricante: 'Gilbarco', combustiveis: ['Diesel S10', 'Diesel S500'],                                observacoes: 'Bomba 6 bicos — DS10/DS500' },
    { numero: 4, fabricante: 'Gilbarco', combustiveis: ['Diesel S10', 'Diesel S500'],                                observacoes: 'Bomba 6 bicos — DS10/DS500' },
  ]
  for (const b of defBombas) {
    const ex = await prisma.bombaAbastecimento.findFirst({
      where: { empreendimentoId: posto.id, numero: b.numero },
    })
    if (!ex) {
      await prisma.bombaAbastecimento.create({
        data: { tenantId: tenant.id, empreendimentoId: posto.id, status: 'ATIVO', ...b },
      })
    }
  }
  console.log(`✅ Bombas: 4 cadastradas — 24 bicos total`)

  // ── Alertas críticos ───────────────────────────────────────────────────────
  const defAlertas = [
    { nivel: 'CRITICO' as const, tipo: 'VENCIMENTO_DOCUMENTO' as const, titulo: 'CERCON vencido — Certificado de Conformidade dos Bombeiros', mensagem: 'Protocolo 94044/23 venceu em 17/05/2024. Pré-requisito obrigatório para renovação da LAO em 23/08/2026.' },
    { nivel: 'CRITICO' as const, tipo: 'VENCIMENTO_DOCUMENTO' as const, titulo: 'Laudo de Estanqueidade vencido — Ecotec 093-2023',            mensagem: 'Venceu em 27/04/2025. Teste bienal obrigatório antes do protocolo da LAO.' },
    { nivel: 'CRITICO' as const, tipo: 'VENCIMENTO_DOCUMENTO' as const, titulo: 'Dispensa de Outorga vencida — DURH002737 (SEMAD)',            mensagem: 'Venceu em 09/12/2023. Renovação obrigatória junto à SEMAD-GO.' },
    { nivel: 'ALTO'    as const, tipo: 'VENCIMENTO_DOCUMENTO' as const, titulo: 'Credenciamento INMETRO da empresa de testes vencido',          mensagem: 'Certificado NCC 21.08786 venceu em 29/04/2024. Necessário contratar nova empresa credenciada.' },
    { nivel: 'ALTO'    as const, tipo: 'COMPLIANCE_CRITICO'   as const, titulo: 'Não conformidade em efluentes — Óleos e Turbidez',            mensagem: 'Relatório Fev/2024: Óleos 64,82 mg/L e Turbidez 443 NTU acima dos limites. Caixa SAO deve ser verificada.' },
    { nivel: 'ALTO'    as const, tipo: 'VENCIMENTO_DOCUMENTO' as const, titulo: 'Prazo de renovação da LAO em 137 dias — protocolar até 23/08/2026', mensagem: 'Regularizar 3 documentos vencidos (CERCON, Estanqueidade, Outorga) antes de protocolar.' },
  ]
  let alertasN = 0
  for (const a of defAlertas) {
    const ex = await prisma.alerta.findFirst({ where: { tenantId: tenant.id, titulo: a.titulo } })
    if (!ex) { await prisma.alerta.create({ data: { tenantId: tenant.id, empreendimentoId: posto.id, ...a } }); alertasN++ }
  }
  console.log(`✅ Alertas: ${alertasN} criados`)

  // ── Tarefas urgentes ───────────────────────────────────────────────────────
  const admin = await prisma.usuario.findFirstOrThrow({ where: { tenantId: tenant.id, perfil: 'ADMIN_TENANT' } })
  const defTarefas = [
    { titulo: 'Renovar CERCON com CBMGO',                             prioridade: PrioridadeTarefa.CRITICA, dataVencimento: new Date('2026-07-23'), descricao: 'Protocolo 94044/23 venceu em 17/05/2024. Agendar vistoria com CBMGO e obter novo CERCON.' },
    { titulo: 'Contratar empresa credenciada e realizar Estanqueidade',prioridade: PrioridadeTarefa.CRITICA, dataVencimento: new Date('2026-07-23'), descricao: 'Laudo Ecotec venceu em 27/04/2025 e credenciamento da Ecotec também venceu. Contratar nova empresa.' },
    { titulo: 'Renovar Dispensa de Outorga na SEMAD-GO',              prioridade: PrioridadeTarefa.CRITICA, dataVencimento: new Date('2026-07-15'), descricao: 'DURH002737 venceu em 09/12/2023. Protocolar renovação na SEMAD-GO.' },
    { titulo: 'Corrigir não conformidade de efluentes (Caixa SAO)',    prioridade: PrioridadeTarefa.ALTA,    dataVencimento: new Date('2026-06-30'), descricao: 'Óleos 64,82 mg/L e Turbidez 443 NTU fora dos limites. Verificar e limpar caixa separadora.' },
    { titulo: 'Protocolar renovação da LAO 033/2020 — SEMMA Guapó',   prioridade: PrioridadeTarefa.ALTA,    dataVencimento: new Date('2026-08-23'), descricao: 'Prazo: 23/08/2026. Reunir CERCON, Laudo Estanqueidade, Outorga e monitoramento conforme.' },
  ]
  let tarefasN = 0
  for (const t of defTarefas) {
    const ex = await prisma.tarefa.findFirst({ where: { tenantId: tenant.id, titulo: t.titulo } })
    if (!ex) { await prisma.tarefa.create({ data: { tenantId: tenant.id, empreendimentoId: posto.id, criadorId: admin.id, status: 'PENDENTE', ...t } }); tarefasN++ }
  }
  console.log(`✅ Tarefas: ${tarefasN} criadas`)

  // ── Resumo ─────────────────────────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────')
  console.log('📍 POSTO AMÉRICA — setup concluído com sucesso')
  console.log('──────────────────────────────────────────────')
  console.log('   Empresa:   America Auto Posto Ltda')
  console.log('   Endereço:  BR-060 S/N KM 203 — Guapó/GO')
  console.log('   LAO:       033/2020 | Vence 23/12/2026')
  console.log('   Renovar:   até 23/08/2026')
  console.log('   Tanques:   5 compartimentos | 120.000 L')
  console.log('   Bombas:    4 | 24 bicos')
  console.log('   ⚠ Crítico: CERCON + Estanqueidade + Outorga VENCIDOS')
  console.log('   ⚠ Crítico: Efluentes não conformes (Óleos + Turbidez)')
  console.log('──────────────────────────────────────────────\n')
}

main().catch(console.error).finally(() => prisma.$disconnect())
