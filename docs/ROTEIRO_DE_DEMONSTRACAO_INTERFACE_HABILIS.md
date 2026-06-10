# Roteiro de Demonstração · Interface Hábilis

Documento prático para subir o ambiente local e conduzir uma apresentação do
ecossistema Hábilis (site oficial + sistema interno + portal do cliente + área
de campo) com o padrão visual aprovado: conteúdo central, imagens contextuais
nas bordas, fade suave, cards leves e identidade Hábilis.

---

## 1. Como subir o projeto localmente

### Pré-requisitos
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose (para infra: Postgres, Redis, MinIO, MailHog)
- Variáveis de ambiente: copiar `.env.example` para `.env` na raiz, se ainda
  não houver `.env`.

### Passo a passo
```bash
# 1. Instalar dependências
pnpm install

# 2. Subir infra local (Postgres, Redis, MinIO, MailHog)
pnpm demo:infra

# 3. (Primeira vez) gerar Prisma + aplicar migrações + seed
pnpm --filter @repo/api db:generate
pnpm --filter @repo/api db:migrate
pnpm --filter @repo/api db:seed

# 4. Subir API (terminal dedicado)
pnpm demo:api

# 5. Subir site + sistema/web (em paralelo, em outro terminal)
pnpm demo
```

> `pnpm demo` é apenas um atalho para `turbo run dev` nos pacotes
> `@posto/site` e `@posto/web` em paralelo. Não inventa serviço novo, não
> altera autenticação, não muda regras de negócio.

---

## 2. Comandos reais (cheat sheet)

| Objetivo | Comando |
|---|---|
| Subir infra local (Postgres/Redis/MinIO/MailHog) | `pnpm demo:infra` |
| Subir site oficial (porta 3100) + sistema (porta 3000) em paralelo | `pnpm demo` |
| Subir apenas site oficial | `pnpm demo:site` |
| Subir apenas sistema/web | `pnpm demo:web` |
| Subir apenas API | `pnpm demo:api` |
| Lint + typecheck antes de demonstrar | `pnpm demo:check` |
| Lint isolado do site | `pnpm --filter @posto/site lint` |
| Typecheck isolado do site | `pnpm --filter @posto/site typecheck` |
| Build de produção do site | `pnpm --filter @posto/site build` |

---

## 3. URLs de demonstração

| Superfície | URL local | Observação |
|---|---|---|
| Site oficial Hábilis | http://localhost:3100/ | Institucional, conteúdo central, imagens nas bordas |
| Vitrine de entradas | http://localhost:3100/sistema | Quatro interfaces, uma operação |
| Acessos rápidos | http://localhost:3100/area-restrita | Três cards de acesso, sem mockup espremido |
| Sistema interno | http://localhost:3000/login | Login da equipe Hábilis |
| Portal do cliente | http://localhost:3000/portal/login | Login externo do cliente |
| Área de campo | http://localhost:3000/equipe/login | Login da equipe em rota |
| API Fastify | http://localhost:3001/health | Backend autenticação + dados |
| MailHog (e-mails locais) | http://localhost:8025/ | Inspeção de e-mails de dev |
| MinIO Console | http://localhost:9001/ | Bucket `posto-documentos` |

---

## 4. Acessos / credenciais demo

Credenciais visíveis na tela de cada login (banner laranja/azul/cinza no card
de acesso):

| Superfície | Usuário / E-mail | Senha |
|---|---|---|
| Sistema interno (`/login`) | `admin@postodemo.com.br` (ADMIN_TENANT) | `Demo@1234` |
| Sistema interno (`/login`) | `coord@postodemo.com.br` (COORDENADOR) | `Demo@1234` |
| Sistema interno (`/login`) | `analista@postodemo.com.br` (ANALISTA) | `Demo@1234` |
| Portal do cliente (`/portal/login`) | `representante@postodemo.com.br` (REPRESENTANTE_POSTO) | `Demo@1234` |
| Área de campo (`/equipe/login`) | qualquer matrícula (ex.: `CAMPO-001`) | qualquer senha (modo demo local) |

