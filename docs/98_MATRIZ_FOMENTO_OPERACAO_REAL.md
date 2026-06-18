# 98. Matriz de Fomento para Operação Real

Data: 2026-06-11

## 1. Objetivo

Traduzir a auditoria do sistema em uma matriz prática de implantação, respondendo:

- quantos bancos/serviços de persistência existem de fato;
- quantas frentes de dados precisam ser fomentadas no banco atual;
- o que já está modelado;
- o que já tem seed/demo;
- o que ainda falta para aderir à operação real e aos documentos oficiais.

## 2. Resumo Executivo

### 2.1 Infra de persistência

Hoje o sistema já está organizado para operar com:

- `1` banco principal relacional: `PostgreSQL`
- `1` store de fila/cache: `Redis`
- `1` storage documental: `MinIO`

Conclusão: **não há necessidade aparente de criar mais bancos de dados** para aderir à operação real. O trabalho principal está em **fomentar melhor o banco principal** e consolidar as regras/documentos no domínio já existente.

### 2.2 Tamanho atual do domínio

- schema Prisma com `83` modelos;
- seed atual tocando diretamente cerca de `47` modelos;
- portanto, existe uma diferença relevante entre o que está modelado e o que já entra por carga inicial realista.

### 2.3 Leitura objetiva

O sistema já possui boa parte da estrutura de dados e dos módulos operacionais. A lacuna central está em quatro pontos:

1. dados mestres regulatórios ainda genéricos para uma operação real por órgão/UF/município;
2. carga operacional ainda muito baseada em seed demo;
3. alguns domínios críticos dependem de uso manual contínuo em vez de carga inicial estruturada;
4. o diagnóstico automático ainda usa heurísticas e não substitui uma matriz normativa consolidada.

## 3. Escala de leitura

- `SIM`: estrutura presente e já utilizável
- `PARCIAL`: estrutura presente, mas seed/carga/regra ainda insuficiente
- `NAO`: não identificado como consolidado para operação real
- `P1`: essencial para go-live aderente
- `P2`: importante para escalar com segurança
- `P3`: complementar

## 4. Matriz de Fomento

