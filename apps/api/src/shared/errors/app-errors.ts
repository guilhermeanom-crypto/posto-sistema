// ─────────────────────────────────────────────────────────────────────────────
// HIERARQUIA DE ERROS DA APLICAÇÃO
// Cada erro mapeia para um HTTP status code específico.
// Services lançam estes erros; a route layer os captura e formata a resposta.
// ─────────────────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public override readonly message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/** 400 — Dados de entrada inválidos */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, details)
  }
}

/** 401 — Não autenticado */
export class UnauthorizedError extends AppError {
  constructor(message = 'Autenticação necessária') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

/** 403 — Autenticado mas sem permissão */
export class ForbiddenError extends AppError {
  constructor(message = 'Sem permissão para realizar esta ação') {
    super(message, 'FORBIDDEN', 403)
  }
}

/** 404 — Recurso não encontrado */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} com ID "${id}" não encontrado` : `${resource} não encontrado`
    super(msg, 'NOT_FOUND', 404)
  }
}

/** 409 — Violação de regra de negócio (estado inválido, duplicidade) */
export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, code, 409)
  }
}

/** 422 — Dados válidos mas inaplicáveis no contexto atual */
export class UnprocessableError extends AppError {
  constructor(message: string, code = 'UNPROCESSABLE') {
    super(message, code, 422)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CÓDIGOS DE ERRO ESPECÍFICOS DE DOMÍNIO
// ─────────────────────────────────────────────────────────────────────────────

export class ProcessoFaseInvalidaError extends UnprocessableError {
  constructor(faseAtual: number, faseSolicitada: number) {
    super(
      `Não é possível avançar da fase ${faseAtual} para a fase ${faseSolicitada}`,
      'PROCESSO_FASE_INVALIDA',
    )
  }
}

export class ProcessoStatusInvalidoError extends UnprocessableError {
  constructor(statusAtual: string, statusSolicitado: string) {
    super(
      `Transição de status "${statusAtual}" para "${statusSolicitado}" não é permitida`,
      'PROCESSO_TRANSICAO_INVALIDA',
    )
  }
}

export class ProcessoRequisitoPendenteError extends ConflictError {
  constructor(quantidadePendentes: number) {
    super(
      `Existem ${quantidadePendentes} requisito(s) obrigatório(s) pendente(s) nesta fase`,
      'PROCESSO_REQUISITO_PENDENTE',
    )
  }
}

export class DocumentoVersaoJaAtivaError extends ConflictError {
  constructor() {
    super('Este documento já possui uma versão ativa aprovada', 'DOCUMENTO_VERSAO_JA_ATIVA')
  }
}

export class DocumentoVencidoError extends ConflictError {
  constructor() {
    super('Documento com data de validade no passado não pode ser aprovado', 'DOCUMENTO_VENCIDO')
  }
}

export class CondicionanteDispensaRequerAprovacaoError extends ForbiddenError {
  constructor() {
    super('A dispensa de condicionante requer perfil Coordenador ou superior')
  }
}

export class TarefaBloqueadaError extends ConflictError {
  constructor() {
    super('Esta tarefa está bloqueada por dependências não concluídas', 'TAREFA_BLOQUEADA')
  }
}

export class TarefaStatusInvalidoError extends UnprocessableError {
  constructor(statusAtual: string, acaoSolicitada: string) {
    super(
      `Não é possível executar "${acaoSolicitada}" em tarefa com status "${statusAtual}"`,
      'TAREFA_TRANSICAO_INVALIDA',
    )
  }
}

export class TarefaDependenciaCiclicoError extends ConflictError {
  constructor() {
    super('Dependência cria um ciclo. Tarefas não podem depender de si mesmas', 'TAREFA_CICLO_DEPENDENCIA')
  }
}

export class UploadNaoConfirmadoError extends ConflictError {
  constructor() {
    super('Upload não confirmado. O arquivo ainda não foi recebido pelo storage', 'UPLOAD_NAO_CONFIRMADO')
  }
}

export class HashInvalidoError extends ConflictError {
  constructor() {
    super('O hash do arquivo não corresponde ao arquivo recebido (possível corrupção)', 'HASH_INVALIDO')
  }
}
