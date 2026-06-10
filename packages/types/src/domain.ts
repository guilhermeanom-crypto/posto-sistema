// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DE DOMÍNIO — espelham as entidades do banco
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CategoriaDocumento,
  CategoriaProcesso,
  EsferaRegulatoria,
  NivelAlerta,
  OrigemTarefa,
  PerfilUsuario,
  PeriodicidadeCondicionante,
  PrioridadeTarefa,
  StatusCompliance,
  StatusCondicionante,
  StatusDocumento,
  StatusProcesso,
  StatusTarefa,
  StatusVersaoDocumento,
  TipoAlerta,
  TipoCondicionante,
  TipoEvidencia,
  TipoOrgao,
} from './enums.js'

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UTILITÁRIOS
// ─────────────────────────────────────────────────────────────────────────────

export type UUID = string
export type ISODateString = string // "2024-03-15T14:30:00Z"
export type DateString = string    // "2024-03-15"

export type Nullable<T> = T | null

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// G1 — FUNDAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

export interface Tenant {
  id: UUID
  nome: string
  slug: string
  plano: string
  limiteEmpreendimentos: number
  configuracoes: TenantConfiguracoes
  ativo: boolean
  criadoEm: ISODateString
  atualizadoEm: ISODateString
}

export interface TenantConfiguracoes {
  diasAlertaPadrao: number[]
  diasAntecedenciaRenovacaoPadrao: number
  canaisNotificacao: Array<'email' | 'sistema' | 'whatsapp'>
  fuso: string
  logoUrl?: string
}

export interface Empresa {
  id: UUID
  tenantId: UUID
  nome: string
  razaoSocial: string
  cnpj: string
  inscricaoEstadual: Nullable<string>
  inscricaoMunicipal: Nullable<string>
  ativo: boolean
  criadoEm: ISODateString
  atualizadoEm: ISODateString
}

export interface Empreendimento {
  id: UUID
  tenantId: UUID
  empresaId: UUID
  nome: string
  nomeFantasia: Nullable<string>
  cnpj: Nullable<string>
  codigoInterno: Nullable<string>
  bandeira: Nullable<string>
  tipo: Nullable<string>
  logradouro: string
  numero: string
  complemento: Nullable<string>
  bairro: string
  cidade: string
  estado: string
  cep: string
  latitude: Nullable<number>
  longitude: Nullable<number>
  responsavelTecnicoNome: Nullable<string>
  responsavelTecnicoCrea: Nullable<string>
  responsavelTecnicoEmail: Nullable<string>
  contatoEmail: Nullable<string>
  contatoTelefone: Nullable<string>
  atividades: string[]
  dataInicioOperacao: Nullable<DateString>
  ativo: boolean
  criadoEm: ISODateString
  atualizadoEm: ISODateString
}

export interface Usuario {
  id: UUID
  tenantId: UUID
  nome: string
  email: string
  perfil: PerfilUsuario
  telefone: Nullable<string>
  ativo: boolean
  ultimoAcesso: Nullable<ISODateString>
  criadoEm: ISODateString
  atualizadoEm: ISODateString
}

// ─────────────────────────────────────────────────────────────────────────────
// G2 — CATÁLOGOS DE CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

export interface OrgaoRegulador {
  id: UUID
  tenantId: UUID
  nome: string
  sigla: string
  esfera: EsferaRegulatoria
  tipo: TipoOrgao
  estadoUf: Nullable<string>
  site: Nullable<string>
  ativo: boolean
  criadoEm: ISODateString
}

export interface TipoProcesso {
  id: UUID
  tenantId: UUID
  orgaoId: UUID
  orgao?: OrgaoRegulador
  nome: string
  descricao: Nullable<string>
  categoria: CategoriaProcesso
  requerRenovacao: boolean
  periodoValidadeAnos: Nullable<number>
  diasAntecedenciaRenovacao: number
  diasAlerta: number[]
  instrucoes: Nullable<string>
  ativo: boolean
  versao: number
  criadoEm: ISODateString
  atualizadoEm: ISODateString
  fases?: FaseTipoProcesso[]
  requisitos?: RequisitoTipoProcesso[]
}

export interface FaseTipoProcesso {
  id: UUID
  tipoProcessoId: UUID
  nome: string
  descricao: Nullable<string>
  ordem: number
  obrigatoria: boolean
  diasEstimados: Nullable<number>
  instrucoes: Nullable<string>
}

export interface TipoDocumento {
  id: UUID
  tenantId: UUID
  nome: string
  descricao: Nullable<string>
  categoria: CategoriaDocumento
  formatosAceitos: string[]
  tamanhoMaximoMb: number
  temValidade: boolean
  validadeMediaMeses: Nullable<number>
  exigeAssinatura: boolean
  instrucoesObtencao: Nullable<string>
  ativo: boolean
  criadoEm: ISODateString
}

export interface RequisitoTipoProcesso {
  id: UUID
  tipoProcessoId: UUID
  tipoDocumentoId: UUID
  tipoDocumento?: TipoDocumento
  faseTipoProcessoId: Nullable<UUID>
  fase?: FaseTipoProcesso
  obrigatorio: boolean
  descricaoEspecifica: Nullable<string>
  condicoes: Nullable<Record<string, unknown>>
  ordem: number
}

