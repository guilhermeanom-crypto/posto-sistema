# 59. Inventario da Onda 3.5 - UUIDs e Referencias Tecnicas no Handoff

## 1. Objetivo

Mapear de forma objetiva onde a UI de handoffs ainda exibe UUIDs, IDs internos ou referencias tecnicas pouco legiveis, considerando exclusivamente os arquivos candidatos da Onda 3.5.

Este inventario nao implementa correcoes. O foco aqui e registrar:

- onde a exposicao acontece;
- qual campo esta envolvido;
- qual e o tipo do problema;
- qual correcao parece mais adequada;
- qual e o risco da alteracao;
- se a correcao exige ou nao alteracao de contrato/payload.

## 2. Escopo auditado

Arquivos auditados:

- `apps/web/src/app/(app)/operacao/handoffs/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`
- `apps/web/src/app/(app)/operacao/handoffs/shared.ts`
- `apps/web/src/app/api/operacao/handoffs/route.ts`
- `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`

## 3. Resumo executivo

Pontos encontrados:

- a listagem ainda usa filtros baseados em UUID/ID tecnico na interface;
- a listagem exibe `propostaComercialId`, `responsavelComercialId` e `responsavelOperacionalId` diretamente ao usuario;
- o detalhe ainda exibe `propostaComercialId`, `empreendimentoId`, `responsavelComercialId`, `responsavelOperacionalId` e `leadWhatsAppId`;
- o detalhe ainda mostra enums tecnicos crus em pontos relevantes da experiencia, como `origemProposta`, `statusPropostaOrigem`, `perfil`, `riscoNivel`, `potencialPoluidor` e `esfera`;
- os proxies web ainda repassam ao client campos tecnicos que hoje acabam sendo renderizados de forma pouco amigavel;
- parte das correcoes pode ser feita apenas na camada de apresentacao;
- parte das correcoes mais completas depende de enriquecer ou redefinir o payload exposto ao frontend.

## 4. Inventario tecnico

### Arquivo: `apps/web/src/app/(app)/operacao/handoffs/page.tsx`

| Trecho/componente afetado | Campo exposto | Tipo de problema | Proposta de correcao | Risco de alteracao | Exige alteracao de contrato/payload |
| --- | --- | --- | --- | --- | --- |
| Filtros da listagem, linhas `186-235` | `propostaComercialId`, `empreendimentoId`, `responsavelComercialId`, `responsavelOperacionalId` | `UUID visivel`, `ID tecnico visivel`, `texto tecnico ruim para usuario operacional` | Ocultar os filtros tecnicos da UI atual ou substitui-los por controles amigaveis. Com o payload atual, a correcao minima e ocultar ou renomear a experiencia; a substituicao real por nome/label depende de fonte amigavel. | Medio. Pode impactar usuarios que hoje filtram manualmente por ID tecnico. | `Nao` para ocultar ou suavizar a UI atual. `Sim` para oferecer busca amigavel real no mesmo endpoint. |
| Coluna `Proposta`, linhas `303-306` | `propostaComercialId` | `UUID visivel` | Ocultar e manter apenas `numeroProposta`, que ja e o identificador legivel disponivel no payload. | Baixo. O numero da proposta ja identifica melhor o registro na interface. | `Nao` |
| Coluna `Responsaveis`, linhas `327-329` | `responsavelComercialId`, `responsavelOperacionalId` | `UUID visivel`, `ID tecnico visivel` | Substituir por nome/label quando houver fonte confiavel. Sem enriquecimento, usar fallback amigavel como `Atribuido` / `Nao atribuido` e evitar imprimir o ID bruto. | Medio. Pode haver perda temporaria de rastreabilidade visual se nenhum nome estiver disponivel. | `Nao` para fallback amigavel. `Sim` para exibir nomes diretamente a partir do payload de listagem. |
| Coluna `CNAE / Risco`, linhas `321-323` | `cnaePrincipalCodigo`, `riscoNivel` | `texto tecnico ruim para usuario operacional` | Manter o codigo CNAE apenas se acompanhado da descricao quando disponivel. Mapear `riscoNivel` para label amigavel ou badge com capitalizacao humana. | Baixo. Nao altera regra, apenas leitura. | `Nao` |
| Coluna `Potencial`, linhas `324-326` | `potencialPoluidor` | `texto tecnico ruim para usuario operacional` | Mapear enum para label amigavel e, idealmente, badge visual coerente com risco. | Baixo. Ajuste apenas de apresentacao. | `Nao` |

### Arquivo: `apps/web/src/app/(app)/operacao/handoffs/[id]/page.tsx`

