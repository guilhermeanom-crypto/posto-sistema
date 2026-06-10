# 33. Plano da Onda 3 - Handoff Comercial para Operacao

## 1. Resumo executivo

O objetivo da Onda 3 e criar uma ponte controlada entre a Proposta Comercial aprovada e a entrada efetiva na operacao, preservando rastreabilidade, seguranca de dados e separacao de responsabilidades.

Nao e recomendado iniciar diretamente por contrato, ordem de servico ou financeiro porque:

- a proposta aprovada ainda representa escopo comercial, nao compromisso juridico;
- nem toda proposta aprovada esta pronta para virar contrato ou cobranca;
- a operacao precisa receber um pacote inicial saneado, com checklist, responsavel e status proprios;
- o sistema atual ja possui entidades operacionais maduras, mas nenhuma delas representa bem essa transicao inicial.

Recomendacao principal:

- criar uma entidade de transicao propria para o handoff, preferencialmente `HandoffComercial`, vinculada a proposta aprovada e opcionalmente ao `Empreendimento`, sem substituir contrato, OS ou financeiro.

## 2. Estado atual

O MVP Comercial foi formalmente fechado na Onda 2.12 com as seguintes entregas:

- Triagem Comercial;
- Diagnostico por CNAE;
- Catalogo Comercial;
- Proposta Comercial persistida;
- Listagem de propostas;
- Detalhe de proposta;
- Edicao controlada de status, validade e observacoes comerciais;
- PDF da proposta;
- Compartilhamento assistido;
- Status `ENVIADA`.

Pendencias tecnicas herdadas:

- `PropostaComercial` ainda usa `raw SQL` temporario em parte do backend por pendencia de sincronizacao do Prisma Client;
- `GET /api/v1/comercial/catalogo/admin` pode ter desalinhamento de perfis;
- a listagem de propostas ainda nao possui filtros visuais avancados.

Conclusao do estado atual:

- o fluxo comercial ja consegue qualificar, propor, registrar, compartilhar e acompanhar negociacao;
- ainda nao existe um mecanismo formal para transformar uma proposta aprovada em demanda operacional auditavel.

## 3. Auditoria do sistema existente

### 3.1 Modelos e modulos encontrados

O projeto ja possui estrutura operacional relevante nos seguintes dominos:

- `Empreendimento`
- `Processo`
- `Tarefa`
- `Documento`
- `Condicionante`
- `ChecklistTemplate`
- `ChecklistExecucao`
- `LeadWhatsApp`
- `FollowUpLead`
- modulo `onboarding`
- modulo `crm`

Perfis existentes no schema que impactam a Onda 3:

- `SUPER_ADMIN`
- `ADMIN_TENANT`
- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `EXECUTIVO`
- `REPRESENTANTE_POSTO`

### 3.2 Rotas e servicos existentes que podem ser aproveitados

#### Comercial

- `POST /api/v1/comercial/diagnostico/cnae`
- `POST /api/v1/comercial/propostas`
- `GET /api/v1/comercial/propostas`
- `GET /api/v1/comercial/propostas/:id`
- `PATCH /api/v1/comercial/propostas/:id`
- `GET /api/v1/comercial/propostas/:id/pdf`

#### Onboarding

O modulo `onboarding` ja possui:

- rotas de wizard;
- importacao de empreendimentos;
- gap analysis por `empreendimentoId`;
- preview de orcamento operacional;
- geracao de tarefas.

Leitura arquitetural:

- o `onboarding` e util como etapa posterior do handoff;
- ele nao substitui o handoff inicial, porque pressupoe contexto operacional mais maduro e normalmente um `Empreendimento` ja estabelecido.

#### Tarefas

O modulo `tarefas` ja suporta:

- listagem;
- criacao;
- detalhe;
- atualizacao;
- iniciar;
- concluir;
- reatribuir;
- cancelar.

Leitura arquitetural:

- tarefas sao candidatas naturais para desdobramentos do handoff;
- nao sao boas como entidade raiz do handoff, porque representam unidades atomicas de trabalho.

#### Processos

O modulo `processos` ja suporta operacao regulatoria formal, com:

- listagem e detalhe;
- criacao;
- alteracao de status;
- fases e requisitos.

Leitura arquitetural:

- `Processo` e uma entidade operacional especifica;
- uma proposta comercial aprovada pode gerar um ou varios processos, ou ainda precisar de triagem documental antes disso;
- portanto, `Processo` e destino possivel do handoff, nao seu substituto.

#### Documentos

O modulo `documentos` ja suporta:

- criacao;
- upload;
- aprovacao/rejeicao;
- download;
- vinculos com `Empreendimento`, `Processo` e outros contextos.

Leitura arquitetural:

- o handoff pode futuramente abrir solicitacoes documentais iniciais;
- `Documento` nao e agregado suficiente para representar o pacote operacional de entrada.

#### Empreendimentos

O modulo `empreendimentos` ja oferece:

- cadastro e consulta;
- equipe por empreendimento;
- relacoes com processos, documentos, tarefas, checklists e comerciais.

Leitura arquitetural:

- `Empreendimento` e o principal candidato a relacionamento do handoff;
- nao deve ser a unica ancora do handoff, porque nem toda proposta aprovada chega com empreendimento pronto ou consolidado.

### 3.3 Telas existentes que podem ser aproveitadas

No frontend, ja existem rotas estruturadas para:

- `/comercial/propostas`
- `/comercial/propostas/[id]`
- `/empreendimentos`
- `/processos`
- `/tarefas`
- `/documentos`
- `/crm`
- `/onboarding`

Tambem existem telas em estado preliminar para:

- `/contratos`
- `/ordens-servico`
- `/financeiro`

Leitura arquitetural:

- `contratos`, `ordens-servico` e `financeiro` ainda nao representam dominos transacionais finais;
- por isso, nao sao destino adequado para o primeiro handoff da proposta aprovada.

## 4. Conceito de handoff

Handoff comercial para operacao deve significar:

- a criacao de um registro formal de transicao a partir de uma proposta aprovada;
- o transporte somente de dados saneados e operacionais necessarios;
- a separacao explicita entre aprovacao comercial e execucao operacional;
- a preservacao do vinculo com proposta, diagnostico, lead e eventual empreendimento;
- a preparacao para desdobramentos controlados em tarefas, documentos, planejamento e processos.

Definicao recomendada:

- uma proposta aprovada nao vira automaticamente contrato, financeiro ou OS completa;
- ela deve primeiro virar uma demanda operacional inicial auditavel.

Essa demanda operacional inicial deve conter, no minimo:

- proposta de origem;
- diagnostico de origem;
- lead/cliente de origem;
- empreendimento, se existir;
- servicos aprovados;
- escopo preliminar;
- observacoes comerciais liberadas para operacao;
- responsavel comercial;
- status inicial de implantacao;
- checklist inicial de pendencias;
- historico de auditoria.

## 5. Opcoes de arquitetura

### Opcao A - Reaproveitar entidade existente

Possiveis candidatas:

- `Empreendimento`
- `Processo`
- `Tarefa`
- `onboarding`
- `gap analysis`

Vantagens:

- menor quantidade de entidades novas;
- aproveitamento rapido de telas e servicos existentes;
- possibilidade de acelerar uma primeira entrega se o escopo fosse muito restrito.

Riscos:

- mistura precoce entre comercial e operacao real;
- obrigacao de encaixar a proposta em estruturas que foram desenhadas para outra etapa;
- maior chance de duplicar fluxo ou perder rastreabilidade;
- acoplamento indevido entre aprovacao comercial e objetos operacionais finais.

Conclusao da opcao A:

- nao recomendada como estrategia principal.

### Opcao B - Criar nova entidade de transicao

Sugestoes de nome:

- `HandoffComercial`
- `DemandaOperacional`
- `ImplantacaoComercial`
- `ProjetoOperacional`

Vantagens:

- separa com clareza o momento comercial do momento operacional;
- preserva rastreabilidade ponta a ponta;
- evita transformar proposta aprovada em contrato ou OS antes da hora;
- permite anexar responsavel, checklist, documentos e tarefas gradualmente;
- acomoda cenario com ou sem `Empreendimento` consolidado.