> Estes são acessos de apresentação para o ambiente local de demonstração. O
> backend, as actions e as rotas de autenticação não foram alteradas.

---

## 5. Ordem recomendada da apresentação

1. **Site oficial** — abrir `http://localhost:3100/`. Mostrar:
   - cabeçalho com mega-menu Módulos;
   - hero central com pílulas de módulos e KPIs;
   - imagens contextuais nas bordas com fade suave (não competem com o texto);
   - status overview (Regular / Atenção / Vencendo / Pendente / Crítico);
   - módulos da plataforma e fluxo operacional;
   - setores atendidos, presença em estados, parceiros e notícias.

2. **Acessos rápidos** — abrir `http://localhost:3100/area-restrita`. Mostrar:
   - hero com cena institucional;
   - **três cards lado a lado** (Sistema interno · Portal do cliente · Área de campo) com ícone, descrição e botão direto;
   - link discreto "Ver entrada oficial do sistema".

3. **Sistema interno** — `http://localhost:3000/login`:
   - login com texto institucional à esquerda e card de acesso à direita;
   - sem bloco visual comprimido no meio (foi removido);
   - imagens contextuais suaves apenas nas bordas;
   - entrar com `admin@postodemo.com.br / Demo@1234`.

4. **Portal do cliente** — `http://localhost:3000/portal/login`:
   - mesma assinatura visual, paleta azul-sky;
   - entrar com `representante@postodemo.com.br / Demo@1234`;
   - mostrar envio de documentos, checklists, mensagens.

5. **Área de campo** — `http://localhost:3000/equipe/login`:
   - mesma assinatura visual, paleta esmeralda;
   - entrar com `CAMPO-001` / senha livre;
   - mostrar OS, checklist, evidências e pendências em rota.

6. **Acesso da equipe** — voltar ao painel interno (item 3) e percorrer:
   - Dashboard;
   - Empreendimentos;
   - Documentos;
   - Licenças;
   - Condicionantes;
   - Território;
   - Alertas.

7. **Fluxo integrado** — fechar a narrativa mostrando que site, portal,
   campo e sistema interno compartilham a mesma identidade visual, e que o
   conteúdo central + imagens nas bordas funcionam em todas as superfícies.

---

## 6. O que clicar em cada tela

| Tela | Clique | Resultado esperado |
|---|---|---|
| Home | botão "Entrar no sistema" no hero | redireciona para `/login` |
| Home | "Ver entradas do sistema" | leva para `/sistema` |
| `/sistema` | qualquer card "Abrir sistema/portal/campo" | redireciona para o login correto |
| `/area-restrita` | cada um dos 3 cards de acesso | abre login correspondente |
| `/login` | preencher e enviar credenciais demo | abre Dashboard interno |
| `/portal/login` | credenciais demo | abre página inicial do portal |
| `/equipe/login` | matrícula `CAMPO-001` + senha qualquer | abre `/equipe/inicio` |
| Dashboard | menu lateral / atalhos | navegar entre Documentos, Licenças, Condicionantes |
| Portal cliente | aba Documentos | mostrar upload card |
| Área de campo | aba OS | mostrar lista de ordens, checklist, evidências |

---

## 7. O que mostrar para chefe ou cliente

- Identidade Hábilis viva, sem aparência de landing page genérica ou
  dashboard interno.
- Conteúdo central em destaque, imagens contextuais nas bordas com fade
  suave.
- Mesmo padrão visual entre site, sistema interno, portal e campo.
- Cards leves, sombras discretas, paleta verde institucional + laranja
  para CTA/alerta.
- Logins sem bloco visual comprimido no meio: texto institucional à
  esquerda, card de acesso à direita, ambientação nas bordas.
- Sensação de plataforma ambiental integrada.

---

## 8. O que evitar clicar

- Botões "Esqueci minha senha" e fluxos de recuperação (não estão configurados
  no modo demo local).