| Trecho/componente afetado | Campo exposto | Tipo de problema | Proposta de correcao | Risco de alteracao | Exige alteracao de contrato/payload |
| --- | --- | --- | --- | --- | --- |
| Fallback do select de responsavel, linhas `303-322` | `responsavelOperacionalId` com `slice(0, 8)` | `UUID visivel` | Remover o recorte do UUID do label de fallback e trocar por texto amigavel, como `Responsavel atual sem cadastro disponivel`. | Baixo. O UUID cortado nao agrega valor operacional. | `Nao` |
| Hero do detalhe, linhas `543-547` | `origemProposta` | `texto tecnico ruim para usuario operacional` | Mapear `TRIAGEM_CNAE`, `CRM`, `ONBOARDING` e `MANUAL` para labels operacionais legiveis. | Baixo. Ajuste de copy. | `Nao` |
| Card de permissoes, linhas `592-596` | `permissions.perfil` | `texto tecnico ruim para usuario operacional` | Exibir label amigavel do perfil em vez do enum cru. | Baixo. Informacao continua presente, mas mais clara. | `Nao` |
| `Contexto da proposta`, linhas `764-770` | `statusPropostaOrigem`, `origemProposta` | `texto tecnico ruim para usuario operacional` | Mapear ambos para labels amigaveis. `APROVADA` ainda e compreensivel, mas fica inconsistente com o restante da UX quando exibido como enum cru. | Baixo. Ajuste de copy e padronizacao. | `Nao` |
| `Contexto da proposta`, linha `766` | `propostaComercialId` | `UUID visivel` | Ocultar o campo na tela e manter `numeroProposta` como referencia principal. Se houver necessidade operacional de rastreio interno, mover o ID para contexto tecnico restrito e nao para leitura padrao. | Baixo. O numero da proposta ja aparece no cabecalho. | `Nao` |
| `Contexto da proposta`, linha `769` | `empreendimentoId` | `UUID visivel` | Ocultar com o payload atual ou substituir por codigo/nome curto somente se essa informacao passar a existir de forma confiavel. | Medio. Pode haver casos em que algum usuario use o UUID para suporte, mas nao e boa UX padrao. | `Nao` para ocultar. `Sim` para trocar por nome/codigo vindo do endpoint. |
| `Contexto tecnico resumido`, linhas `790-796` | `riscoNivel`, `potencialPoluidor`, `esfera` | `texto tecnico ruim para usuario operacional` | Mapear enums para labels amigaveis e manter consistencia visual com badges ou texto padronizado. | Baixo. Ajuste de leitura. | `Nao` |
| `Bloco operacional`, linhas `865-866` | `responsavelComercialId`, `responsavelOperacionalId` | `UUID visivel`, `ID tecnico visivel` | Substituir por nomes quando houver fonte segura. Na ausencia de label, aplicar fallback amigavel e nao imprimir o ID bruto. | Medio. Pode exigir regra de fallback para casos sem usuario carregado. | `Nao` para fallback amigavel. `Sim` para nomes nativos no payload do detalhe. |
| `Datas e marcos temporais`, linha `894` | `leadWhatsAppId` | `ID tecnico visivel`, `metadado interno` | Ocultar da interface. Nao ha justificativa operacional clara para exibir esse identificador ao usuario final. | Baixo. Campo nao participa do aceite operacional. | `Nao` |

### Arquivo: `apps/web/src/app/(app)/operacao/handoffs/shared.ts`

| Trecho/componente afetado | Campo exposto | Tipo de problema | Proposta de correcao | Risco de alteracao | Exige alteracao de contrato/payload |
| --- | --- | --- | --- | --- | --- |
| Interface `HandoffComercialResumo`, linhas `11-32` | `propostaComercialId`, `leadWhatsAppId`, `empreendimentoId`, `responsavelComercialId`, `responsavelOperacionalId`, `statusPropostaOrigem`, `origemProposta` | `ID tecnico visivel`, `metadado interno`, `texto tecnico ruim para usuario operacional` | Manter apenas o que for realmente necessario para navegacao ou submissao, separando mentalmente campos internos de campos de exibicao. Para UX mais limpa, o frontend deveria preferir propriedades de display em vez de renderizar IDs diretamente. | Medio. Tipagens sao base para listagem e detalhe. | `Sim`, se a estrategia for reduzir ou enriquecer o shape exposto ao client. |
| Interface `HandoffComercialDetalhe`, linhas `44-63` | herdanca de IDs tecnicos do resumo e manutencao de campos tecnicos no detalhe | `ID tecnico visivel`, `metadado interno` | Reavaliar quais campos precisam existir no contrato do detalhe para renderizacao padrao e quais poderiam ficar fora do payload saneado. | Medio. Pode refletir em varios pontos da tela. | `Sim` |
| Interface `ListarHandoffsOperacionaisParams`, linhas `65-73` | filtros por `propostaComercialId`, `empreendimentoId`, `responsavelComercialId`, `responsavelOperacionalId` | `ID tecnico visivel`, `texto tecnico ruim para usuario operacional` | Se a Onda 3.5 optar por experiencia menos tecnica, os filtros de UI nao deveriam ser modelados primariamente por UUIDs. | Medio. Pode afetar a experiencia da listagem. | `Nao` para ocultar na UI. `Sim` para remodelar busca amigavel no endpoint. |

