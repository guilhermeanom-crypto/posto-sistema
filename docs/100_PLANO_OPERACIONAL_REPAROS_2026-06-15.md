# 100. Plano Operacional de Reparos do Sistema

Data: 2026-06-15

## 1. Objetivo

Transformar a auditoria do estado atual em uma sequencia de execucao clara para:

1. recuperar confianca tecnica;
2. fechar os furos que nao podem passar;
3. estabilizar a evolucao do core;
4. preparar a frente normativa para operar com dado real.

Este documento e o plano de ataque principal a partir de 15/jun/2026.

## 2. Principios de execucao

- nao abrir nova frente grande de produto antes de restaurar a confianca da API;
- toda correcao relevante sai com criterio de aceite e evidencia;
- nada de carga normativa real sem `dry-run`, idempotencia e auditoria;
- separar claramente `bug`, `divida arquitetural`, `gap operacional` e `gap normativo`;
- tratar codigo e documentacao como uma unica linha de execucao.

## 3. Frentes de trabalho

### Frente A - Fundacao tecnica

Escopo:

- harness de testes da API;
- isolamento de ambiente;
- scripts `unit`, `integration`, `e2e`;
- cleanup dos testes;
- CI local previsivel.

### Frente B - Core e arquitetura

Escopo:

- convergencia `LicencaAmbiental` x `Processo`;
- entidades operacionais sem `empreendimentoId`;
- modulos grandes e com baixa seguranca de manutencao;
- sessoes, auditoria e consistencia de dados.

### Frente C - Cobertura e confianca

Escopo:

- modulos criticos sem teste;
- tenant isolation;
- smoke tests de fluxos principais;
- criterios minimos para regressao.

### Frente D - Base normativa e implantacao real

Escopo:

- modulo `importacoes`;
- validacao de CSV;
- execucao idempotente;
- auditoria de lote;
- piloto de carga normativa.

## 4. Ordem de execucao

### Fase 0 - Congelamento e baseline

Duracao sugerida: `0,5 sprint`

Entregaveis:

- backlog unico de reparos priorizado;
- fotografia do estado atual (`models`, `migrations`, `modulos`, `testes`);
- classificacao por gravidade e frente.

Criterio de aceite:

- todos os furos criticos e altos estao num backlog unico;
- o plano deixa de depender de leitura cruzada de docs antigos.

### Fase 1 - Restaurar confianca tecnica

Duracao sugerida: `1 sprint`

Objetivo:

Fazer a API voltar a ter uma esteira de validacao confiavel.

Entregaveis:

1. corrigir o harness de integracao da API;
2. isolar o ambiente de teste de `apps/api/.env`;
3. separar `test:unit`, `test:integration` e `test:e2e`;
4. blindar `beforeAll`/`afterAll` para falhar limpo;
5. documentar bootstrap minimo de banco/redis para testes.

Criterio de aceite:

- `@repo/api test` executa de forma repetivel;
- falha de infra nao gera erro cascata;
- `test:unit` roda unidade de verdade;
- `test:integration` nao depende de comportamento implicito do ambiente.

Dependencias:

- nenhuma.

Status em 2026-06-15:

- harness de teste da API corrigido com `vitest.config.ts` dedicado;
- `test:unit` passou a rodar apenas suites hermeticas;
- `test` e `test:integration` ficaram isolados por `RUN_API_INTEGRATION_TESTS=1`;
- teardowns de integracao foram blindados para evitar erro cascata quando o bootstrap falha;
- validacao real executada: `25` arquivos e `408` testes passaram com PostgreSQL/Redis acessiveis.

Conclusao operacional:

- o principal ruido restante nesta frente nao era bug funcional da API;
- em ambiente restrito, sem liberacao de TCP local para `localhost:5432` e `localhost:6379`, a suite pode aparentar falha de banco mesmo com a infraestrutura saudavel;
- a Fase 1 fica tecnicamente encaminhada e apta a encerrar apos consolidar esse contrato na rotina do time.

### Fase 2 - Fechar furos que nao podem passar

Duracao sugerida: `1 a 2 sprints`

