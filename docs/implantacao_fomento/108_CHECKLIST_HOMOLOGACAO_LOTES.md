# 108. Checklist de Homologacao dos Lotes

Data: 2026-06-11

## 1. Regra de amostragem

No primeiro ambiente controlado:

- lotes pequenos: validar `100%`
- lotes medios: validar `10 linhas ou 20%`, o que for maior
- lotes grandes: validar `20 linhas ou 10%`, o que for maior

Sempre incluir na amostra:

- 1 linha simples
- 1 linha com relacionamento
- 1 linha com data/vencimento
- 1 linha com evidência/documento
- 1 linha com excecao, se houver

## 2. Checklist comum a todo lote

1. o arquivo carregado e o arquivo homologado sao o mesmo lote
2. o total de linhas processadas bate com o relatorio
3. nao ha erro bloqueante aberto
4. os registros aparecem no tenant correto
5. os relacionamentos principais foram resolvidos
6. a auditoria foi gravada

## 3. Lote 1 - Base normativa

Validar:

1. orgaos aparecem corretamente
2. tipos de documento estao classificados
3. tipos de processo estao vinculados ao orgao certo
4. requisitos estao ligados ao processo certo
5. obrigacoes tem fundamento legal rastreavel
6. limites estao visiveis por meio
7. nenhuma linha usa fonte com status diferente de `VIGENTE`

## 4. Lote 2 - Cadastro operacional base

Validar:

1. usuarios foram criados com perfil correto
2. empreendimentos aparecem com dados basicos corretos
3. acessos foram aplicados corretamente
4. nao houve troca de tenant, empresa ou codigo interno

## 5. Lote 3 - Regulatorio por unidade

Validar:

1. processo aparece no empreendimento correto
2. documento aparece no processo correto
3. licenca aparece com vencimento correto
4. condicionantes aparecem vinculadas ao caso correto
5. alvaras aparecem com tipo e vencimento corretos

## 6. Lote 4 - Operacao tecnica

Validar:

1. SST aparece na unidade correta
2. bombas e tanques aparecem com numeracao correta
3. testes de estanqueidade aparecem no tanque correto
4. MTR/CCR aparecem com rastreabilidade correta
5. PGRS e exigencias aparecem ligados ao empreendimento
6. pocos, laudos e campanhas aparecem na unidade correta

## 7. Critérios de rejeição

Rejeitar o lote quando:

1. houver erro de tenant
2. houver erro de relacionamento critico
3. vencimento estiver errado em amostra critica
4. fundamento legal estiver sem rastreabilidade
5. documento nao autenticado tiver entrado como oficial

## 8. Saida da homologacao

Toda homologacao deve terminar com:

- `HOMOLOGADO`
- `HOMOLOGADO_COM_RESTRICAO`
- `REJEITADO`

E com:

- nome do homologador
- data
- lote
- observacoes
