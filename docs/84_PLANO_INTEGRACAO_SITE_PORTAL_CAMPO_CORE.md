# 84. Plano de Integracao Site Portal Campo Core

## 1. Objetivo

Orquestrar a integracao ponta a ponta entre:

- `apps/site` como camada institucional e comercial;
- `apps/web` como sistema interno;
- `apps/web/portal` como area do cliente;
- `apps/web/equipe` como area de campo;
- `apps/api` como core transacional e de autorizacao.

Este plano nao substitui a auditoria estrutural ja concluida.

Ele inicia a proxima onda: consolidar as superficies externas como extensoes reais do produto, e nao apenas entradas visuais ou trilhas parciais.

## 2. Leitura executiva

Hoje o estado geral e este:

- `site -> sistema`: integrado em narrativa, entrada e posicionamento;
- `portal do cliente -> core`: parcialmente integrado e funcional em varios fluxos reais;
- `area de campo -> core`: parcialmente acoplada em OS, mas ainda majoritariamente demo/local;
- `cliente -> operacao interna -> campo`: jornada ainda incompleta em alguns fluxos.

Leitura pratica:

- a maior lacuna nao esta no `site`;
- a maior lacuna esta na `area de campo`;
- o `portal` ja tem base suficiente para consolidacao incremental;
- o `campo` exige integracao de produto de verdade.

## 3. Arquitetura desejada

Todas as superficies devem conversar com o mesmo ecossistema de:

- autenticacao e sessao;
- tenant;
- empreendimento ativo;
- perfis e permissoes;
- documentos;
- tarefas;
- checklists;
- ordens de servico;
- evidencias;
- mensagens;
- auditoria.

## 4. Estado atual por superficie

### 4.1 Site institucional

#### Estado atual

- direciona para acessos internos e externos;
- ja conversa em branding, narrativa e pontos de entrada;
- nao e o principal gargalo tecnico da integracao.

#### Risco atual

- baixo risco estrutural;
- risco maior de desalinhamento de promessa caso `portal` e `campo` nao entreguem o que o site comunica.

### 4.2 Portal do cliente

#### Estado atual

Ja possui integracao real com o core em:

- login com perfil `REPRESENTANTE_POSTO`;
- dashboard do empreendimento;
- documentos;
- compliance;
- alertas;
- tarefas;
- condicionantes;
- mensagens;
- checklists.

#### Lacunas observadas

- algumas jornadas ainda sao parciais;
- o canal de mensagens nao aparece claramente fechado no app interno;
- checklists do portal respondem itens, mas a jornada operacional completa depende do fluxo interno de consolidacao/finalizacao;
- existe fallback demo convivendo com o fluxo real.

#### Classificacao

- `integrado com lacunas de fechamento operacional`

### 4.3 Area de campo

#### Estado atual

- login proprio em cookie local;
- sessao separada do modelo de auth do sistema;
- painel, checklist, pendencias e evidencias majoritariamente estaticos;
- pagina de OS tenta consumir o core real, mas o login da equipe nao gera o token necessario.

#### Lacunas observadas

- auth fora do mesmo trilho do sistema;
- sem vinculo real garantido com `ANALISTA_CAMPO`, tenant e empreendimento;
- checklist de campo sem persistencia;
- evidencias sem upload real;
- pendencias sem escrita/leitura real;
- jornada de revisao interna ainda nao fechada.

#### Classificacao

- `superficie parcialmente prototipada, ainda nao integrada como modulo operacional real`

## 5. Principios de implementacao

- nao criar um segundo sistema de autenticacao para campo;
- nao duplicar modelos que ja existem no core;
- portal e campo devem ser consumidores controlados do mesmo dominio transacional;
- toda acao externa relevante deve gerar auditoria;
- toda informacao coletada em campo deve retornar ao fluxo interno como tarefa, evidencia, checklist, revisao ou pendencia;
- toda integracao nova deve preservar tenant, empreendimento e perfil.

## 6. Macroestrategia

Executar em 5 fases:

1. unificacao de identidade e sessao;
2. consolidacao do portal do cliente;
3. integracao operacional da area de campo;
4. fechamento das jornadas cruzadas cliente x operacao x campo;
5. gate final de validacao integrada.

## 7. Fases operacionais

### Fase 1. Unificacao de autenticacao e contexto

#### Objetivo

Colocar `portal` e `campo` no mesmo trilho de autenticacao, perfil e contexto do sistema.

#### Escopo

- revisar estrategia de sessao da area de campo;
- substituir cookie local de demo por auth real da API;
- garantir perfil correto para campo, preferencialmente `ANALISTA_CAMPO` ou papel equivalente do dominio;
- garantir resolucao de `tenantId`, `usuarioId` e `empreendimentoIds` no mesmo contrato ja usado pelo sistema;
- revisar se `portal` continua com fallback demo apenas para apresentacao controlada, sem contaminar fluxo real.

#### Critico nesta fase

- eliminar o desacoplamento entre `/equipe/login` e `getAccessToken`;
- impedir que uma superficie use auth fake enquanto outra usa auth real.

#### Criterio de pronto

- login de campo passa pela API;
- sessao de campo usa o mesmo modelo base de auth;
- portal e campo ficam coerentes no contrato de sessao.

### Fase 2. Consolidacao do portal do cliente

#### Objetivo

Fechar o que no portal ja existe, mas ainda nao retorna completamente para a operacao interna.

#### Escopo