Objetivo:

Eliminar os riscos que comprometem operacao, leitura de dominio ou integridade futura.

Entregaveis:

1. decisao arquitetural formal para `LicencaAmbiental` x `Processo`;
2. mapa de convergencia `Tanque/Bomba/TesteEstanqueidade` x modelo alvo;
3. plano para entidades sem `empreendimentoId` proprio;
4. revisao dos indices e integridade de sessao/auditoria ainda pendentes;
5. reducao de acoplamento em modulos gigantes prioritarios.

Criterio de aceite:

- decisoes criticas aprovadas e registradas;
- backlog arquitetural deixa de estar "aberto sem dono";
- migrations necessarias ficam explicitadas antes da execucao.

Dependencias:

- Fase 1 concluida.

### Fase 3 - Cobertura dos modulos mais perigosos

Duracao sugerida: `2 sprints`

Objetivo:

Subir a confianca do sistema nos modulos em que hoje um bug pode passar sem barreira.

Ordem recomendada:

1. `integracoes`
2. `portal`
3. `onboarding`
4. `outorga-hidrica`
5. `regulatorio-urbano`
6. `logistica-reversa`
7. `anp-inmetro`
8. `equipamentos`
9. `tenants`
10. `alertas`

Padrao de execucao por modulo:

1. smoke test de rota;
2. validacao de tenant isolation;
3. fluxo feliz;
4. erros de contrato e permissao;
5. refatoracao so depois da cobertura minima.

Criterio de aceite:

- modulos criticos deixam de estar sem rede de seguranca;
- a cobertura sobe de forma mensuravel;
- regressao cross-tenant passa a ter suite dedicada onde fizer sentido.

Dependencias:

- Fase 1 concluida;
- Fase 2 em andamento ou concluida.

### Fase 4 - Productizar a frente normativa

Duracao sugerida: `2 sprints`

Objetivo:

Tirar a implantacao normativa do papel e transformar em capacidade real do produto.

Entregaveis:

1. criar modulo `importacoes`;
2. implementar:
   - `POST /api/v1/importacoes/validar`
   - `POST /api/v1/importacoes/executar`
   - `GET /api/v1/importacoes/:importacaoId`
   - `GET /api/v1/importacoes/:importacaoId/erros`
3. suportar `DRY_RUN` e `EXECUCAO_REAL`;
4. registrar hash, operador, resumo e erros por lote;
5. bloquear dependencia quebrada antes da escrita.

Primeiro lote recomendado:

1. `01_orgaos_reguladores.csv`
2. `02_tipos_documento.csv`
3. `03_tipos_processo.csv`
4. `04_fases_tipo_processo.csv`
5. `05_requisitos_tipo_processo.csv`
6. `06_obrigacoes_regulatorias.csv`
7. `07_limites_parametros.csv`

Criterio de aceite:

- base normativa mestre entra por importacao controlada;
- mesma carga nao duplica registros;
- relatorio por linha existe;
- erro parcial fica auditado.

Dependencias:

- Fase 1 concluida;
- alinhamentos principais da Fase 2 fechados.

### Fase 5 - Piloto real controlado

Duracao sugerida: `1 sprint`

Objetivo:

Validar o sistema com dado real de um recorte pequeno antes de escalar.

Entregaveis:

- tenant piloto definido;
- recorte geografico definido;
- lote minimo de carga real executado;
- validacao ponta a ponta de:
  - processo
  - documento
  - licenca/condicionante
  - portal
  - alertas
  - score/snapshot

Criterio de aceite:

- pelo menos um fluxo real roda sem depender de seed demo;
- o que falhar vira backlog priorizado e objetivo.

Dependencias:

- Fase 4 com MVP funcional.

### Fase 6 - Operacao e observabilidade

Duracao sugerida: `1 sprint`

Objetivo:

Fechar o ciclo para uso continuo, nao apenas para auditoria.

Entregaveis:

- observabilidade restante (`Sentry`, monitor de filas, runbooks);
- revisao de backup/restore;
- reconciliacao de documentacao com estado real;
- checklist de release e deploy.

Criterio de aceite:

- cada deploy tem evidencias;
- cada falha relevante tem trilha;
- cada operacao critica tem runbook.

Dependencias:

- Fases 1 a 5 suficientemente maduras.

## 5. Sprint plan sugerido

### Sprint 1 - Fundacao

Meta:

Restaurar confianca na API e organizar o backlog real.

Escopo:

- baseline;
- harness da API;
- scripts de teste separados;
- cleanup dos testes;
- doc de execucao minima dos testes.

Saida esperada:

- API testavel com previsibilidade.

### Sprint 2 - Arquitetura critica

Meta:

Fechar as decisoes que travam evolucao segura.

Escopo:

- `LicencaAmbiental` x `Processo`;
- mapa `empreendimentoId`;
- plano de convergencia do dominio tecnico;
- avaliacao dos modulos mais grandes.

Saida esperada:

- decisoes e migrations alvo registradas.

### Sprint 3 - Cobertura de alto risco

Meta:

Cobrir os modulos mais perigosos sem rede de seguranca.

Escopo:

- `integracoes`
- `portal`
- `onboarding`
- `outorga-hidrica`
- `regulatorio-urbano`

Saida esperada:

- primeira subida material da confianca funcional.

### Sprint 4 - Cobertura e importacoes MVP

Meta:

Entrar na frente normativa com produto minimamente executavel.

Escopo:

- concluir modulos criticos restantes de cobertura;
- subir `importacoes/validar`;
- subir `importacoes/executar` em `DRY_RUN`;
- auditar lote e erros por linha.

Saida esperada:

- importacao validavel sem escrita real.

### Sprint 5 - Importacao real e piloto

Meta:

Executar a primeira carga normativa estruturada.

Escopo:

- `EXECUCAO_REAL`;
- idempotencia;
- importacao dos CSVs estruturantes;
- tenant piloto;
- validacao ponta a ponta.

Saida esperada:

- primeira rodada real controlada.

### Sprint 6 - Operacao

Meta:

Fechar governanca de uso continuo.

Escopo:

- observabilidade restante;
- backup/restore;
- doc viva;
- checklist de release.

Saida esperada:

- sistema pronto para evoluir com menos risco.

## 6. Matriz de prioridade

### Critico

- harness da API;
- isolamento de ambiente de teste;
- cleanup fragil da suite;
- decisao `LicencaAmbiental` x `Processo`.

### Alto

- modulos sem cobertura de alto risco;
- entidades sem `empreendimentoId`;
- productizacao do modulo `importacoes`;
- carga normativa ainda dependente de planilha manual.

### Medio

- observabilidade restante;
- reconciliacao dos docs;
- extracao/refino de modulos grandes;
- melhorias da biblioteca documental.

## 7. RACI sugerido

### Responsavel tecnico

- define ordem de execucao;
- aprova decisoes arquiteturais;
- fecha aceite tecnico de cada fase.

### Responsavel de dominio

- valida regra regulatoria;
- aprova fontes oficiais;
- valida piloto real e aderencia operacional.

### Execucao de engenharia

- implementa testes, correcoes, migrations e modulo de importacao;
- atualiza docs operacionais ao fechar cada entrega.

## 8. Regra de aceite por entrega

Toda entrega relevante deve sair com:

1. codigo;
2. teste ou evidência objetiva;
3. impacto descrito;
4. rollback claro, quando aplicavel;
5. documentacao minima atualizada.

## 9. Primeiro lote de acao imediata

Se a execucao comecar agora, a ordem recomendada e:

1. corrigir harness da API;
2. separar `unit/integration/e2e`;
3. blindar `afterAll`;
4. formalizar decisao `LicencaAmbiental` x `Processo`;
5. abrir backlog tecnico do modulo `importacoes`.

## 10. Veredito operacional

O sistema ja esta construido. O trabalho agora e de consolidacao e confianca.

Em termos praticos:

- primeiro restauramos previsibilidade tecnica;
- depois fechamos os furos estruturais;
- em seguida aumentamos a cobertura dos modulos perigosos;
- so entao empurramos a frente normativa para carga real controlada.