| Frente | Modelado no sistema | Seed/carga atual | Lei | Gestão | Aderência hoje | Fomento necessário | Prioridade |
|---|---|---|---|---|---|---|---|
| Infra de persistência | `SIM` | `SIM` | Alta | Alta | `PostgreSQL + Redis + MinIO` já cobrem a base técnica | manter stack atual; não ampliar bancos sem necessidade real | `P1` |
| Cadastros regulatórios base | `SIM` | `SIM` | Alta | Alta | há `OrgaoRegulador`, `TipoProcesso`, `FaseTipoProcesso`, `TipoDocumento`, `RequisitoTipoProcesso`, `ObrigacaoRegulatoriaBase` | detalhar por órgão, UF, município, tipo de posto, etapa processual e documento oficial exigido | `P1` |
| Tenant, empresa, usuários e acessos | `SIM` | `SIM` | Média | Alta | base multi-tenant pronta e seedada | trocar carga demo por estrutura real de clientes, responsáveis e perfis operacionais | `P1` |
| Empreendimentos e acessos por unidade | `SIM` | `SIM` | Alta | Alta | domínio existe e suporta carteira real | fomentar cadastro completo de cada posto/unidade, vínculos de acesso e responsáveis | `P1` |
| Processos regulatórios | `SIM` | `SIM` | Alta | Alta | existe trilha de processo, fase e requisito | cadastrar processos reais por órgão e por empreendimento; remover dependência de processo genérico/demo | `P1` |
| Documentos e versões | `SIM` | `PARCIAL` | Alta | Alta | documentos existem, mas intake inicial ainda é limitado e muito orientado a demo | montar dossiê documental real por tipo, validade, versão, origem, responsável e evidência | `P1` |
| Licenças ambientais e condicionantes | `SIM` | `SIM` | Alta | Alta | módulo real existe e já recebe seed operacional | trocar licenças/condições fictícias por licenças reais, condicionantes reais, prazos e evidências por unidade | `P1` |
| Alvarás, AVCB e urbano/sanitário | `SIM` | `SIM` | Alta | Alta | `AlvaraUrbanistico` está modelado e seeded em cenários | fomentar AVCB, alvará de funcionamento, habite-se e sanitária conforme município/unidade | `P1` |
| Fiscalizações, autos, defesa e recurso | `SIM` | `SIM` | Alta | Alta | trilha jurídica/regulatória existe e suporta histórico | alimentar autos reais, prazos, peças, revisões e resultados por órgão fiscalizador | `P2` |
| SST: funcionários, ASO e documentos-base | `SIM` | `PARCIAL` | Alta | Alta | há `Funcionario`, `ASO`, `DocumentoSST`; parte seedada | completar carga de PCMSO/PGR, ASO real, histórico de colaboradores e documentos obrigatórios por unidade | `P1` |
| SST: treinamentos e EPIs | `SIM` | `PARCIAL` | Alta | Alta | existem `TreinamentoTipo`, `TreinamentoExecucao`, `EntregaEPI`, mas a carga inicial não aparece consolidada | estruturar matriz real de NR-20, brigada, CIPA, EPIs, vencimentos e reciclagens | `P1` |
| ANP / INMETRO / equipamentos | `SIM` | `SIM` | Alta | Alta | bombas e itens correlatos estão modelados e seedados em cenários | fomentar bombas reais, certificados, calibrações, lacres, vencimentos e histórico por equipamento | `P1` |
| Estanqueidade / SASC / tanques | `SIM` | `SIM` | Alta | Alta | tanques e testes existem com domínio específico | cadastrar tanques reais, histórico de testes, empresas executoras e laudos válidos | `P1` |
| PGRS e exigências | `SIM` | `SIM` | Alta | Alta | `PGRS`, `PGRSExigencia` e regras existem | trocar base demo por PGRS real de cada operação, com plano, exigências, prazos e evidências | `P1` |
| Logística reversa e resíduos | `SIM` | `PARCIAL` | Alta | Alta | `Transportadora` e `MTR` aparecem seedados; `CCR` existe no schema, mas não ficou evidente na carga inicial | consolidar transportadoras homologadas, MTRs, CCRs e rastreabilidade de destinação por resíduo | `P1` |
| Outorga hídrica e água potável | `SIM` | `PARCIAL` | Alta | Alta | `PocoArtesiano` e `LaudoAgua` existem e entram em cenário operacional | fomentar outorgas reais, vigências, vazões, laudos oficiais e parâmetros exigidos por operação | `P1` |
| Monitoramento ambiental e poços | `SIM` | `PARCIAL` | Alta | Alta | `PocoMonitoramento`, campanhas e parâmetros existem, mas a base mestre de limites ainda não aparece consolidada | carregar poços reais, campanhas históricas, parâmetros, VMPs e planos de ação por não conformidade | `P1` |
| Limites e parâmetros ambientais | `SIM` | `NAO` | Alta | Alta | `LimiteParametro` e `ParametroContaminante` existem no schema, mas não apareceram de forma clara na seed | montar base normativa de parâmetros, limites e critérios por matriz, órgão e laudo | `P1` |
| Checklists operacionais | `SIM` | `SIM` | Alta | Alta | há `11` templates seedados com foco em posto de combustível | revisar templates contra POPs reais da operação e amarrar versionamento/aprovação por cliente ou perfil de posto | `P2` |
| Campo: OS, checklists, pendências e evidências | `SIM` | `PARCIAL` | Alta | Alta | app de campo já foi consolidado como fluxo real, mas depende de uso operacional e padrões internos | definir POPs de execução, taxonomia de achados, critérios de evidência e revisão interna | `P1` |
| Alertas, snapshots e score de compliance | `SIM` | `PARCIAL` | Alta | Alta | existe trilha de alerta e snapshot, porém muito alimentada por cenários | calibrar score, gatilhos e severidades com base em regra real e histórico de operação | `P2` |
| Portal do cliente / intake documental | `SIM` | `PARCIAL` | Alta | Alta | existe fluxo real, mas o seed do portal contempla apenas `14` solicitações documentais | ampliar para matriz documental por tipo de processo, fase, órgão e exceções justificáveis | `P1` |
| Catálogo comercial, precificação e handoff | `SIM` | `SIM` | Baixa | Alta | estrutura forte para gestão comercial-operacional | ajustar catálogo e handoff ao portfólio real e aos pacotes efetivamente vendidos | `P2` |
| Regras automáticas | `SIM` | `PARCIAL` | Alta | Alta | existe `RegraAutomatica`, com seed focado em PGRS | ampliar automações por licença, condicionante, SST, ANP, água, fiscalização e campo | `P1` |
| Diagnóstico automático / motor legal | `SIM` | `NAO` | Alta | Alta | o motor existe, mas parte das checagens ainda depende de heurística por nome de documento | substituir heurísticas por matriz oficial de obrigação x evidência x prazo x órgão x aplicabilidade | `P1` |

