# Prompt de Auditoria do Sistema — Hábilis Posto

> COMO USAR: copie TUDO abaixo da linha e cole numa conversa nova com o Claude Code
> (ou outra IA com acesso ao código). Não precisa adaptar nada — o prompt é
> auto-contido. Ao final você recebe um relatório com problemas classificados por
> gravidade e os próximos passos para consolidar.

---

Você é um auditor técnico sênior. Faça uma auditoria COMPLETA e HONESTA do sistema neste repositório. NÃO altere nenhum arquivo — apenas investigue e produza um relatório. Use os comandos e ferramentas para verificar EMPIRICAMENTE (ler código, rodar testes, typecheck), não apenas teoria. Se algo estiver bom, diga que está bom; se estiver quebrado, prove com o arquivo e a linha.

## Contexto do sistema (para você se situar)

- Monorepo Turborepo + pnpm. Raiz: `/home/guilherme/Projetos VS CODE/Posto/sistema`.
- Apps: `apps/api` (Fastify 4 + Prisma 5 + PostgreSQL), `apps/web` (Next.js 15 App Router), `apps/site` (Next.js institucional), `apps/worker` (BullMQ).
- Pacotes: `packages/types`, `packages/schemas`, `packages/utils`.
- Domínio: SaaS multi-tenant de consultoria regulatória para postos de combustível (ambiental, SST, ANP/Inmetro). Fluxo central: Proposta → Handoff → Contrato → Ordem de Serviço → Entregável → Financeiro.
- Infra local via Docker: Postgres (5432), Redis (6379), MinIO (9000/9001), MailHog (8025).
- Auth: JWT + Argon2 + multi-tenant (toda tabela de domínio tem `tenantId`).
- Histórico: o sistema já passou por uma onda de estabilização (docs 87–92). Verifique se ela continua íntegra e o que ainda falta.

## Dimensões a auditar (cubra TODAS)

### 1. Segurança
- Autenticação: tratamento do segredo JWT, expiração de token, rotação de refresh token, proteção contra força bruta (rate limit no login), hash de senha (argon2id em TODAS as chamadas), tokens (magic link / portal) guardados com hash e não em texto puro.
- Autorização: toda rota protegida por `authenticate`? Regras de perfil (RBAC) aplicadas? Algum endpoint sensível sem checagem?
- Multi-tenant: TODA query inclui `tenantId`? Existe risco de um cliente ver dados de outro?
- Injeção: algum `$queryRaw`/`$executeRaw` com concatenação de string (risco de SQL injection)?
- Exposição de dados: respostas vazam hash de senha, segredos, ou stack trace em produção? `.env` está no `.gitignore`? Há segredo hardcoded no código?
- Upload de arquivo: limite de tamanho e validação de tipo (MIME)?
- Variáveis de ambiente obrigatórias: o `.env.example` documenta TODAS as variáveis que o `env.ts` exige? (Senão o deploy quebra no boot.)
- Cabeçalhos de segurança (Helmet), CORS restrito, rate limit global.

### 2. Backend e arquitetura
- Consistência de módulos: todos seguem o padrão routes + service (+ schemas/types)? Liste os que têm lógica "grudada" na rota (routes-only) e avalie se é trivial (aceitável) ou se merece extração de service.
- Tratamento de erros: existe handler global? Erros de domínio, validação e desconhecidos são tratados de forma padronizada?
- Validação de entrada: toda rota tem schema (Zod)? Algum `any` perigoso em handler?
- Cada rota registrada em `app.ts` corresponde a um módulo real? Algum módulo órfão (código sem rota) ou rota sem módulo?

### 3. Banco de dados (Prisma)
- Tabelas de ALTO volume (ex: AuditLog, Usuario, Tarefa) têm índices adequados? Aponte queries que varrem tabela sem índice.
- Modelos sem `tenantId` — são intencionais (catálogo global / sub-entidade que herda do pai) ou é falha de isolamento?
- Migrations: estão versionadas e aplicadas? `prisma migrate status` está "up to date"? Há divergência entre schema e migrations?
- Nomenclatura: modelos sem `@@map` (inconsistência de nome de tabela)?
- Integridade referencial: FKs com `onDelete` apropriado?

