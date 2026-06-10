#!/usr/bin/env tsx
/**
 * Audita o schema Prisma e detecta models operacionais sem `empreendimentoId`.
 *
 * Princípio: toda entidade operacional/regulatória nasce em um empreendimento.
 * Catálogos globais ao tenant são exceções declaradas em CATALOGOS_GLOBAIS.
 *
 * Fase 0: roda em modo "advisory" (continue-on-error no CI).
 * Fase 1+: deve passar a falhar duro.
 *
 * Uso: pnpm tsx scripts/lint-empreendimento-id.ts
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SCHEMA_PATH = resolve(__dirname, '../apps/api/prisma/schema.prisma')

// Models que SÃO catálogos/configuração globais ao tenant — não exigem empreendimentoId.
const CATALOGOS_GLOBAIS = new Set([
  'Tenant',
  'Usuario',
  'SessaoRefresh',
  'TokenPortal',
  'Empresa',
  'Empreendimento',
  'EmpreendimentoAcesso',
  'OrgaoRegulador',
  'TipoProcesso',
  'FaseTipoProcesso',
  'TipoDocumento',
  'RequisitoTipoProcesso',
  'TreinamentoTipo',
  'Transportadora',
  'Distribuidora',
  'EmpresaExecutoraEnsaio',
  'EmpresaAutorizadaINMETRO',
  'AdvogadoExterno',
  'EPICatalogo',
  'Cargo',
  'RiscoOcupacional',
  'TipoInfracao',
  'RegraPrazoOrgao',
  'NormaTipoProcesso',
  'ChecklistTemplate',
  'ChecklistItem',
  'RegraAutomatica',
  'RegraAlerta',
  'ObrigacaoRegulatoriaBase',
  'LimiteParametro',
  'AuditLog',
  'PublicacaoDO',
  'RelatorioGerado',
  'MensagemPortal',
  'ContatoWhatsApp',
  'MensagemWhatsApp',
  'LeadWhatsApp',
  'FollowUpLead',
  'MensagemLead',
])

// Models que ligam por ID indireto (FK para entidade já com empreendimentoId).
// Aceitos como "OK por composição" — mas será revisado nas fases dos respectivos módulos.
const OK_POR_COMPOSICAO = new Set([
  'CondicaoLicenca',           // → LicencaAmbiental
  'CicloCondicionante',        // → Condicionante
  'EvidenciaTarefa',           // → Tarefa
  'TarefaDependencia',         // → Tarefa
  'HistoricoFaseProcesso',     // → Processo
  'RequisitoProcesso',         // → Processo
  'TreinamentoParticipante',   // → TreinamentoExecucao + Funcionario
  'CCR',                       // → MTR
  'PGRSExigencia',             // → PGRS
  'PGRSEvidencia',             // → PGRSExigencia
  'TesteEstanqueidade',        // → Tanque
  'LaudoAgua',                 // → PocoArtesiano
  'RecursoAdministrativo',     // → AutoInfracao
  'DefesaTecnica',             // → AutoInfracao
  'AlertaDestinatario',        // → Alerta + Usuario
  'DocumentoVersao',           // → Documento
  'ChecklistResposta',         // → ChecklistExecucao
  'ParametroContaminante',     // → CampanhaMonitoramento
])

function main() {
  const schema = readFileSync(SCHEMA_PATH, 'utf-8')

  // Encontra todos os blocos `model X { ... }`
  const modelRegex = /^model\s+(\w+)\s*\{([^}]*)\}/gm
  const violacoes: { model: string; razao: string }[] = []
  const total = { modelos: 0, comObrigatorio: 0, comOpcional: 0, semCatalogo: 0, semOkComposicao: 0, violacoes: 0 }

  let match: RegExpExecArray | null
  while ((match = modelRegex.exec(schema)) !== null) {
    const [, modelName, body] = match
    if (!modelName || !body) continue
    total.modelos += 1

    if (CATALOGOS_GLOBAIS.has(modelName)) {
      total.semCatalogo += 1
      continue
    }
    if (OK_POR_COMPOSICAO.has(modelName)) {
      total.semOkComposicao += 1
      continue
    }

    const obrigatorio = /\bempreendimentoId\s+String\b(?!\?)/.test(body)
    const opcional = /\bempreendimentoId\s+String\?/.test(body)

    if (obrigatorio) {
      total.comObrigatorio += 1
    } else if (opcional) {
      total.comOpcional += 1
      violacoes.push({ model: modelName, razao: 'empreendimentoId opcional — clarificar design' })
    } else {
      total.violacoes += 1
      violacoes.push({ model: modelName, razao: 'sem empreendimentoId e não declarado como catálogo/composição' })
    }
  }

  console.log(`\n📊 Auditoria empreendimentoId — schema.prisma\n`)
  console.log(`Total de models analisados:        ${total.modelos}`)
  console.log(`  Com empreendimentoId obrigatório: ${total.comObrigatorio}`)
  console.log(`  Com empreendimentoId opcional:    ${total.comOpcional}`)
  console.log(`  Catálogos globais (OK):           ${total.semCatalogo}`)
  console.log(`  OK por composição (FK indireto):  ${total.semOkComposicao}`)
  console.log(`  Violações novas:                  ${total.violacoes}`)

  if (violacoes.length === 0) {
    console.log(`\n✅ Nenhuma violação não-mapeada.`)
    return
  }

  console.log(`\n⚠ Violações:`)
  for (const v of violacoes) {
    console.log(`  • ${v.model}: ${v.razao}`)
  }
  console.log(`\nVer docs/arquitetura/AUDITORIA_EMPREENDIMENTO_ID.md para plano de correção.`)
  // Phase 0: advisory, exit 0. Trocar para process.exit(1) na Phase 1.
  process.exit(0)
}

main()
