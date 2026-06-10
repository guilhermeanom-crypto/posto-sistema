# 71. Relatorio da Onda 3.7.2 - Correcos de Navegacao e Runtime

## 1. Objetivo desta etapa

Executar apenas correcoes pequenas e seguras de navegacao/runtime, sem:

- criar migration;
- alterar Prisma;
- criar entidade nova;
- refatorar arquitetura;
- fazer redesign;
- abrir novo escopo de persistencia.

Esta rodada foi tratada como fechamento tecnico de navegacao pos-demo e preparacao controlada da base para a Onda 3.7.2 funcional.

## 2. Arquivos alterados

- [apps/web/src/app/equipe/(equipe)/equipe-nav.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/equipe/(equipe)/equipe-nav.tsx>)
- [apps/web/src/components/layout/app-sidebar.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/components/layout/app-sidebar.tsx>)
- [apps/web/src/app/(superadmin)/layout.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/layout.tsx>)
- [apps/web/src/app/(superadmin)/tenants/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/tenants/page.tsx>)
- [apps/web/src/app/(superadmin)/tenants/novo/actions.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/tenants/novo/actions.ts>)
- [apps/web/src/app/(superadmin)/tenants/novo/novo-tenant-form.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/tenants/novo/novo-tenant-form.tsx>)
- [apps/web/src/app/(superadmin)/tenants/[id]/actions.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/tenants/[id]/actions.ts>)

## 3. Problema identificado

### 3.1 Area de equipe/campo

Na navegacao de equipe existia um link para `/equipe/agenda`, mas a rota nao existe no `apps/web` e respondia `404`.

Impacto:

- a area de equipe continha uma entrada quebrada no menu principal;
- a navegacao de demo/local ficava inconsistente com as telas realmente disponiveis.

### 3.2 Navegacao de tenants

O estado real da aplicacao usa route group `(superadmin)`, portanto a URL real da area e `/tenants` e nao `/superadmin/tenants`.

Mesmo assim, havia referencias quebradas para `/superadmin/tenants` em tres niveis:

- entrada do `app-sidebar`;
- link principal do layout de superadmin;
- links, redirects e `revalidatePath` internos do modulo `tenants`.

Impacto:

- o atalho lateral do superadmin apontava para uma URL inexistente;
- a listagem de tenants apontava para URLs inexistentes em `novo` e `detalhe`;
- acoes de criacao, edicao e desativacao revalidavam ou redirecionavam para caminhos errados.

## 4. Correcao aplicada

### 4.1 Equipe

Em [equipe-nav.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/equipe/(equipe)/equipe-nav.tsx>):

- o item `Agenda` foi removido;
- permaneceram apenas as rotas que existem hoje na area de equipe/campo.

### 4.2 Tenants

Em [app-sidebar.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/components/layout/app-sidebar.tsx>):

- o link de superadmin foi ajustado de `/superadmin/tenants` para `/tenants`.

No modulo de superadmin:

- [layout.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/layout.tsx>) passou a usar `/tenants`;
- [tenants/page.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/tenants/page.tsx>) passou a usar `/tenants/novo` e `/tenants/[id]`;
- [tenants/novo/actions.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/tenants/novo/actions.ts>) passou a fazer `revalidatePath('/tenants')` e `redirect('/tenants')`;
- [tenants/novo/novo-tenant-form.tsx](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/tenants/novo/novo-tenant-form.tsx>) passou a cancelar para `/tenants`;
- [tenants/[id]/actions.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/web/src/app/(superadmin)/tenants/[id]/actions.ts>) passou a revalidar e redirecionar usando `/tenants` e `/tenants/[id]`.

Conclusao:

- a area `tenants` deixou de depender de URLs com prefixo inexistente;
- a navegacao interna do modulo ficou coerente com o route group real do Next.

## 5. Rotas revalidadas

### 5.1 Rotas validadas com retorno correto

Rotas revalidadas em runtime local:

- `/login`
- `/dashboard`
- `/comercial/propostas`
- `/motor-orcamento`
- `/empreendimentos/novo`
- `/operacao/handoffs`
- `/portal/login`
- `/portal/inicio`
- `/portal/documentos`
- `/equipe/login`
- `/equipe/inicio`
- `/equipe/os`

