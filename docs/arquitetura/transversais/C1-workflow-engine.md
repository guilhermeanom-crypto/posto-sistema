# Camada Transversal C1 — Workflow Engine

> Motor de processo regulatório genérico. Consumido por **M1, M5 (parcial), M6, M7, M8, M10**.

## Decisão transversal nº1
Motor opera em torno de 3 conceitos:
1. **TipoProcesso** (catálogo): declara fases e regras.
2. **Processo** (instância): estado vivo.
3. **TransicaoProcesso** (evento): cada mudança de fase com guarda + payload + efeitos.

Cada `TipoProcesso` carrega definição de máquina de estados **versionada** (JSON declarativo + handlers TS por categoria). Mudança no catálogo gera nova versão; processos existentes ficam *pinned* na versão original.

## Modelo (deltas)

```prisma
model DefinicaoFluxoProcesso {
  id String @id
  tipoProcessoId String; versao Int
  vigenteDesde DateTime @db.Date; vigenteAte DateTime? @db.Date
  estados Json                  // [{nome, terminal, descricao}]
  transicoes Json               // [{de, para, gatilho, guardas, efeitos}]
  papeisPermitidos Json         // {transicao: [perfilUsuario]}
  @@unique([tipoProcessoId, versao])
}

model TransicaoProcesso {
  id String @id
  processoId String; definicaoFluxoVersao Int
  estadoAnterior String; estadoNovo String
  gatilho String                // MANUAL | TEMPORAL | EVENTO_EXTERNO | SISTEMA
  payload Json?
  guardasAvaliadas Json         // {regra, resultado, motivo}[]
  executadoPorId String?
  executadoEm DateTime
  efeitosAplicados Json[]
  idempotencyKey String? @unique
}
```

## Avaliador de transição

```
funcao transicionar(processoId, transicaoNome, payload, executor):
  processo = fetch(processoId)
  definicao = fetch(processo.tipoProcessoId, processo.fluxoVersaoFixada)
  transicao = encontrar(definicao.transicoes, de=processo.fase, nome=transicaoNome)
  
  validar(transicao, executor.perfil em definicao.papeisPermitidos[transicaoNome])
  
  para cada guarda em transicao.guardas:
    resultado = avaliar(guarda, processo, payload)
    registrar(resultado)
    se !resultado: erro("guarda falhou: " + guarda.nome)
  
  transacao_db:
    processo.fase = transicao.para
    gravar(TransicaoProcesso)
    para cada efeito em transicao.efeitos:
      aplicar(efeito, processo)
      registrar(efeito)
    gravar(AuditLog)
  
  publicar("processo.transicionado")
```

## Handlers de efeito (registráveis)
- `criar_tarefa`
- `criar_condicionante`
- `criar_prazo_processual` (M5)
- `notificar_papel`
- `propagar_estado` (ex.: licença emitida → marca empreendimento)
- `gerar_renovacao` (cria processo filho)
- `bloquear_modulo` (ex.: embargo bloqueia M3)

## Regras
- **Versionamento imutável**: processo nasce vinculado a `definicaoFluxoVersao`; nova versão do catálogo não afeta processos antigos.
- **Idempotência**: `idempotencyKey` no `TransicaoProcesso`.
- **Auditoria**: toda transição vira `AuditLog`.
- **Reverso**: não permitido nativamente; criar transição reversa explícita (ex.: `desfazer_protocolo`).

## Casos de borda
1. Transição automática (worker) durante edição manual: lock otimista no processo.
2. Catálogo alterado retroativamente: bloquear (criar nova versão).
3. Tipo de processo deletado: marcar inativo, manter processos órfãos consultáveis.
4. Migração legada (LicencaAmbiental → Processo): backfill cria histórico sintético com flag.

## Perguntas abertas
1. Editor visual do fluxo (admin) — v1 ou v2?
2. Linguagem de guardas: TS puro ou DSL declarativa?
3. Notificação em transição: síncrona (worker fila) ou pub-sub?