- revisar mensagens do portal e criar/ajustar contrapartida interna para leitura e resposta;
- revisar fluxo de checklists do portal ate a consolidacao operacional;
- revisar reacoes internas a uploads de documentos do portal;
- revisar notificacoes e alertas para analistas responsaveis;
- separar claramente o que e `demo` e o que e `producao`.

#### Criterio de pronto

- cliente envia e operacao interna responde no mesmo fluxo;
- checklist do portal nao para no `upsert` de resposta;
- documentos enviados pelo portal entram no trilho operacional com rastreabilidade e follow-up.

### Fase 3. Integracao operacional da area de campo

#### Objetivo

Transformar a area de campo de superficie demo em modulo operacional conectado ao core.

#### Escopo

- ligar painel de campo a OS reais;
- vincular rota de trabalho ao usuario autenticado;
- ligar checklist de campo a `checklistExecucao` e `checklistResposta` reais, ou criar trilha especifica de execucao de campo se a semantica exigir;
- ligar evidencias a upload real, storage, metadata e auditoria;
- ligar pendencias a tarefas/workflow reais;
- definir revisao interna das coletas de campo.

#### Ordem recomendada interna

1. OS reais
2. checklist real
3. evidencias reais
4. pendencias reais
5. revisao e aceite interno

#### Criterio de pronto

- o campo consegue executar uma OS real;
- registrar checklist real;
- anexar evidencia real;
- gerar ou atualizar pendencia real;
- devolver a execucao para revisao interna.

### Fase 4. Jornadas cruzadas

#### Objetivo

Costurar as transicoes entre cliente, operacao interna e campo.

#### Fluxos prioritarios

- documento enviado pelo cliente -> analise interna -> devolutiva;
- checklist do cliente -> pendencia/tarefa interna;
- OS atribuida ao campo -> coleta -> evidencia -> revisao;
- achado de campo -> pendencia -> tarefa -> retorno ao cliente quando aplicavel;
- mensagem do cliente -> tratamento interno -> resposta.

#### Criterio de pronto

- os fluxos deixam de ser telas isoladas e passam a formar jornadas rastreaveis.

### Fase 5. Gate final de validacao integrada

#### Objetivo

Validar a jornada unificada do produto.

#### Gate minimo

- auth e perfil corretos para portal e campo;
- documento do portal chega ao fluxo interno;
- mensagem do portal recebe contrapartida interna;
- OS real aparece na area de campo;
- checklist de campo persiste;
- evidencia de campo persiste;
- pendencia criada em campo ou portal reaparece no sistema interno;
- trilha de auditoria coerente.

## 8. Priorizacao por impacto

| Prioridade | Frente | Motivo |
| --- | --- | --- |
| 1 | Auth da area de campo | Hoje e o maior ponto fora do ecossistema real |
| 2 | OS reais na area de campo | E a porta de entrada da operacao executada |
| 3 | Checklist de campo | Fecha coleta operacional e habilita workflow |
| 4 | Evidencias e pendencias de campo | Fecha rastreabilidade da execucao |
| 5 | Mensagens internas do portal | Fecha comunicacao cliente x operacao |
| 6 | Consolidacao dos checklists do portal | Fecha o ciclo do cliente dentro do core |

## 9. Estimativa relativa de esforco

### Baixo a medio

- ajustes de navegacao e estados de fallback;
- limpeza de demos residuais no portal;
- documentacao e contratos operacionais.

### Medio

- fechar mensageria interna do portal;
- consolidar resposta de checklist do portal com workflow completo;
- alinhar notificacoes e trilha de auditoria.

### Alto

- unificar auth da area de campo;
- substituir superficies estaticas da area de campo por fluxo real;
- integrar evidencias, pendencias e revisao operacional.

## 10. Riscos principais

- tentar integrar campo sem unificar auth primeiro;
- criar estruturas paralelas para checklist/evidencia em vez de reutilizar o dominio existente;
- manter demos convivendo silenciosamente com fluxos reais;
- ligar UI sem fechar ownership de tarefa, revisao e auditoria.

## 11. Arquivos e modulos mais provaveis por fase

### Auth e contexto

- `apps/web/src/app/equipe/login/*`
- `apps/web/src/app/equipe/(equipe)/layout.tsx`
- `apps/web/src/lib/auth.ts`
- `apps/api/src/modules/auth/*`

### Portal

- `apps/web/src/app/portal/(portal)/*`
- `apps/web/src/app/api/portal/*`
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/checklists/checklists.service.ts`

### Campo

- `apps/web/src/app/equipe/(equipe)/*`
- `apps/api/src/modules/operacao/ordens-servico.*`
- `apps/api/src/modules/checklists/*`
- `apps/api/src/modules/tarefas/*`
- `apps/api/src/modules/documentos/*`
- `apps/api/src/modules/equipamentos/*`

## 12. Definicao de pronto desta onda

Esta onda sera considerada concluida quando:

- `site`, `sistema`, `portal` e `campo` funcionarem como superficies do mesmo produto;
- o `portal` deixar de ser apenas semi-integrado;
- a `area de campo` deixar de depender de sessao fake e dados estaticos;
- jornadas de cliente, operacao e campo ficarem rastreaveis de ponta a ponta;
- o time puder demonstrar os fluxos como sistema unico, e nao como acessos paralelos.

## 13. Proxima acao recomendada

Iniciar imediatamente pela `Fase 1`, com um pacote unico para:

- remover o login demo/local da area de campo;
- plugar a area de campo ao auth real;
- alinhar o papel de campo ao modelo de perfis do sistema;
- destravar o consumo real de OS pela superficie `/equipe`.