Riscos:

- exige modelagem nova;
- adiciona uma etapa ao fluxo;
- precisa governanca para nao virar dominio redundante.

Conclusao da opcao B:

- recomendada como arquitetura principal.

### Opcao C - Nao criar entidade ainda

Alternativa:

- manter apenas o status `APROVADA`;
- usar checklist e repasse manual fora do sistema ou em observacoes.

Vantagens:

- zero esforco de modelagem imediata;
- baixa friccao inicial.

Riscos:

- baixa auditabilidade;
- alto risco de perda de contexto;
- atribuicao de responsabilidade fraca;
- pouca escalabilidade operacional;
- maior chance de retrabalho e de fluxo paralelo fora do sistema.

Conclusao da opcao C:

- aceitavel apenas como contingencia temporaria;
- nao recomendada para a Onda 3.

## 6. Modelo recomendado

Recomendacao principal:

- criar uma entidade nova chamada `HandoffComercial`.

Papel da entidade:

- representar a entrada controlada da proposta aprovada na operacao;
- funcionar como agregado de transicao entre comercial e execucao;
- servir de ancora para checklist inicial, designacao operacional, solicitacao documental e criacao futura de tarefas/processos.

Relacoes recomendadas em nivel conceitual:

- `propostaComercialId` obrigatorio;
- `tenantId` obrigatorio;
- `leadId` opcional;
- `empreendimentoId` opcional;
- `responsavelComercialId` obrigatorio na criacao;
- `responsavelOperacionalId` opcional na criacao e obrigatorio antes da execucao;
- ligacoes futuras com tarefas, documentos solicitados e, quando fizer sentido, processos ou onboarding.

Observacao importante:

- `HandoffComercial` nao substitui `Empreendimento`, `Processo`, `Tarefa`, `Contrato` ou `OrdemServico`;
- ele apenas organiza a transicao entre proposta aprovada e operacao.

## 7. Dados migrados da proposta

| Dado | Migrar? | Observacao |
|---|---|---|
| `id` da proposta | Sim | Chave de rastreabilidade principal |
| `numero` da proposta | Sim | Referencia humana no handoff |
| `status` no momento do handoff | Sim | Registrar snapshot de origem |
| `lead/cliente` de origem | Sim | Base para contato e contexto |
| razao social / nome fantasia | Sim | Se disponivel no payload publico |
| documento da empresa | Sim | Se ja saneado para uso operacional |
| e-mail de contato | Sim | Para follow-up operacional |
| telefone de contato | Sim | Para follow-up operacional |
| municipio / UF | Sim | Contexto operacional inicial |
| `diagnostico resumido` | Sim | Somente dados saneados |
| CNAE principal | Sim | Base de contexto tecnico |
| risco | Sim | Base de priorizacao |
| score | Sim | Se existir no payload publico |
| potencial poluidor | Sim | Se existir no payload publico |
| alertas | Sim | Somente alertas resumidos |
| proximos passos | Sim | Se aprovados para operacao |
| servicos aprovados | Sim | Essencial para escopo inicial |
| itens da proposta | Sim | Somente representacao publica/aprovada |
| observacoes comerciais | Sim | Somente observacoes liberadas |
| data de validade | Sim | Referencia do snapshot comercial |
| PDF da proposta | Sim | Como referencia ou link autenticado |
| criador da proposta | Sim | Rastreabilidade |
| data de aprovacao | Sim | Deve ser registrada no momento da aprovacao/handoff |

## 8. Dados bloqueados

| Dado | Migrar? | Motivo |
|---|---|---|
| `custoInternoEstimado` | Nao | Dado sensivel de margem interna |
| `margemLucroAlvo` | Nao | Dado comercial sensivel |
| `valorReferenciaHora` | Nao | Logica interna de precificacao |
| `metadata` bruta | Nao | Pode conter ruido ou dados nao operacionais |
| `inputSnapshot` | Nao | Snapshot bruto comercial |
| `resultadoSnapshot` | Nao | Snapshot bruto comercial |
| `snapshotCatalogo` | Nao | Snapshot tecnico/comercial bruto |
| observacoes internas sensiveis | Nao | Nao devem contaminar operacao sem filtro |
| logica de precificacao | Nao | Nao e insumo operacional direto |
| estados intermediarios de negociacao | Nao | Ruido para operacao |
| futuros dados de contrato | Nao | Dominio separado |
| futuros dados financeiros | Nao | Dominio separado |

