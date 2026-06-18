# 101. Governanca de Fontes Oficiais e Carga da Base

Data: 2026-06-11

## 1. Pergunta central

Quem vai consolidar as fontes oficiais, quem monta as planilhas, como a base entra no sistema e se isso faz sentido no nivel atual do produto.

## 2. Resposta curta

Sim, isso e valido. Voce nao esta inventando moda.

O nome pratico disso e:

- governanca de dados;
- curadoria normativa;
- onboarding estruturado de base;
- um `MDM leve` adaptado ao nivel atual do sistema.

O erro seria tentar resolver isso:

- so com cadastro manual dentro do app;
- ou com uma plataforma gigante de governanca antes da hora.

O caminho certo para o nivel atual do sistema e:

- `planilha controlada + validacao + importacao por lote + aprovacao funcional`.

## 3. O que NAO deve acontecer

Estas responsabilidades nao devem ficar misturadas:

1. tecnologia nao deve inventar obrigacao legal;
2. analista operacional nao deve sozinho definir fundamento legal;
3. cliente nao deve decidir a regra do sistema;
4. qualquer usuario nao deve sair cadastrando base mestre direto no banco;
5. o time nao deve depender de PDF solto e memoria individual.

## 4. Quem consolida as fontes oficiais

## 4.1 Dono do conteudo normativo

Responsavel ideal:

- `COORDENADOR` com dominio regulatorio;
- ou responsavel tecnico/regulatorio da operacao;
- ou socio/gestor que responde tecnicamente pelo servico.

Esse papel e o **curador normativo**.

Ele decide:

- qual fonte oficial vale;
- qual obrigacao entra ou nao entra;
- qual documento comprova a obrigacao;
- qual periodicidade e aplicada;
- quando a regra muda por UF, municipio, orgao ou tipo de posto.

Tecnologia nao deve fazer essa decisao.

## 4.2 Quem levanta a fonte

Responsavel ideal:

- `ANALISTA`
- apoio de `COORDENADOR`

Esse papel pesquisa e organiza:

- lei, portaria, resolucao, norma tecnica;
- licenca real;
- condicionante;
- termo de referencia do orgao;
- checklist interno auditado;
- laudos e modelos de terceiro.

Ou seja:

- o `ANALISTA` levanta e estrutura;
- o `COORDENADOR` valida e aprova.

## 4.3 Quem fornece documento operacional real

Responsaveis:

- `REPRESENTANTE_POSTO`
- terceiros
- equipe interna do cliente
- `ANALISTA_CAMPO` quando a evidência nasce em campo

Esses atores nao consolidam a norma. Eles fornecem:

- licencas;
- alvaras;
- laudos;
- certificados;
- ASOs;
- MTR/CCR;
- dados de equipamentos;
- evidencias de campo.

## 5. Quem monta as planilhas controladas

## 5.1 Base normativa mestre

Quem preenche:

- `ANALISTA`

Quem revisa:

- `COORDENADOR`

Quem aprova:

- responsavel regulatorio da operacao

Exemplos:

- orgaos;
- tipos de documento;
- tipos de processo;
- requisitos por processo;
- obrigacoes regulatorias;
- limites de parametros;
- regras automáticas.

## 5.2 Base operacional por empreendimento

Quem preenche:

- `ANALISTA`
- apoio do cliente

Quem revisa:

- `COORDENADOR`

Quem aprova:

- dono da carteira ou responsavel operacional

Exemplos:

- empreendimentos;
- processos;
- dossie documental;
- licencas;
- alvaras;
- condicionantes;
- SST;
- equipamentos;
- residuos;
- outorga;
- monitoramento.

## 5.3 Quem NAO deve montar

Nao e recomendavel que estas planilhas sejam montadas:

- apenas por tecnologia;
- apenas pelo cliente;
- apenas por comercial;
- por muitos editores sem um dono claro.

## 6. Como isso funciona dentro do sistema no nivel atual

## 6.1 Nivel atual do produto

Hoje o sistema ja tem:

- schema forte;
- modulos de negocio consolidados;
- alguns seeds estruturados;
- pelo menos um importador real de empreendimentos;
- capacidade de `upsert` em dominios especificos.

Mas ainda nao tem, de forma consolidada:

- um modulo universal de importacao por lote;
- uma tela completa de governanca da base mestre;
- uma trilha funcional completa de revisao normativa.

Conclusao:

o nivel atual do sistema suporta bem um modelo de **implantacao assistida**, mas ainda nao um modelo 100% self-service de administracao de dados mestres.

