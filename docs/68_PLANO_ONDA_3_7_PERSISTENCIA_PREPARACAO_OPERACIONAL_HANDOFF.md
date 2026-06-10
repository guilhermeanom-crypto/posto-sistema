# 68. Plano da Onda 3.7 - Persistencia Controlada da Preparacao Operacional do Handoff

## 1. Objetivo

Planejar a persistencia controlada dos dados de preparacao operacional do handoff, definindo quais campos devem passar a existir formalmente dentro do dominio de handoff sem:

- criar OS;
- criar contrato;
- acionar financeiro;
- acionar CRM;
- iniciar execucao formal;
- alterar a regra de aceite homologada na Onda 3.4.

Objetivo funcional da onda:

- transformar parte da preparacao operacional hoje apenas visual em dados persistidos e governados;
- separar o que deve ser obrigatorio, opcional, derivado ou futuro;
- antecipar impacto em modelo, contrato, `PATCH`, proxy web, frontend e validacao;
- preparar uma implementacao futura em subondas controladas.

## 2. Contexto herdado das Ondas 3.4, 3.5 e 3.6

Da Onda 3.4, esta onda herda:

- `EM_PLANEJAMENTO` como representacao do aceite operacional;
- bloqueio sem `responsavelOperacionalId`;
- bloqueio com `pendenciasOperacionais` em aberto;
- persistencia validada de:
  - `status`
  - `responsavelOperacionalId`
  - `pendenciasOperacionais`
  - `observacoesOperacionais`
- ausencia de OS, contrato, financeiro e CRM.

Da Onda 3.5, esta onda herda:

- leitura visual mais limpa;
- ausencia de UUIDs e IDs internos na leitura padrao;
- enums tecnicos convertidos para labels amigaveis;
- preservacao do contrato atual do proxy, sem saneamento estrutural adicional.

Da Onda 3.6, esta onda herda:

- camada visual minima de preparacao operacional;
- blocos de:
  - `Aceite operacional concluido`
  - `Preparacao operacional inicial`
  - `Prontidao operacional`
  - `Proximos passos orientativos`
  - `Responsabilidade e coordenacao`
- placeholders honestos para dados que ainda nao existem;
- validacao runtime/headless de que a camada visual esta correta e nao criou inputs indevidos.

Conclusao de heranca:

- a semantica da etapa pos-aceite ja esta clara;
- o gap atual nao e mais de UX principal;
- o gap atual e de persistencia controlada.

## 3. Problema atual

Hoje o modulo ja mostra uma etapa coerente de preparacao operacional no detalhe do handoff, mas essa etapa ainda depende fortemente de:

- dados herdados do handoff original;
- campos operacionais genericos;
- leituras derivadas no frontend;
- placeholders sem persistencia propria.

Problemas concretos no estado atual:

- prioridade operacional ainda nao existe formalmente;
- previsao inicial de inicio ainda nao existe formalmente;
- necessidade de documentos, visita e terceiro ainda nao existe como dado controlado;
- risco operacional especifico ainda nao existe separado do risco comercial/regulatorio;
- observacoes de planejamento ainda nao estao separadas de `observacoesOperacionais`;
- prontidao ainda nao possui estrutura persistida propria.

Em resumo:

- a operacao ja enxerga a preparacao;
- mas ainda nao consegue salvar a preparacao como um estado de dados estruturado.

## 4. Diferenca entre preparacao visual e preparacao persistida

Separacao conceitual obrigatoria:

- `preparacao visual`
  - organiza a leitura da tela;
  - reaproveita o que ja existe;
  - aceita placeholders;
  - pode derivar informacoes no frontend;
  - nao garante governanca ou persistencia.

- `preparacao persistida`
  - cria campos formais no dominio de handoff;
  - permite salvar, recarregar e auditar informacoes especificas da preparacao;
  - exige contrato tecnico claro;
  - exige definicao de validacoes;
  - exige compatibilidade com `PATCH`, proxy e frontend.

Conclusao:

- a Onda 3.6 resolveu a camada visual;
- a Onda 3.7 precisa desenhar a camada estrutural de dados.

## 5. Campos candidatos

Campos candidatos desta onda para avaliacao de persistencia:

- `prioridadeOperacional`
- `previsaoInicialInicio`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`
- `riscoOperacional`
- `observacoesPlanejamento`
- `checklistProntidao`

Papel esperado de cada um:

- `prioridadeOperacional`
  - indicar criticidade interna da preparacao.

- `previsaoInicialInicio`
  - registrar expectativa inicial de inicio da etapa futura, sem comunicar execucao iniciada.

- `necessidadeDocumentos`
  - marcar se ainda ha necessidade de complementacao documental para a preparacao.

- `necessidadeVisita`
  - marcar se a preparacao depende de visita tecnica futura.

- `necessidadeTerceiro`
  - marcar se a preparacao depende de apoio externo ou terceiro.

- `riscoOperacional`
  - registrar risco especifico da organizacao operacional, distinto do risco comercial/regulatorio herdado.

- `observacoesPlanejamento`
  - separar observacoes da preparacao das observacoes operacionais gerais.

- `checklistProntidao`
  - registrar uma estrutura minima de verificacoes da preparacao antes de qualquer etapa posterior.

## 6. Classificacao dos campos em obrigatorio, opcional, derivado ou futuro

### 6.1 Obrigatorios

Campos que fazem sentido como obrigatorios para a futura persistencia da preparacao:

- `observacoesPlanejamento`
  - justificativa:
    - e o campo mais simples e mais aderente ao uso atual;
    - separa planejamento de observacoes operacionais genericas;
    - melhora governanca sem criar automacao.

Campos potencialmente obrigatorios em fase 2, mas nao necessariamente na primeira subonda:

- `prioridadeOperacional`
  - justificativa:
    - alto valor operacional;
    - mas exige definicao semantica controlada.

### 6.2 Opcionais

Campos que tendem a ser opcionais em persistencia inicial:

- `previsaoInicialInicio`
- `necessidadeDocumentos`
- `necessidadeVisita`
- `necessidadeTerceiro`
- `riscoOperacional`

Justificativa:

- sao relevantes para planejamento;
- mas nem todo handoff exigira todos eles;
- nao devem bloquear aceite;
- nao devem bloquear permanencia em `EM_PLANEJAMENTO`.

### 6.3 Derivados

Campos que nao precisam necessariamente virar persistencia propria nesta primeira etapa:

- parte da `prontidao operacional`
  - pode continuar derivada de:
    - responsavel definido;
    - pendencias zeradas;
    - campos de preparacao preenchidos.

- parte do contexto de atencao
  - pode continuar derivada de:
    - `alertasResumo`
    - `riscoNivel`
    - `potencialPoluidor`

### 6.4 Futuro

Campos ou estruturas que provavelmente devem ficar para fase posterior:

- `checklistProntidao` completo e estruturado em formato mais rico;
- qualquer logica automatica de `liberado para proxima etapa`;
- qualquer regra que transforme preparacao em gatilho para OS;
- qualquer estrutura que acople preparacao a contrato, financeiro ou execucao.

Conclusao de classificacao:

- primeira persistencia deve ser enxuta;
- a tentacao de persistir tudo de uma vez deve ser evitada.

## 7. Impacto provavel em Prisma/modelo

Impacto provavel no modelo de dominio:

- extensao da entidade de `handoff` existente;
- adicao de colunas especificas para preparacao operacional;
- eventual estrutura JSON controlada para `checklistProntidao`, caso isso seja aprovado em fase posterior;
- necessidade de distinguir semanticamente:
  - observacoes operacionais gerais;
  - observacoes de planejamento.

Decisao recomendada de modelagem:

- priorizar campos escalares simples primeiro;
- evitar introduzir entidade nova nesta primeira implementacao;
- evitar enum demais sem necessidade;
- evitar JSON complexo logo na primeira subonda, salvo forte justificativa para `checklistProntidao`.

Risco de modelo a evitar:

- inflar o handoff com estrutura muito pesada antes de validar uso real da preparacao persistida.

## 8. Impacto provavel em schema/API

Impacto provavel na API:

- ampliacao do schema de detalhe do handoff;
- ampliacao controlada do schema de atualizacao (`PATCH`);
- tipagem dos novos campos no contrato de resposta e atualizacao;
- possivel validacao de formato para:
  - datas;
  - labels controlados;
  - flags booleanas;
  - campos de texto.

Diretriz de contrato:

- os novos campos devem ser opcionais no `PATCH`;
- nenhum novo campo deve alterar a regra de aceite;
- nenhum novo campo deve se tornar pre-requisito para `EM_PLANEJAMENTO` nesta primeira fase.

Riscos de API:

- ampliar o contrato rapido demais;
- acoplar validacoes de planejamento ao fluxo de aceite;
- permitir payload ambiguo entre observacao geral e observacao de planejamento.

## 9. Impacto provavel em proxy web

Impacto provavel no proxy do web:

- atualizacao do proxy de detalhe para repassar os novos campos saneados;
- atualizacao do proxy de `PATCH` para permitir os novos campos aprovados;
- revisao de sanitizacao para garantir que:
  - o proxy nao reintroduza metadados internos;
  - o proxy nao volte a expor IDs tecnicos desnecessarios;
  - os novos campos cheguem em formato amigavel e seguro para o frontend.

Diretriz:

- a ampliacao do proxy deve ser estritamente aderente ao contrato aprovado;
- nao usar a onda de persistencia para reabrir saneamento geral de payload.

## 10. Impacto provavel em frontend

Impacto provavel no frontend:

- substituicao gradual dos placeholders por dados persistidos;
- criacao controlada de inputs apenas para os campos aprovados;
- manutencao de linguagem de planejamento e pre-execucao;
- atualizacao dos blocos:
  - `Preparacao operacional inicial`
  - `Prontidao operacional`
  - `Responsabilidade e coordenacao`

Diretriz de UI:

- cada novo input deve corresponder a persistencia real;
- nenhum campo deve parecer salvo se ainda nao houver contrato e backend para isso;
- a UX deve continuar deixando claro que `EM_PLANEJAMENTO` nao e execucao.

## 11. Riscos

Riscos principais desta onda:

- transformar preparacao em quasi-execucao;
- acoplar planejamento a regra de aceite;
- criar campos demais de uma vez;
- introduzir nomenclatura ambigua entre risco comercial e risco operacional;
- criar checklist estruturado cedo demais;
- abrir persistencia sem definir fallback visual claro;
- reintroduzir complexidade de payload ou ruido tecnico na UI;
- ampliar demais o `PATCH` sem estrategia de validacao incremental.

Risco de governanca:

- tentar resolver persistencia, OS, contrato e execucao na mesma leva.

Mitigacao recomendada:

- implementar em subondas;
- persistir primeiro os campos simples e mais claros;
- deixar estruturas compostas para fase posterior.

## 12. Escopo permitido

Fica permitido nesta primeira etapa da Onda 3.7:

- apenas planejamento documental;
- avaliar quais campos devem virar persistencia real;
- definir impacto em modelo, contrato, `PATCH`, frontend e validacao;
- separar campos obrigatorios, opcionais, derivados e futuros;
- propor criterios de aceite para futura implementacao;
- recomendar divisao em subondas tecnicas.

## 13. Escopo proibido

Fica proibido nesta etapa:

- implementar codigo;
- alterar Prisma;
- criar migration;
- criar entidade nova;
- criar status novo;
- criar OS;
- criar contrato;
- acionar financeiro;
- acionar CRM;
- alterar a regra de aceite da Onda 3.4;
- reabrir a sanitizacao visual da Onda 3.5;
- transformar `EM_PLANEJAMENTO` em execucao;
- acoplar preparacao persistida a automacao de etapa posterior.

## 14. Criterios de aceite

Para a futura implementacao ser considerada aceita, devera cumprir:

- persistir apenas campos aprovados no plano;
- nao alterar a regra de aceite operacional;
- nao criar dependencia de campos novos para aceitar o handoff;
- manter `EM_PLANEJAMENTO` como organizacao pre-execucao;
- manter a UI sem UUIDs ou labels tecnicos antigos;
- manter ausencia de acionamento de OS, contrato, financeiro e CRM;
- garantir build, TypeScript e testes passando;
- garantir persistencia e releitura dos novos campos apos reload.

## 15. Checklist de validacao futura

Checklist recomendado para a futura implementacao:

- validar `GET` do detalhe com os novos campos;
- validar `PATCH` com os novos campos opcionais;
- validar persistencia apos reload;
- validar que os novos campos aparecem corretamente na UI;
- validar que placeholders desaparecem apenas quando houver dado real;
- validar que nenhum novo input aparece sem persistencia real;
- validar que bloqueio sem responsavel continua intacto;
- validar que bloqueio com pendencias continua intacto;
- validar aceite para `EM_PLANEJAMENTO` sem regressao;
- validar ausencia de acionamento de OS;
- validar ausencia de acionamento de contrato;
- validar ausencia de acionamento de financeiro;
- validar ausencia de acionamento de CRM;
- executar:
  - `./node_modules/.bin/next build`
  - `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
  - `./node_modules/.bin/vitest run src/modules/operacao/__tests__/handoffs.routes.test.ts`