- Configurações em superadmin (`(superadmin)` rotas) sem entender o contexto.
- Ações destrutivas em documentos do portal/campo (uploads, deletes) caso o
  bucket MinIO não esteja saudável.
- Tentar enviar e-mail real: o MailHog captura tudo localmente em
  http://localhost:8025/.

---

## 9. O que já está funcional

- Login real nas três superfícies (sistema, portal, campo) com `next-auth`.
- Dashboard interno com módulos: empreendimentos, processos, documentos,
  condicionantes, tarefas, alertas, calendário, relatórios, etc.
- Portal do cliente: documentos, alertas, tarefas, condicionantes,
  checklists e mensagens.
- Área de campo: ordens de serviço, checklist, evidências e pendências.
- API Fastify + Prisma com seed.
- Upload de documentos via MinIO/S3.
- Worker BullMQ para tarefas assíncronas.

---

## 10. O que ainda é demonstrativo / mockado

- KPIs do hero da home e dos logins (`127 licenças ativas`, `94,2% score` etc)
  são valores institucionais de apresentação, não vêm da API ao renderizar a
  página pública.
- Componentes de mockup operacional na home (`DocumentMatrixMockup`,
  `RegulatoryTimelineMockup`, `FieldChecklistMockup`, `TerritoryMapMockup`,
  `ClientPortalMockup`, `SiteExperienceMockup`, `SystemMockup`) são telas
  ilustrativas em React + Tailwind, não consomem dados reais.
- Pastas `apps/site/public/images/contextos/<secao>/` foram criadas vazias
  (`.gitkeep`). Hoje as imagens contextuais nas bordas usam os PNGs
  institucionais existentes em `/images/habilis/`. Quando houver fotos
  específicas para cada cena (campo, território, portal etc), basta colocar
  os arquivos nessas pastas e atualizar `apps/site/src/lib/context-images.ts`.
- Senha "qualquer" no login da área de campo é comportamento intencional do
  modo demo local — não vale para produção.

---

## 11. Checklist antes da apresentação

- [ ] `pnpm install` rodou sem erros.
- [ ] `pnpm demo:infra` ativo (Postgres + Redis + MinIO + MailHog saudáveis).
- [ ] `pnpm demo:api` rodando na porta 3001 (ou conforme `API_PORT` no `.env`).
- [ ] `pnpm demo` rodando: site em http://localhost:3100 e sistema em http://localhost:3000.
- [ ] `pnpm demo:check` finalizou sem erros (lint + typecheck).
- [ ] Login do sistema testado com `admin@postodemo.com.br / Demo@1234`.
- [ ] Login do portal testado com `representante@postodemo.com.br / Demo@1234`.
- [ ] Login do campo testado com `CAMPO-001` + senha livre.
- [ ] Páginas públicas abertas em viewport >= 1280px para conferir as imagens
      contextuais nas bordas (em mobile elas são intencionalmente ocultadas).
- [ ] Identidade Hábilis preservada: fundo claro/off-white, verde institucional
      e laranja para CTA/alerta visíveis.
- [ ] Banner / tab do navegador limpo (sem console errors visíveis).

---

## 12. Notas técnicas (para quem está conduzindo)

- O site oficial vive em `apps/site` (Next 15, porta 3100).
- Sistema, portal e campo vivem em `apps/web` (Next 15, porta 3000).
- Imagens contextuais são configuradas em
  `apps/site/src/lib/context-images.ts` e renderizadas pelo componente
  `apps/site/src/components/contextual-side-images.tsx`. Quando uma imagem
  não estiver disponível, o fallback gradiente (mood) cobre a borda sem
  quebrar a tela.
- Utilitários visuais (fade lateral, máscara, card leve, center-stage e
  access-card) ficam em `apps/site/src/app/globals.css`.
- Os logins reais em `apps/web` tiveram o bloco visual comprimido
  (mockup/preview entre texto e card) removido. O layout final é:
  [texto institucional] · [card de login], com imagens contextuais suaves
  nas bordas via gradiente temático.
