# 99. Plano de Consolidação da Base Normativa e Operacional

Data: 2026-06-11

## 1. Resposta curta

Para consolidar a base normativa e operacional, o caminho não é abrir mais infraestrutura. O caminho é montar uma **esteira de dados confiável** com:

1. fonte oficial definida;
2. planilha/base canônica por frente;
3. validação técnica antes da carga;
4. importação controlada por lote;
5. auditoria e revisão após carga;
6. automações usando os dados já estruturados.

Em outras palavras: **tirar o conhecimento da cabeça, dos PDFs e dos seeds demo, e transformar isso em dado mestre versionado dentro do sistema**.

## 2. O modelo certo

Separar a implantação em `3` camadas:

### Camada A — Base normativa mestre

Dados que mudam pouco, mas sustentam regra, prazo, checklist, alerta e diagnóstico.

Exemplos:

- órgãos reguladores;
- tipos de processo;
- fases de processo;
- tipos de documento;
- requisitos por tipo de processo;
- obrigações regulatórias;
- limites de parâmetros;
- regras automáticas;
- templates de checklist.

### Camada B — Base operacional inicial por empreendimento

Dados reais de cada posto/unidade no momento do onboarding.

Exemplos:

- cadastro do empreendimento;
- licenças;
- alvarás;
- processos;
- documentos;
- condicionantes;
- funcionários;
- ASOs;
- PGR/PCMSO;
- bombas;
- tanques;
- estanqueidade;
- PGRS;
- transportadoras;
- MTR/CCR;
- poços/outorga;
- laudos/campanhas.

### Camada C — Dados transacionais contínuos

Dados alimentados no dia a dia da operação.

Exemplos:

- novas evidências;
- pendências;
- checklist executado;
- versões de documentos;
- alertas;
- snapshots de compliance;
- autos, defesa e recurso;
- ordens de serviço e entregáveis.

## 3. Como fazer na prática

## 3.1 Passo 1 — Definir a “fonte da verdade” por frente

Cada frente precisa ter:

- `dono funcional`: quem valida o conteúdo;
- `fonte oficial`: lei, norma, licença, condicionante, termo de referência, órgão, documento do cliente;
- `escopo`: nacional, estadual, municipal ou específico por cliente;
- `regra de atualização`: quando revisar.

Exemplo:

- obrigações ambientais: CONAMA + órgão estadual + condicionantes reais;
- urbano/AVCB: prefeitura + bombeiros + documentos emitidos;
- água/outorga: órgão gestor hídrico + laudos + dados do poço;
- SST: NRs + documentos da clínica/segurança do trabalho.

Sem isso, a base vira cadastro “bonito”, mas não confiável.

## 3.2 Passo 2 — Criar uma planilha canônica por frente

Antes de importar para o banco, criar uma planilha mestre por frente.

Essa planilha deve ter sempre:

- `codigo`;
- `descricao`;
- `aplicabilidade`;
- `fonte legal ou documental`;
- `periodicidade`;
- `tipo de evidência exigida`;
- `prazo`;
- `criticidade`;
- `responsável`;
- `UF/município`, quando aplicável;
- `status de revisão`.

Exemplos de planilhas:

1. `cadastro_orgaos_reguladores`
2. `matriz_tipos_documento`
3. `matriz_tipos_processo`
4. `matriz_requisitos_processo`
5. `matriz_obrigacoes_regulatorias`
6. `matriz_limites_parametros`
7. `cadastro_empreendimentos`
8. `dossie_documental_inicial`
9. `cadastro_licencas_condicionantes`
10. `cadastro_sst`
11. `cadastro_equipamentos_sasc_anp`
12. `cadastro_pgrs_residuos`
13. `cadastro_outorga_monitoramento`

## 3.3 Passo 3 — Mapear cada planilha para o schema atual

O sistema já tem grande parte dos destinos. O trabalho aqui é amarrar planilha → tabela/modelo.

Mapeamento principal:

- órgãos → `OrgaoRegulador`
- tipos de processo → `TipoProcesso`
- fases → `FaseTipoProcesso`
- tipos de documento → `TipoDocumento`
- requisitos → `RequisitoTipoProcesso`
- obrigações base → `ObrigacaoRegulatoriaBase`
- limites → `LimiteParametro`
- empreendimento → `Empreendimento`
- processo → `Processo`
- documento → `Documento` / `DocumentoVersao`
- licença → `LicencaAmbiental`
- condicionante → `Condicionante` e `condicaoLicenca`
- SST → `Funcionario`, `ASO`, `DocumentoSST`, `TreinamentoExecucao`, `EntregaEPI`
- equipamentos → `BombaAbastecimento`, `Tanque`, `TesteEstanqueidade`
- resíduos → `PGRS`, `PGRSExigencia`, `Transportadora`, `MTR`, `CCR`
- água → `PocoArtesiano`, `LaudoAgua`
- monitoramento → `PocoMonitoramento`, `CampanhaMonitoramento`, `ParametroContaminante`, `LimiteParametro`

## 3.4 Passo 4 — Não cadastrar tudo manualmente na interface

O jeito mais seguro para a implantação inicial é:

1. consolidar a planilha;
2. validar a planilha;
3. importar por lote com `upsert`;
4. revisar no sistema;
5. só depois manter pela interface.

Isso evita:

- digitação inconsistente;
- duplicidade;
- nomes diferentes para a mesma obrigação;
- vencimentos sem padrão;
- documento sem vínculo com regra.

## 3.5 Passo 5 — Criar importadores por lote

Hoje já existe base para esse padrão:

- importação em lote de empreendimentos via onboarding em [onboarding.routes.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/onboarding/onboarding.routes.ts:84)
- `upsert` de limites no monitoramento em [monitoramento.service.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/modules/monitoramento/monitoramento.service.ts:218)
- seeds já mostram o padrão de carga controlada em `prisma/seed*.ts`

O próximo passo correto é criar importadores específicos para:

1. obrigações regulatórias
2. tipos de documento
3. requisitos por processo
4. limites de parâmetros
5. dossiê documental inicial
6. licenças e condicionantes
7. SST
8. equipamentos
9. resíduos
10. outorga e monitoramento

Padrão técnico recomendado para todos:

- receber CSV/JSON pré-validado;
- normalizar campos;
- fazer `upsert` por chave de negócio;
- gerar relatório de `criados`, `atualizados`, `ignorados`, `erros`;
- registrar auditoria do lote.

## 3.6 Passo 6 — Versionar a base normativa

Base normativa não pode ser só “o valor atual”.

Cada regra importante precisa guardar:

- referência legal;
- data de vigência;
- observação de aplicabilidade;
- status da revisão;
- responsável pela revisão;
- versão.

Isso é especialmente importante para:

- obrigações regulatórias;
- limites de parâmetros;
- templates de checklist;
- regras automáticas;
- requisitos por processo.

## 3.7 Passo 7 — Ligar o motor automático à base estruturada

Hoje parte do diagnóstico ainda olha nome de documento e heurística.

O alvo correto é:

`obrigação -> evidência esperada -> documento/tabela válida -> prazo -> alerta -> score`

Exemplo:

- obrigação: licença LO vigente;
- evidência válida: `LicencaAmbiental.status = VIGENTE`;
- prazo: `dataVencimento`;
- alerta: 180/120/90/60/30 dias;
- impacto no score: alto.

Enquanto isso não estiver amarrado por chave e regra estruturada, o motor continua “inteligente”, mas não plenamente confiável.

## 4. Ordem recomendada de implantação

## Fase 1 — Base normativa mestre

Foco: fazer o sistema saber o que é exigido.

Entregar primeiro:

1. órgãos reguladores
2. tipos de documento
3. tipos de processo
4. fases
5. requisitos por processo
6. obrigações regulatórias base
7. limites de parâmetros
8. templates de checklist
9. regras automáticas

Resultado esperado:

- o sistema passa a ter matriz base oficial, não só seed demo.

## Fase 2 — Onboarding real por empreendimento

Foco: fazer cada posto nascer com dossiê mínimo.

Entregar:

1. empreendimentos
2. processos ativos
3. documentos iniciais
4. licenças
5. condicionantes
6. alvarás/AVCB/sanitário
7. responsáveis e acessos

Resultado esperado:

- cada posto entra no sistema com contexto regulatório real.

## Fase 3 — Operação técnica real

Foco: trazer os domínios que geram maior risco operacional.

Entregar:

1. SST
2. ANP/INMETRO
3. SASC/estanqueidade
4. PGRS/resíduos
5. água/outorga
6. monitoramento ambiental

Resultado esperado:

- o sistema deixa de ser só dossiê regulatório e vira espelho da operação técnica.

## Fase 4 — Inteligência e automação

Foco: usar a base consolidada para operar melhor.

Entregar:

1. alertas calibrados
2. score de compliance revisado
3. checklist vinculado à obrigação
4. motor de gap analysis baseado em chave estruturada
5. workflows automáticos de renovação e pendência

Resultado esperado:

- o sistema passa a antecipar problema, não só registrar problema.

## 5. Como organizar o trabalho sem travar a operação

Não tentar “cadastrar tudo” de uma vez.

Trabalhar por lotes:

### Lote A — o que trava licenciamento e fiscalização

- licenças;
- condicionantes;
- AVCB/alvarás;
- ANP;
- estanqueidade;
- outorga;
- PGR/PCMSO/ASO;
- PGRS/MTR.

### Lote B — o que melhora governança e rastreabilidade

- versões documentais;
- requisitos detalhados;
- regras automáticas;
- score;
- templates revisados;
- terceiros homologados.

### Lote C — o que escala a operação

- automações;
- painéis;
- integração de campo;
- catálogo técnico;
- comparativos por cliente/rede/região.

## 6. O que precisa ser construído no sistema

Para esse plano funcionar direito, eu recomendaria construir ou consolidar:

1. `importadores por lote` para as frentes prioritárias;
2. `modelo de versionamento` de base normativa;
3. `relatório de inconsistências` pós-importação;
4. `dashboard de completude por empreendimento`;
5. `dashboard de completude da base normativa`;
6. `vínculo formal obrigação -> evidência -> documento/tabela`;
7. `fila de revisão funcional` para dados críticos.

## 7. Critério de pronto

Você vai saber que a base foi consolidada quando:

1. um posto novo puder ser importado com dossiê mínimo sem retrabalho manual;
2. o gap analysis depender mais de regra estruturada do que de heurística;
3. os vencimentos críticos saírem dos dados reais e não de seed;
4. cada obrigação tiver evidência, prazo e responsável claros;
5. o time conseguir operar sem depender de memória individual ou PDF solto.

## 8. Conclusão prática

“Consolidar a base normativa e operacional” significa criar um processo repetível:

- capturar a regra;
- padronizar a regra;
- carregar a regra;
- validar a regra;
- ligar a regra ao fluxo operacional.

O caminho mais eficiente aqui é:

1. `planilha canônica`
2. `importador`
3. `validação`
4. `auditoria`
5. `automação`

Sem isso, o sistema continua com boa estrutura, mas ainda dependente de seed demo, leitura manual e interpretação humana. Com isso, ele passa a refletir de verdade a operação real.
