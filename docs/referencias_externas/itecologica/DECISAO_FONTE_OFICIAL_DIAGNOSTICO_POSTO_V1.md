# DECISAO_FONTE_OFICIAL_DIAGNOSTICO_POSTO_V1

## Objetivo

Definir qual e a fonte correta do diagnostico maduro que deve ser transplantado para o `Posto`, evitando copiar uma camada incompleta ou desatualizada.

## Decisao fechada

O transplante para o `Posto` deve usar uma **fonte composta**, com papeis claros:

1. `INTERFACE/enviro-clarity-main/`
   Papel: **fonte-mãe metodologica e de UX do diagnostico**.

2. `ITECOLOGICA/backend/supabase/functions/_shared/official-diagnostic.ts`
   Papel: **fonte canonica em producao do contrato oficial atual**.

3. `ITECOLOGICA/backend/domain/diagnostic/`
   Papel: **alvo modular de consolidacao e destino de evolucao do motor**.

Isso significa:

- o `enviro-clarity-main` e a origem mais madura da inteligencia de diagnostico
- a `ITECOLOGICA` e quem hoje materializa essa inteligencia no fluxo oficial vivo
- o `Posto` nao deve transplantar apenas a UI nem apenas a copia produtiva isolada
- o `Posto` deve receber o **motor oficial + contrato oficial + plano de execucao oficial**

## Leitura objetiva das fontes

### 1. Fonte-mãe metodologica

Arquivos centrais:

- [INTERFACE/enviro-clarity-main/src/lib/diagnostic-engine.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/diagnostic-engine.ts)
- [INTERFACE/enviro-clarity-main/src/lib/diagnostic-rules.ts](/home/guilherme/Projetos%20VS%20CODE/INTERFACE/enviro-clarity-main/src/lib/diagnostic-rules.ts)

Forca principal:

- concentracao da logica original de regras
- classificacao de risco
- obrigacoes
- servicos recomendados
- estrategia de regularizacao

Limite:

- nasceu como camada de prototipo e de interface
- nao e, sozinha, a trilha oficial hoje materializada no fluxo `ITECOLOGICA -> Posto`

### 2. Fonte canonica operacional atual

Arquivo central:

- [ITECOLOGICA/backend/supabase/functions/_shared/official-diagnostic.ts](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/supabase/functions/_shared/official-diagnostic.ts)

Forca principal:

- e a implementacao viva em producao
- gera `canonical_diagnosis_json`
- gera `official_diagnostic_result_json`
- gera `official_execution_plan_json`
- e consumida pela edge function oficial `generate-canonical-diagnosis`

Limite:

- ainda e uma copia concentrada
- nao e a forma final mais limpa para evolucao de longo prazo

### 3. Alvo correto de consolidacao

Arquivos centrais:

- [ITECOLOGICA/backend/domain/diagnostic/official-diagnostic-engine.ts](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/domain/diagnostic/official-diagnostic-engine.ts)
- [ITECOLOGICA/backend/domain/diagnostic/official-execution-plan.ts](/home/guilherme/Projetos%20VS%20CODE/ITECOLOGICA/backend/domain/diagnostic/official-execution-plan.ts)

Forca principal:

- separacao por dominio
- contrato tipado
- melhor caminho para promover o motor a modulo real do sistema central

Limite:

- ainda depende de fechamento da unificacao com a fonte `_shared/`

## O que o `Posto` deve receber

O `Posto` deve absorver estes 3 blocos:

1. `official_diagnostic_result`
   Papel: leitura final do caso aprovado.

2. `official_execution_plan`
   Papel: tradutor oficial de diagnostico para operacao.

3. materializacao operacional
   Papel: converter diagnostico em:
   - tarefas
   - prazos
   - monitoramentos
   - documentos requeridos
   - observacoes iniciais

## Regra de implementacao

### Nao fazer

- nao transplantar apenas a pagina do `enviro`
- nao transplantar apenas a edge function `_shared/` sem modularizacao
- nao recriar um terceiro motor dentro do `Posto`

### Fazer

- usar o `enviro` como referencia metodologica e semantica
- usar a saida oficial da `ITECOLOGICA` como contrato de integracao
- materializar esse contrato dentro do `Posto`
- promover a evolucao futura para o domain layer modular

## Fonte oficial para o proximo passo

Para a implantacao no `Posto`, a ordem correta de referencia e:

1. `ITECOLOGICA/backend/supabase/functions/_shared/official-diagnostic.ts`
   Motivo: e a verdade operacional hoje.

2. `ITECOLOGICA/backend/domain/diagnostic/`
   Motivo: e o destino correto da consolidacao.

3. `INTERFACE/enviro-clarity-main/src/lib/`
   Motivo: serve como fonte-mãe para validar metodo, regra e cobertura funcional.

## Consequencia pratica

A decisao correta nao e:

- "copiar o diagnostico do CRM"

Nem:

- "copiar a tela do enviro"

A decisao correta e:

- **promover para o Posto o contrato oficial de diagnostico que hoje a ITECOLOGICA ja gera, validando a metodologia contra a fonte-mãe do enviro**

## Proximo passo tecnico

O proximo passo deve ser:

1. definir o payload oficial `official_diagnostic_result` dentro do handoff para o `Posto`
2. definir o payload oficial `official_execution_plan`
3. persistir isso no `IntegracaoEvento` do `Posto`
4. materializar o plano em `tarefas`, `prazos`, `monitoramentos` e `documentos`

## Decisao final

`enviro-clarity-main` e a origem mais madura da inteligencia.

`ITECOLOGICA/_shared/official-diagnostic.ts` e a fonte canonica viva do fluxo oficial.

`ITECOLOGICA/backend/domain/diagnostic/` e o destino correto da consolidacao.

O `Posto` deve ser implantado a partir dessa composicao, e nao de uma unica camada isolada.