// ─────────────────────────────────────────────────────────────────────────────
// G3 — PROCESSOS REGULATÓRIOS
// ─────────────────────────────────────────────────────────────────────────────

export interface Processo {
  id: UUID
  tenantId: UUID
  empreendimentoId: UUID
  empreendimento?: Pick<Empreendimento, 'id' | 'nome' | 'cidade' | 'estado'>
  tipoProcessoId: UUID
  tipoProcesso?: Pick<TipoProcesso, 'id' | 'nome' | 'categoria'>
  orgaoId: UUID
  orgao?: Pick<OrgaoRegulador, 'id' | 'nome' | 'sigla' | 'esfera'>
  status: StatusProcesso
  faseAtualOrdem: number
  numeroProtocolo: Nullable<string>
  numeroLicenca: Nullable<string>
  dataAbertura: Nullable<DateString>
  dataProtocolo: Nullable<DateString>
  dataDecisao: Nullable<DateString>
  dataEmissao: Nullable<DateString>
  dataVencimento: Nullable<DateString>
  dataInicioRenovacao: Nullable<DateString>
  responsavelId: Nullable<UUID>
  responsavel?: Pick<Usuario, 'id' | 'nome' | 'email'>
  observacoes: Nullable<string>
  metadados: Nullable<Record<string, unknown>>
  criadoEm: ISODateString
  atualizadoEm: ISODateString
  requisitos?: RequisitoProcesso[]
  condicionantes?: Condicionante[]
}

export interface HistoricoFaseProcesso {
  id: UUID
  processoId: UUID
  faseTipoProcessoId: UUID
  ordemFase: number
  nomeFase: string
  iniciouEm: ISODateString
  concluiuEm: Nullable<ISODateString>
  avancadoPorId: UUID
  avancadoPor?: Pick<Usuario, 'id' | 'nome'>
  observacoes: Nullable<string>
}

export interface RequisitoProcesso {
  id: UUID
  processoId: UUID
  tipoDocumentoId: UUID
  tipoDocumento?: Pick<TipoDocumento, 'id' | 'nome' | 'categoria'>
  requisitoTipoId: Nullable<UUID>
  faseTipoProcessoId: Nullable<UUID>
  documentoId: Nullable<UUID>
  documento?: Pick<Documento, 'id' | 'nome' | 'status' | 'dataValidade'>
  descricao: Nullable<string>
  obrigatorio: boolean
  status: StatusDocumento
  dispensadoPorId: Nullable<UUID>
  motivoDispensa: Nullable<string>
  dispensadoEm: Nullable<ISODateString>
  ordem: number
  criadoEm: ISODateString
}

// ─────────────────────────────────────────────────────────────────────────────
// G4 — DOCUMENTOS
// ─────────────────────────────────────────────────────────────────────────────

export interface Documento {
  id: UUID
  tenantId: UUID
  empreendimentoId: UUID
  processoId: Nullable<UUID>
  condicionanteId: Nullable<UUID>
  tipoDocumentoId: UUID
  tipoDocumento?: Pick<TipoDocumento, 'id' | 'nome' | 'categoria'>
  nome: string
  descricao: Nullable<string>
  status: StatusDocumento
  dataEmissao: Nullable<DateString>
  dataValidade: Nullable<DateString>
  orgaoEmissor: Nullable<string>
  versaoAtualId: Nullable<UUID>
  versaoAtual?: DocumentoVersao
  totalVersoes: number
  alertaDiasAntes: Nullable<number[]>
  criadoEm: ISODateString
  atualizadoEm: ISODateString
}

export interface DocumentoVersao {
  id: UUID
  documentoId: UUID
  numeroVersao: number
  arquivoChaveS3: string
  arquivoNome: string
  arquivoMime: string
  arquivoBytes: number
  hashSha256: string
  status: StatusVersaoDocumento
  observacoesEnvio: Nullable<string>
  enviadoPorId: UUID
  enviadoPor?: Pick<Usuario, 'id' | 'nome'>
  enviadoEm: ISODateString
  validadoPorId: Nullable<UUID>
  validadoPor?: Pick<Usuario, 'id' | 'nome'>
  validadoEm: Nullable<ISODateString>
  motivoRejeicao: Nullable<string>
  criadoEm: ISODateString
}

// ─────────────────────────────────────────────────────────────────────────────
// G5 — CONDICIONANTES
// ─────────────────────────────────────────────────────────────────────────────