### 4. Qualidade de código e consistência
- Duplicação: tipos redefinidos no frontend que já existem no backend ou em `packages/types`? Quantos e onde?
- Helpers/funções copiados (copy-paste) entre arquivos em vez de compartilhados?
- Código morto: exports/arquivos sem uso? Imports de mock ainda presentes?
- Frontend: alguma tela ainda usa dados mockados (estáticos) em vez da API real? Liste-as.
- Datas/serialização: o contrato entre frontend (string ISO) e backend (Date) é consistente? Algum BigInt/Decimal que quebra serialização JSON?

### 5. Testes
- Rode `cd apps/api && pnpm test` e reporte o total verde/vermelho.
- Quantos dos módulos têm teste vs não têm? Calcule a % de cobertura por módulo.
- Os módulos do FLUXO CRÍTICO (proposta, handoff, contrato, OS, entregável, financeiro, documentos, processos, condicionantes) estão cobertos?
- Há testes frouxos (que aceitam erro, ex: `expect(status).not.toBe(401)` em vez de `toBe(200)`) escondendo bugs?

### 6. Frontend (Next.js)
- Type-check limpo? Rode `cd apps/web && pnpm typecheck`.
- Páginas estáticas/placeholder que deveriam ter dados reais?
- Tipos de resposta da API alinhados com o que o backend realmente devolve?

### 7. Worker e filas (BullMQ)
- Toda fila definida em `apps/api/src/infra/queue/bullmq.ts` tem um processor correspondente no worker? E vice-versa (processor sem fila / fila sem processor)?
- Jobs têm retry/backoff configurado?

### 8. Infra, deploy e operação
- `docker-compose.prod.yml` coerente com as variáveis do `.env.example`?
- Health check (`/health`) verifica dependências (DB, Redis)?
- Logs estruturados? Há `console.log` esquecido em código de produção?
- Algum segredo de exemplo perigoso no `.env.example`?

### 9. Performance e escala (sinais, não otimização prematura)
- Queries N+1 evidentes? Listagens sem paginação? Falta de `select` trazendo colunas pesadas desnecessárias?

## Como executar a verificação

- Rode: `cd apps/api && pnpm typecheck` e `pnpm test`; `cd apps/web && pnpm typecheck`; `npx prisma migrate status` (em apps/api).
- Leia os arquivos reais antes de afirmar qualquer coisa. Cite caminho e linha.
- Se um agente/subprocesso for usado, valide o resultado de forma independente (não confie apenas no resumo).

## Formato do relatório (entregue exatamente assim)

1. **Resumo executivo** — 5 linhas, em linguagem simples (o dono do produto não é programador): o sistema está saudável? O que é urgente?
2. **Achados por gravidade** — tabela com colunas: ID, Gravidade (CRÍTICO / ALTO / MÉDIO / BAIXO), Dimensão, Arquivo:linha, Problema, Como corrigir.
   - CRÍTICO = bloqueia produção ou risco de vazamento/perda de dados.
   - ALTO = corrigir logo; risco real.
   - MÉDIO = melhoria recomendada.
   - BAIXO = cosmético / nice-to-have.
3. **O que está SAUDÁVEL** — liste o que está bem feito (para o dono saber o que defender).
4. **Métricas** — testes verde/total, % de módulos cobertos, nº de falhas por gravidade, migrations OK?, typecheck OK?
5. **Plano de consolidação priorizado** — lista ordenada do que atacar primeiro, com esforço estimado (rápido / médio / longo) e dependências.

## Regras
- NÃO modifique nenhum arquivo. Auditoria é somente leitura + execução de testes/typecheck.
- Seja honesto e específico. Nada de elogio vazio nem alarmismo. Prove cada achado.
- Se encontrar algo que eu (dono, não-técnico) não saberia nomear, explique em 1 frase simples o que é e por que importa.
- Ao final, pergunte se devo começar a corrigir o item de maior prioridade.