### Arquivo: `apps/web/src/app/api/operacao/handoffs/route.ts`

| Trecho/componente afetado | Campo exposto | Tipo de problema | Proposta de correcao | Risco de alteracao | Exige alteracao de contrato/payload |
| --- | --- | --- | --- | --- | --- |
| `sanitizeHandoffResumo`, linhas `46-68` | `propostaComercialId`, `leadWhatsAppId`, `empreendimentoId`, `responsavelComercialId`, `responsavelOperacionalId` | `ID tecnico visivel`, `metadado interno` | Reduzir o payload da listagem ao que a tela realmente precisa exibir ou enriquecer o payload com labels amigaveis quando a intencao for mostrar a informacao. | Medio. Mudanca de payload pode exigir ajuste coordenado na tela. | `Sim` |
| `sanitizeHandoffResumo`, linhas `54-56` | `statusPropostaOrigem`, `origemProposta` | `texto tecnico ruim para usuario operacional` | Manter no contrato apenas se houver uso real ou converter para camada de apresentacao amigavel antes da renderizacao. | Baixo a medio. Hoje a listagem nao depende visualmente desses campos, mas eles continuam expostos ao client. | `Sim`, se a decisao for limpar o shape retornado pelo proxy. |

### Arquivo: `apps/web/src/app/api/operacao/handoffs/[id]/route.ts`

| Trecho/componente afetado | Campo exposto | Tipo de problema | Proposta de correcao | Risco de alteracao | Exige alteracao de contrato/payload |
| --- | --- | --- | --- | --- | --- |
| `sanitizeServicoResumo`, linhas `88-97` | `itemId` | `metadado interno` | Manter apenas se houver justificativa tecnica para chave estavel no client; caso contrario, remover do payload saneado e deixar a UI usar indice ou outra chave derivada nao exposta ao usuario. | Medio. Pode mexer em chave de renderizacao e estabilidade de lista. | `Sim` |
| `sanitizeHandoffDetalhe`, linhas `100-144` | `propostaComercialId`, `leadWhatsAppId`, `empreendimentoId`, `responsavelComercialId`, `responsavelOperacionalId` | `ID tecnico visivel`, `metadado interno` | Reavaliar quais IDs precisam continuar indo para o client. Os que so servem para leitura humana ruim devem sair do payload ou ganhar equivalente amigavel. | Medio. Qualquer reducao do shape precisa ser sincronizada com a tela de detalhe. | `Sim` |
| `sanitizeHandoffDetalhe`, linhas `108-110` | `status`, `statusPropostaOrigem`, `origemProposta` | `texto tecnico ruim para usuario operacional` | `status` pode permanecer porque a UI ja mapeia label. `statusPropostaOrigem` e `origemProposta` deveriam sair do payload cru ou serem sempre tratados por mapa de labels antes da exibicao. | Baixo a medio. Depende de onde o mapeamento sera concentrado. | `Sim`, se a limpeza for feita no contrato do proxy. |

## 5. Priorizacao sugerida para implementacao futura

Prioridade alta:

- remover da listagem a exibicao de `propostaComercialId`;
- remover da listagem a exibicao de `responsavelComercialId` e `responsavelOperacionalId`;
- remover do detalhe a exibicao de `propostaComercialId`, `empreendimentoId`, `responsavelComercialId`, `responsavelOperacionalId` e `leadWhatsAppId`;
- eliminar o fallback visual que mostra recorte de UUID em `Responsavel atual (...)`.

Prioridade media:

- revisar filtros tecnicos baseados em UUID na listagem;
- mapear `origemProposta`, `statusPropostaOrigem`, `perfil`, `riscoNivel`, `potencialPoluidor` e `esfera` para labels amigaveis;
- decidir se o proxy deve continuar expondo `itemId` e IDs tecnicos ao client.

Prioridade baixa:

- refinar a leitura de `CNAE` para combinar codigo e descricao de forma mais amigavel;
- revisar se ainda vale expor ao client campos tecnicos que nao chegam ao DOM, mas continuam no contrato do frontend.

## 6. Conclusao

O problema residual da Onda 3.5 esta concentrado em dois niveis:

- apresentacao: a UI ainda renderiza UUIDs, IDs internos e enums crus em pontos importantes da experiencia;
- contrato saneado: os proxies do web continuam entregando ao client campos tecnicos que favorecem essa exposicao.

Ha espaco para uma primeira rodada de correcao sem alterar regra de negocio, Prisma, migration, status ou fluxo de aceite operacional. As correcoes estritamente visuais podem ocorrer sem mexer no contrato. Ja a substituicao completa de IDs por labels reais em todos os pontos depende de decisao explicita sobre enriquecimento ou reducao do payload exposto ao frontend.