export interface Condicionante {
  id: UUID
  tenantId: UUID
  processoId: UUID
  descricao: string
  numeroCondicionante: Nullable<string>
  tipo: TipoCondicionante
  status: StatusCondicionante
  periodicidade: PeriodicidadeCondicionante
  intervaloDias: Nullable<number>
  prazoCumprimento: Nullable<DateString>
  proximoVencimento: Nullable<DateString>
  evidenciaExigida: Nullable<string>
  documentoEvidenciaId: Nullable<UUID>
  documentoEvidencia?: Pick<Documento, 'id' | 'nome' | 'status'>
  responsavelId: Nullable<UUID>
  responsavel?: Pick<Usuario, 'id' | 'nome'>
  gerarTarefaAuto: boolean
  diasAlertaAntes: number[]
  cumpridaEm: Nullable<ISODateString>
  dispensadoPorId: Nullable<UUID>
  motivoDispensa: Nullable<string>
  dispensadoEm: Nullable<ISODateString>
  criadoEm: ISODateString
  atualizadoEm: ISODateString
  ciclos?: CicloCondicionante[]
}

export interface CicloCondicionante {
  id: UUID
  condicionanteId: UUID
  numeroCiclo: number
  periodoInicio: DateString
  periodoFim: DateString
  status: StatusCondicionante
  documentoEvidenciaId: Nullable<UUID>
  observacoes: Nullable<string>
  cumpridoEm: Nullable<ISODateString>
  cumpridoPorId: Nullable<UUID>
  criadoEm: ISODateString
}

// ─────────────────────────────────────────────────────────────────────────────
// G6 — TAREFAS
// ─────────────────────────────────────────────────────────────────────────────

export interface Tarefa {
  id: UUID
  tenantId: UUID
  empreendimentoId: UUID
  empreendimento?: Pick<Empreendimento, 'id' | 'nome' | 'cidade' | 'estado'>
  processoId: Nullable<UUID>
  condicionanteId: Nullable<UUID>
  cicloCondicionanteId: Nullable<UUID>
  documentoId: Nullable<UUID>
  titulo: string
  descricao: Nullable<string>
  status: StatusTarefa
  prioridade: PrioridadeTarefa
  origem: OrigemTarefa
  regraOrigemId: Nullable<UUID>
  responsavelId: Nullable<UUID>
  responsavel?: Pick<Usuario, 'id' | 'nome' | 'email'>
  criadorId: UUID
  dataVencimento: Nullable<ISODateString>
  dataConclusao: Nullable<ISODateString>
  dataEscalonamento: Nullable<ISODateString>
  escaladoParaId: Nullable<UUID>
  observacoesConclusao: Nullable<string>
  criadoEm: ISODateString
  atualizadoEm: ISODateString
  evidencias?: EvidenciaTarefa[]
}

export interface EvidenciaTarefa {
  id: UUID
  tarefaId: UUID
  tipo: TipoEvidencia
  descricao: Nullable<string>
  documentoVersaoId: Nullable<UUID>
  arquivoChaveS3: Nullable<string>
  arquivoNome: Nullable<string>
  textoLivre: Nullable<string>
  url: Nullable<string>
  enviadoPorId: UUID
  criadoEm: ISODateString
}

// ─────────────────────────────────────────────────────────────────────────────
// G7 — COMPLIANCE E ALERTAS
// ─────────────────────────────────────────────────────────────────────────────

export interface ComplianceSnapshot {
  id: UUID
  tenantId: UUID
  empreendimentoId: UUID
  indiceConformidade: number
  statusCompliance: StatusCompliance
  documentosValidos: number
  documentosTotal: number
  processosRegulares: number
  processosTotal: number
  condicionantesCumpridas: number
  condicionantesAtivas: number
  detalhes: Nullable<ComplianceDetalhes>
  calculadoEm: ISODateString
}

export interface ComplianceDetalhes {
  documentos: { validos: number; total: number; percentual: number }
  processos: { regulares: number; total: number; percentual: number }
  condicionantes: { cumpridas: number; total: number; percentual: number }
  alertas: Array<{ tipo: string; descricao: string; nivel: NivelAlerta }>
}

export interface Alerta {
  id: UUID
  tenantId: UUID
  empreendimentoId: Nullable<UUID>
  tipo: TipoAlerta
  nivel: NivelAlerta
  titulo: string
  mensagem: string
  entidadeTipo: Nullable<string>
  entidadeId: Nullable<UUID>
  dados: Nullable<Record<string, unknown>>
  emailEnviado: boolean
  emailEnviadoEm: Nullable<ISODateString>
  wppEnviado: boolean
  wppEnviadoEm: Nullable<ISODateString>
  criadoEm: ISODateString
  lido?: boolean
  lidoEm?: Nullable<ISODateString>
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DE API
// ─────────────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: UUID
  tenantId: UUID
  perfil: PerfilUsuario
  empreendimentoIds: Nullable<UUID[]>
  iat: number
  exp: number
}

export interface UploadUrlRequest {
  documentoId: UUID
  nomeArquivo: string
  mimeType: string
  tamanhoBytes: number
  hashSha256: string
}

export interface UploadUrlResponse {
  uploadUrl: string
  uploadFields: Record<string, string>
  chaveS3: string
  expiraEm: ISODateString
}

export interface ComplianceRede {
  indiceGeral: number
  statusGeral: StatusCompliance
  totalEmpreendimentos: number
  distribuicao: {
    regular: number
    atencao: number
    critico: number
    emergencia: number
  }
  calculadoEm: ISODateString
}
