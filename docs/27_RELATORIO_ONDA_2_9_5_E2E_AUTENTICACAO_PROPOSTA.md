# 27. Relatório da Onda 2.9.5 — E2E, Autenticação e Validação Final da Proposta Comercial

## 1. Resumo

A Onda 2.9.5 concluiu a validação end-to-end da Proposta Comercial com autenticação real no ambiente local.

Escopo validado:

- login/autenticação com credencial demo;
- proteção de rotas sem sessão;
- acesso autenticado à listagem `/comercial/propostas`;
- abertura do detalhe de proposta persistida;
- validação visual do detalhe;
- confirmação de ausência de campos sensíveis na UI;
- checagem do payload público da API;
- execução de `typecheck` e testes da API.

Escopo não executado:

- nova funcionalidade;
- alteração de Prisma;
- alteração de seed;
- nova migration;
- PDF;
- contrato;
- ordem de serviço;
- financeiro;
- handoff;
- próxima onda.

## 2. Credenciais e Ambiente

Credenciais de desenvolvimento usadas:

- `admin@postodemo.com.br`
- senha `Demo@1234`

Ambiente confirmado:

- `web` em `http://localhost:3000`
- `api` em `http://localhost:3001/api/v1`
- PostgreSQL e Redis locais ativos

## 3. Fluxo Autenticado Validado

Proposta utilizada na validação:

- id `7b9d4a37-3d5b-4b8b-a58a-aae92ef3bc3f`

Fluxo confirmado:

1. login realizado com sucesso na API;
2. acesso autenticado à listagem `/comercial/propostas`;
3. proposta localizada na listagem;
4. navegação para `/comercial/propostas/7b9d4a37-3d5b-4b8b-a58a-aae92ef3bc3f`;
5. carregamento completo da tela de detalhe;
6. link de voltar retornando à listagem.

## 4. Validação Visual do Detalhe

Na página de detalhe foi confirmado que aparecem:

- cabeçalho da proposta;
- `Status`;
- `Origem`;
- `Data de Criação`;
- `Data de Validade`;
- `Total Mínimo`;
- `Total Base`;
- `Total Máximo`;
- bloco `Dados Comerciais`;
- bloco `Diagnóstico Resumido`;
- bloco `Itens da Proposta`;
- link `← Voltar para Propostas`.

Valores observados durante a validação:

- número `PROP-2026-110956D6`
- status `RASCUNHO`
- origem `TRIAGEM_CNAE`
- município/UF `Goiânia/GO`

## 5. Campos Sensíveis Auditados

Foi confirmado que **não** aparecem na UI do detalhe:

- `inputSnapshot`
- `resultadoSnapshot`
- `snapshotCatalogo`
- `observacoesInternas`
- `custoInternoEstimado`
- `margemLucroAlvo`
- `valorReferenciaHora`
- `metadata`

Também foi validado o payload público de `GET /api/v1/comercial/propostas/:id`, sem exposição desses campos.

## 6. Rotas Protegidas sem Sessão

Sem sessão autenticada, o app redireciona com `307 Temporary Redirect` para `/login`:

- `/comercial/triagem` → `/login?from=%2Fcomercial%2Ftriagem`
- `/comercial/propostas` → `/login?from=%2Fcomercial%2Fpropostas`
- `/comercial/propostas/7b9d4a37-3d5b-4b8b-a58a-aae92ef3bc3f` → `/login?from=%2Fcomercial%2Fpropostas%2F7b9d4a37-3d5b-4b8b-a58a-aae92ef3bc3f`

Conclusão:

- a proteção por cookie/sessão do frontend está funcionando conforme o padrão atual do app.

## 7. Validações Executadas

| Comando | Resultado |
|---|---|
| `npm run typecheck` em `apps/api` | Passou |
| `npm test` em `apps/api` | Passou |

Resultado observado da suíte:

- `2` arquivos de teste passados
- `9` testes passados

## 8. Status Final

A Onda 2.9.5 foi considerada concluída com:

- autenticação validada;
- rotas protegidas validadas;
- detalhe da proposta validado visualmente;
- campos sensíveis preservados;
- backend validado por tipagem e testes.
