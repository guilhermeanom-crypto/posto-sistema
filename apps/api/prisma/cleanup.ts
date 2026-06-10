/**
 * CLEANUP — Remove todos os dados operacionais de demonstração.
 * Mantém: Tenant, Usuários, OrgãosReguladores.
 * Uso: pnpm --filter api tsx prisma/cleanup.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Limpando dados de demonstração...\n')

  // Ordem: dependentes primeiro, depois pais
  const steps: [string, () => Promise<{ count: number }>][] = [
    // WhatsApp
    ['MensagemLead',           () => prisma.mensagemLead.deleteMany()],
    ['LeadWhatsApp',           () => prisma.leadWhatsApp.deleteMany()],
    // Notificações
    ['AlertaDestinatario',     () => prisma.alertaDestinatario.deleteMany()],
    ['Alerta',                 () => prisma.alerta.deleteMany()],
    ['RegraAutomatica',        () => prisma.regraAutomatica.deleteMany()],
    // Audit
    ['AuditLog',               () => prisma.auditLog.deleteMany()],
    // Checklists
    ['ChecklistResposta',      () => prisma.checklistResposta.deleteMany()],
    ['ChecklistExecucao',      () => prisma.checklistExecucao.deleteMany()],
    ['ChecklistItem',          () => prisma.checklistItem.deleteMany()],
    ['ChecklistTemplate',      () => prisma.checklistTemplate.deleteMany()],
    // Legislação
    ['LegislacaoEmpreendimento', () => prisma.legislacaoEmpreendimento.deleteMany()],
    ['Legislacao',             () => prisma.legislacao.deleteMany()],
    // Monitoramento
    ['LeituraParametro',       () => prisma.leituraParametro.deleteMany()],
    ['LimiteParametro',        () => prisma.limiteParametro.deleteMany()],
    ['PocoMonitoramento',      () => prisma.pocoMonitoramento.deleteMany()],
    // Logística reversa
    ['CCR',                    () => prisma.cCR.deleteMany()],
    ['MTR',                    () => prisma.mTR.deleteMany()],
    ['MetaResiduoAnual',       () => prisma.metaResiduoAnual.deleteMany()],
    // Estanqueidade
    ['TesteEstanqueidade',     () => prisma.testeEstanqueidade.deleteMany()],
    // Outorga
    ['OutorgaHidrica',         () => prisma.outorgaHidrica.deleteMany()],
    // Fiscalizações
    ['ItemFiscalizacao',       () => prisma.itemFiscalizacao.deleteMany()],
    ['Fiscalizacao',           () => prisma.fiscalizacao.deleteMany()],
    // SST
    ['DocumentoSST',           () => prisma.documentoSST.deleteMany()],
    // ANP
    ['RegistroANP',            () => prisma.registroANP.deleteMany()],
    // Reg. Urbano
    ['LicencaUrbana',          () => prisma.licencaUrbana.deleteMany()],
    // Licenças ambientais
    ['CondicionanteExecucao',  () => prisma.condicionanteExecucao.deleteMany()],
    ['Condicionante',          () => prisma.condicionante.deleteMany()],
    ['LicencaAmbiental',       () => prisma.licencaAmbiental.deleteMany()],
    // Documentos
    ['VersaoDocumento',        () => prisma.versaoDocumento.deleteMany()],
    ['Documento',              () => prisma.documento.deleteMany()],
    ['TipoDocumento',          () => prisma.tipoDocumento.deleteMany()],
    // Tarefas
    ['ComentarioTarefa',       () => prisma.comentarioTarefa.deleteMany()],
    ['Tarefa',                 () => prisma.tarefa.deleteMany()],
    // Processos
    ['Processo',               () => prisma.processo.deleteMany()],
    // Empreendimentos (postos)
    ['Empreendimento',         () => prisma.empreendimento.deleteMany()],
    // Empresa
    ['Empresa',                () => prisma.empresa.deleteMany()],
  ]

  let total = 0
  for (const [name, fn] of steps) {
    try {
      const { count } = await fn()
      if (count > 0) {
        console.log(`  ✓ ${name}: ${count} registro(s) removido(s)`)
        total += count
      }
    } catch {
      // Tabela pode não existir neste schema — ignora silenciosamente
    }
  }

  console.log(`\n✅ Limpeza concluída — ${total} registros removidos.`)
  console.log('   Mantidos: Tenant, Usuários, OrgãosReguladores\n')
  console.log('   Login: admin@postodemo.com.br / Demo@1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