Base objetiva da validacao:

- rotas internas foram rechecadas com `posto_access` obtido via `POST /api/v1/auth/login` usando `admin@postodemo.com.br / Demo@1234`;
- portal foi rechecado com a sessao demo atual do portal;
- equipe foi rechecada com o cookie local `habilis_equipe`.

Indicadores observados:

- `/dashboard` retornou `Dashboard | Posto Compliance`;
- `/motor-orcamento` retornou `Motor de Orcamento - Painel da Conducao | Posto Compliance`;
- `/empreendimentos/novo` retornou `Cadastrar Novo Posto | Posto Compliance`;
- `/portal/inicio` retornou `Inicio | Portal Habilis Posto`;
- `/portal/documentos` retornou `Portal do Cliente - Documentos | Portal Habilis Posto`;
- `/equipe/inicio` retornou `Painel da Equipe | Equipe Habilis Posto`;
- `/equipe/os` retornou `Minhas OS | Equipe Habilis Posto`.

### 5.2 Validacao final de `/tenants`

Foi confirmado que o seed principal nao expunha conta pronta de `SUPER_ADMIN`.

Verificacao objetiva:

- consulta direta ao banco local retornou `0 rows` para `perfil = 'SUPER_ADMIN'`;
- o seed principal em [apps/api/prisma/seed.ts](</home/guilherme/Projetos VS CODE/Posto/sistema/apps/api/prisma/seed.ts>) continua documentando apenas `ADMIN_TENANT`, `COORDENADOR` e `ANALISTA`.

Para fechar a validacao sem alterar Prisma, migration, seed ou arquitetura, foi feito o menor provisionamento local/dev possivel:

- insercao de 1 usuario dedicado no banco local `posto_dev`;
- e-mail criado: `superadmin.local@postodemo.com.br`;
- nome: `Super Admin Local`;
- perfil: `SUPER_ADMIN`;
- senha reaproveitada da hash ja valida do `admin@postodemo.com.br`, portanto a credencial funcional ficou:
  - `superadmin.local@postodemo.com.br`
  - `Demo@1234`

Escopo da alteracao:

- apenas banco local de desenvolvimento;
- nenhuma alteracao em seed;
- nenhuma alteracao em env;
- nenhuma alteracao em Prisma;
- nenhuma migration.

Com esse usuario, a validacao foi concluida assim:

- `POST /api/v1/auth/login` retornou token com perfil `SUPER_ADMIN`;
- `GET /api/v1/tenants?limit=5` retornou a lista de tenants com sucesso;
- `GET /tenants` no web abriu sem redirecionar para `/login` nem `/dashboard`, exibindo a listagem com `1 tenant cadastrado`.

Resumo do caso:

- a navegacao de `/tenants` ficou corrigida;
- a validacao end-to-end de `/tenants` foi concluida com usuario `SUPER_ADMIN` local;
- o caminho de validacao local agora esta documentado e repetivel.

## 6. Pendencias reais apos esta rodada

- o ambiente local agora depende de um provisionamento manual de `SUPER_ADMIN` para repetir a validacao de `/tenants`, ja que isso ainda nao vem do seed principal;
- a area de equipe/campo continua em modelo demo/local e ainda nao representa persistencia end-to-end;
- portal e dashboard continuam com caminhos de fallback/demo em partes do fluxo, embora a navegacao principal tenha sido validada.

## 7. Recomendacao para a proxima etapa

Proximo passo tecnico mais seguro para a continuidade da Onda 3.7.2:

1. se quisermos repetibilidade limpa do ambiente, registrar em documento operacional interno o provisionamento local/dev do `SUPER_ADMIN`, sem promover isso a seed principal nesta etapa;
2. encerrar a rodada de navegacao e nao abrir novas correcoes visuais;
3. iniciar a Onda 3.7.2 funcional focando somente no proximo incremento do handoff operacional ja existente, sem nova modelagem ampla nem nova persistencia fora do recorte autorizado.

Nao houve:

- alteracao de Prisma;
- criacao de migration;
- alteracao de seed;
- alteracao de env;
- criacao de modulo novo;
- refatoracao estrutural;
- redesign.