## 6.2 O modelo certo agora

Agora, o recomendado e:

1. montar a planilha fora do sistema;
2. validar com o coordenador;
3. importar por lote;
4. revisar no sistema;
5. manter os dados correntes no sistema;
6. fazer grandes revisoes novamente por lote.

Em resumo:

- `cadastro mestre`: entra por planilha controlada + importador;
- `operacao corrente`: segue no sistema;
- `revisao estrutural`: volta para planilha controlada quando precisar.

## 6.3 O que tecnologia deve fazer

Tecnologia deve entregar:

1. importador;
2. validador;
3. log de erro por linha;
4. trilha de auditoria;
5. relatorio de carga;
6. controles de permissao para nao deixar qualquer perfil mudar base critica.

Tecnologia nao deve ser a dona da verdade regulatoria.

## 7. Fluxo operacional recomendado

## Etapa 1 - Curadoria

`ANALISTA`

- levanta fonte;
- preenche planilha;
- anexa fundamento legal ou documento de referencia;
- marca pontos duvidosos.

## Etapa 2 - Revisao tecnica

`COORDENADOR`

- confere aplicabilidade;
- remove ambiguidades;
- define regra final;
- aprova para carga.

## Etapa 3 - Validacao estrutural

`Tecnologia` ou `admin de dados`

- valida formato;
- valida relacionamento;
- valida duplicidade;
- retorna erro de linha quando necessario.

## Etapa 4 - Carga

`Tecnologia` ou `ADMIN_TENANT` com fluxo controlado

- executa importacao;
- gera relatorio de resultado;
- registra auditoria.

## Etapa 5 - Homologacao funcional

`COORDENADOR` + `ANALISTA`

- confere amostras no sistema;
- valida painel, vencimento e vinculos;
- libera lote para uso operacional.

## 8. RACI recomendado

## 8.1 Base normativa

- `ANALISTA`: prepara
- `COORDENADOR`: valida
- `ADMIN_TENANT`: autoriza uso interno
- `SUPER_ADMIN`/Tecnologia: carrega e audita

## 8.2 Base operacional do posto

- `REPRESENTANTE_POSTO`: fornece documentos e informacoes
- `ANALISTA`: estrutura e saneia
- `COORDENADOR`: revisa e aprova
- `Tecnologia` ou importador controlado: carrega em lote

## 8.3 Campo e evidencias

- `ANALISTA_CAMPO`: coleta
- `ANALISTA`: consolida
- `COORDENADOR`: valida
- sistema: relaciona com OS, pendencia, checklist e evidencia

## 9. O que e valido fazer agora

Faz sentido agora:

1. planilhas controladas por frente
2. lotes de importacao
3. aprovacao por coordenador
4. trilha de auditoria
5. chaves de negocio estaveis
6. separacao clara entre base mestre e dado transacional

## 10. O que seria exagero agora

Seria inventar moda se voces tentassem, ja neste momento:

1. criar um grande portal de MDM antes do primeiro ciclo real de carga;
2. criar 15 fluxos de aprovacao burocraticos;
3. exigir workflow complexo para qualquer ajuste simples;
4. proibir completamente o uso de planilha antes de ter importador maduro;
5. transformar o projeto de dados em um projeto separado do produto.

## 11. Recomendacao honesta

Minha leitura: voces estao no ponto certo para um modelo intermediario.

Nao faz sentido:

- deixar tudo manual dentro do app;
- nem construir uma mega plataforma de governanca.

Faz sentido:

- usar planilhas controladas como ponte;
- criar importadores por lote;
- colocar coordenacao regulatoria como dona do conteudo;
- deixar tecnologia dona da integracao e da seguranca da carga.

## 12. Estrutura minima de time para funcionar

Se fosse montar isso amanha, eu colocaria:

1. `1 curador normativo`
2. `1 coordenador operacional/regulatorio`
3. `1 ou 2 analistas de saneamento/cadastro`
4. `1 apoio tecnico` para importacao e ajuste estrutural

Mesmo que algumas pessoas acumulem papeis, estas funcoes precisam existir.

## 13. Regra final

Se a pergunta for:

`quem decide o conteudo?`

Resposta:

- operacao/regulatorio

Se a pergunta for:

`quem estrutura a planilha?`

Resposta:

- analista com supervisao do coordenador

Se a pergunta for:

`quem integra no sistema?`

Resposta:

- tecnologia/importador controlado

Se a pergunta for:

`isso faz sentido?`

Resposta:

- sim, e o modelo mais maduro para o nivel atual do sistema.