## 5. Quantificação Prática

### 5.1 Quantos bancos/serviços precisamos manter

- `3` componentes de persistência/estado no total:
- `1` banco relacional
- `1` store de cache/fila
- `1` storage de arquivos

### 5.2 Quantas frentes de fomento precisamos tratar

Leitura recomendada para implantação:

- `21` frentes `P1`
- `4` frentes `P2`
- `0` frentes `P3` relevantes neste recorte

Total auditado nesta matriz: `25` frentes de fomento.

## 6. Lote Mínimo para Operação Real

Se a meta for colocar o sistema aderente à operação real de forma segura, o lote mínimo é:

1. cadastros regulatórios base;
2. empreendimentos reais;
3. processos reais;
4. dossiê documental real;
5. licenças e condicionantes reais;
6. urbano/AVCB/sanitário;
7. SST base;
8. treinamentos e EPIs;
9. ANP/INMETRO;
10. estanqueidade/SASC;
11. PGRS e resíduos;
12. outorga/água/monitoramento;
13. limites e parâmetros;
14. portal documental;
15. regras automáticas;
16. motor legal de diagnóstico.

## 7. Principal Conclusão

O sistema **já tem estrutura suficiente para operar no mesmo banco principal**. O que falta não é multiplicar a infraestrutura; é **fomentar e consolidar a base de dados normativa e operacional**.

Em termos práticos:

- **não precisamos de mais bancos;**
- precisamos de **mais carga mestre, mais carga documental e mais regra oficial consolidada**;
- o maior risco atual não é técnico de infraestrutura, e sim **aderência de conteúdo regulatório e operacional**.

## 8. Fontes Internas Utilizadas

- `README.md`
- `docker-compose.yml`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `apps/api/prisma/seed-portal-demo.ts`
- `apps/api/prisma/seed/checklists.ts`
- `apps/api/prisma/seed/obrigacoes-regulatorias.ts`
- `apps/api/prisma/seed/operational-scenarios.ts`
- `apps/api/prisma/seed/pgrs-regras.ts`
- `apps/api/prisma/seed/servicos-consultoria.ts`
- `apps/api/prisma/seed/servicos-consultoria-base-interface.ts`
- `apps/api/src/modules/onboarding/gap-analysis.service.ts`
- `docs/84_PLANO_INTEGRACAO_SITE_PORTAL_CAMPO_CORE.md`
- `docs/96_LINHA_DO_TEMPO_E_INDICE.md`
- `docs/97_CONSOLIDACAO_E_PROXIMOS_PASSOS.md`