## 9. Status e transicoes

Os status do handoff devem ser separados do status da proposta, do contrato e do financeiro.

Status propostos:

- `AGUARDANDO_HANDOFF`
- `EM_TRIAGEM_OPERACIONAL`
- `AGUARDANDO_DOCUMENTOS`
- `EM_PLANEJAMENTO`
- `EM_EXECUCAO`
- `PAUSADO`
- `CANCELADO`
- `CONCLUIDO`

Regras de transicao recomendadas:

- o handoff so pode ser criado a partir de proposta `APROVADA`;
- proposta `ENVIADA` ou `EM_NEGOCIACAO` nao deve gerar handoff;
- proposta `REJEITADA`, `EXPIRADA` ou `CANCELADA` nao deve gerar handoff;
- uma mesma proposta nao deve gerar multiplos handoffs ativos sem regra explicita de revisao ou reabertura;
- o handoff pode iniciar em `AGUARDANDO_HANDOFF` ou diretamente em `EM_TRIAGEM_OPERACIONAL`, conforme a implementacao escolhida;
- `AGUARDANDO_DOCUMENTOS` deve ser usado quando a operacao depende de intake documental antes do planejamento;
- `EM_PLANEJAMENTO` antecede `EM_EXECUCAO`;
- `PAUSADO`, `CANCELADO` e `CONCLUIDO` devem ser finais ou quase finais, com trilha de auditoria obrigatoria.

## 10. Endpoints propostos

| Endpoint | Metodo | Finalidade | Observacao |
|---|---|---|---|
| `/api/v1/comercial/propostas/:id/handoff` | `POST` | Iniciar handoff a partir de proposta aprovada | Cria entidade de transicao |
| `/api/v1/operacao/handoffs` | `GET` | Listar handoffs operacionais | Pode aceitar filtros por status, responsavel e tenant |
| `/api/v1/operacao/handoffs/:id` | `GET` | Detalhar handoff | Deve retornar dados saneados, origem e trilha basica |
| `/api/v1/operacao/handoffs/:id` | `PATCH` | Atualizar status, responsavel e observacoes operacionais | Sem alterar dados comerciais sensiveis |

Endpoints complementares futuros, se a Onda 3 evoluir:

- `POST /api/v1/operacao/handoffs/:id/tarefas-iniciais`
- `POST /api/v1/operacao/handoffs/:id/documentos-solicitados`

## 11. Frontend proposto

### Na proposta

Adicionar futuramente um botao:

- `Iniciar handoff operacional`

Regras de exibicao sugeridas:

- somente quando `status = APROVADA`;
- somente para perfis autorizados;
- somente quando ainda nao existir handoff ativo vinculado.

### Novas telas sugeridas

- `/operacao/handoffs`
- `/operacao/handoffs/[id]`

Finalidade das telas:

- lista de handoffs com status, origem e responsavel;
- detalhe do handoff com origem da proposta, dados saneados, checklist inicial, documentos pendentes e responsavel operacional;
- ponte para tarefas, documentos e eventualmente onboarding/processos.

Recomendacao de UX:

- nao sobrecarregar a tela de proposta com detalhes operacionais;
- usar o detalhe do handoff como lugar principal de conducao da entrada em operacao.

## 12. Seguranca e perfis

Perfis sugeridos para iniciar handoff:

- `EXECUTIVO`
- `COORDENADOR`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Perfis sugeridos para assumir operacao:

- `COORDENADOR`
- `ANALISTA`
- `ANALISTA_CAMPO`
- `ADMIN_TENANT`
- `SUPER_ADMIN`

Perfis que nao devem iniciar ou operar handoff por padrao:

- `REPRESENTANTE_POSTO`
- qualquer usuario sem vinculo com o tenant da proposta

Regras de seguranca recomendadas:

- manter isolamento por tenant;
- nunca expor margem, custo ou snapshots brutos ao contexto operacional;
- registrar quem iniciou o handoff e quem assumiu a operacao;
- validar permissao de leitura e alteracao por perfil e tenant.

## 13. Auditoria

Eventos recomendados de auditoria:

- `proposta_comercial.aprovada`
- `handoff_comercial.criado`
- `handoff_comercial.responsavel_atribuido`
- `handoff_comercial.status_alterado`
- `handoff_comercial.documento_solicitado`
- `handoff_comercial.tarefa_criada`
- `handoff_comercial.cancelado`

Dados minimos por evento:

- `tenantId`
- `propostaComercialId`
- `handoffId`, quando existir
- usuario executor
- status anterior e novo status, quando houver
- timestamp
- observacao resumida

## 14. Riscos e travas

| Risco / trava | Impacto | Mitigacao recomendada |
|---|---|---|
| Misturar proposta com contrato | Alto | Manter handoff como entidade de transicao separada |
| Criar OS antes de contrato ou escopo maduro | Alto | Proibir salto direto da proposta para OS real |
| Expor valores internos e margem para operacao | Alto | Migrar somente payload saneado |
| Duplicar `Empreendimento` | Alto | Tornar o vinculo opcional e definir regra clara de reutilizacao/criacao |
| Duplicar cliente/lead | Medio | Reaproveitar `LeadWhatsApp` e referencias existentes quando houver |
| Criar fluxo paralelo ao `onboarding` | Medio | Posicionar handoff como etapa anterior e integradora |
| Gerar tarefas demais automaticamente | Medio | Comecar com checklist e automacao minima |
| Perder rastreabilidade da proposta original | Alto | Exigir referencia obrigatoria a `PropostaComercial` |
| Herdar complexidade do `raw SQL` comercial | Medio | Planejar saneamento do Prisma antes ou junto da modelagem 3.1 |
| Usar rotas placeholder de contratos/OS/financeiro como destino real | Medio | Nao acoplar handoff a esses modulos nesta fase |

## 15. Plano por subondas

| Subonda | Entrega | Risco | Pre-requisito |
|---|---|---|---|
| 3.1 - Modelagem do Handoff Operacional | Definir entidade `HandoffComercial`, relacoes, status e auditoria minima | Modelagem ruim pode acoplar comercial e operacao cedo demais | Validacao final da arquitetura recomendada |
| 3.2 - API de Handoff | Criar handoff a partir de proposta aprovada, listar, detalhar e atualizar status | Permissoes e duplicidade de handoff | Modelagem aprovada e migration planejada |
| 3.3 - UI de Handoff | Botao na proposta, listagem e detalhe de handoffs | UX confusa entre proposta e operacao | API basica pronta |
| 3.4 - Checklist inicial e tarefas | Gerar checklist inicial e tarefas minimas | Automacao excessiva e ruido operacional | Handoff funcional e regras de status definidas |
| 3.5 - Documentos iniciais | Solicitar e acompanhar documentos necessarios | Duplicidade com modulo de documentos sem padrao claro | Handoff e checklist maduros |
| 3.6 - Consolidacao e testes | E2E, perfis, auditoria e refinamentos | Regressao entre comercial e operacao | Subondas anteriores concluidas |

## 16. Proxima etapa recomendada

A primeira subonda recomendada e:

- **Onda 3.1 - Modelagem do Handoff Operacional**

Motivos:

- a principal decisao estrutural da Onda 3 e a entidade de transicao;
- sem essa definicao, API, UI, checklist e documentos correm risco de nascer acoplados de forma errada;
- a modelagem precisa definir claramente o que herda da proposta, o que fica bloqueado e como o handoff conversa com `Empreendimento`, `Tarefa`, `Documento` e `onboarding`.

Decisao executiva recomendada para a abertura da Onda 3:

- seguir com entidade nova de handoff;
- nao reutilizar `Processo`, `Tarefa`, `onboarding` ou as telas placeholder de `Contratos` / `Ordens de Servico` / `Financeiro` como substitutos da transicao;
- liberar migration apenas na subonda 3.1, nunca nesta etapa de planejamento.