## 16. Recomendacao sobre implementar em subondas

Recomendacao forte:

- **sim, a Onda 3.7 deve ser implementada em subondas**.

Divisao sugerida:

- `3.7.1`
  - contrato tecnico e decisao de modelagem;
  - foco em quais campos simples entram primeiro.

- `3.7.2`
  - persistencia minima de campos simples:
    - `observacoesPlanejamento`
    - `prioridadeOperacional`
    - flags simples aprovadas.

- `3.7.3`
  - adaptacao controlada do frontend para os novos campos persistidos;
  - validacao visual e funcional.

- `3.7.4`
  - avaliacao de estrutura mais rica para `checklistProntidao`, apenas se ainda fizer sentido.

Principio de implementacao:

- primeiro persistir o que e simples, claro e de alto valor;
- depois avaliar se vale sofisticar.

## 17. Conclusao

A Onda 3.7 deve abrir a proxima camada de maturidade do handoff: sair da preparacao apenas visual para uma preparacao operacional persistida e governada.

Conclusao estrategica:

- o momento de abrir persistencia faz sentido porque a semantica da tela ja foi validada;
- a primeira implementacao deve ser enxuta e controlada;
- os novos campos nao devem interferir no aceite da Onda 3.4;
- a persistencia nao deve reabrir a sanitizacao visual da Onda 3.5;
- `EM_PLANEJAMENTO` deve continuar significando handoff aceito e em organizacao pre-execucao, nao execucao iniciada.
