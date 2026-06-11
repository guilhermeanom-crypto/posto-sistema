# 98. Runbook — Primeira Subida em Produção (2026-06-10)

Passo a passo para colocar Posto Sistema na internet de verdade.

## Pré-requisitos (antes de começar)

- [ ] Domínios finais comprados (ex.: `api.seudominio.com.br` + `app.seudominio.com.br`)
- [ ] DNS A `api.seudominio.com.br` e `app.seudominio.com.br` apontam para o IP do servidor
- [ ] Servidor com Docker + docker compose v2 + 16GB RAM / 100GB disk mínimo
- [ ] Cópia do repositório clonado: `git clone <seu-repo-privado> /opt/posto`
- [ ] SSH acesso ao servidor com privilégios sudo

## Execução Passo a Passo

### 1. Preparar variáveis de ambiente (20 min)

```bash
cd /opt/posto

# Copiar template
cp .env.example .env

# EDITAR .env com seus valores REAIS (nunca commitar este arquivo)
nano .env
```

**Variáveis críticas a preencher** (use `openssl rand -base64 64` para gerar secrets):

```env
# ── Banco de Dados ──
DATABASE_URL=postgresql://posto:SENHA_POSTGRES_FORTE@postgres:5432/posto
POSTGRES_USER=posto
POSTGRES_PASSWORD=SENHA_POSTGRES_FORTE  # 20+ chars aleatória

# ── Redis ──
REDIS_URL=redis://:SENHA_REDIS_FORTE@redis:6379
REDIS_PASSWORD=SENHA_REDIS_FORTE

# ── MinIO (S3 compatível — storage de documentos) ──
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=SENHA_MINIO_FORTE  # 20+ chars
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=SENHA_MINIO_FORTE
S3_BUCKET=posto-documentos

# ── Autenticação ──
JWT_SECRET=CHAVE_JWT_FORTE  # min 64 chars (openssl rand -base64 64)
INTEGRATION_SHARED_SECRET=WEBHOOK_SECRET_FORTE  # min 48 chars (openssl rand -base64 32)

# ── URLs finais (atrás do nginx/TLS) ──
API_URL=https://api.seudominio.com.br
WEB_URL=https://app.seudominio.com.br
NEXT_PUBLIC_API_URL=https://api.seudominio.com.br
WEB_ALLOWED_ORIGINS=app.seudominio.com.br  # comma-separated if multiple

# ── E-mail (Resend — já configurado na integração) ──
RESEND_API_KEY=re_AQUI_SUA_CHAVE_RESEND  # ou SMTP config se preferir
EMAIL_FROM=noreply@seudominio.com.br
EMAIL_FROM_NAME=Hábilis Posto

# ── IA (Claude para análise de documentos) ──
ANTHROPIC_API_KEY=sk-ant-AQUI_SUA_CHAVE_CLAUDE  # Critical — worker não sobe sem isto

# ── Opcional (integração WhatsApp Z-API) ──
ZAPI_INSTANCE_ID=AQUI_SE_TIVER
ZAPI_TOKEN=AQUI_SE_TIVER
ZAPI_CLIENT_TOKEN=AQUI_SE_TIVER

# ── Backup (já rodando) ──
BACKUP_SCHEDULE=@daily
BACKUP_KEEP_DAYS=7
BACKUP_KEEP_WEEKS=4
BACKUP_KEEP_MONTHS=6

# ── Logging ──
LOG_LEVEL=info  # ou debug se necessário
```

### 2. Certificados TLS (30 min)

**Opção A: Let's Encrypt (RECOMENDADO)**

```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Gerar certificates (depois de apontarDNS)
certbot certonly --standalone -d api.seudominio.com.br -d app.seudominio.com.br
# Certificados criados em: /etc/letsencrypt/live/

# Copiar para o repo
sudo cp /etc/letsencrypt/live/api.seudominio.com.br/fullchain.pem \
        /opt/posto/infra/nginx/certs/api.crt
sudo cp /etc/letsencrypt/live/api.seudominio.com.br/privkey.pem \
        /opt/posto/infra/nginx/certs/api.key
sudo cp /etc/letsencrypt/live/app.seudominio.com.br/fullchain.pem \
        /opt/posto/infra/nginx/certs/web.crt
sudo cp /etc/letsencrypt/live/app.seudominio.com.br/privkey.pem \
        /opt/posto/infra/nginx/certs/web.key

# Configurar auto-renovação
sudo crontab -e
# Adicione: 0 2 * * * certbot renew --quiet && cp /etc/letsencrypt/live/*/cert.pem ... (ver docs/nginx)
```

**Opção B: Auto-assinado (STAGING ONLY)**

```bash
bash infra/gerar-certs-autoassinado.sh
# Cria 4 .crt/.key em infra/nginx/certs/ (navegador avisa)
```

### 3. Configurar nginx (10 min)

```bash
# Editar server_name nos 2 server blocks (api + web)
nano infra/nginx/nginx.conf
```

Trocar:
- `server_name api.placeholder.com.br` → `server_name api.seudominio.com.br`
- `server_name app.placeholder.com.br` → `server_name app.seudominio.com.br`

Validar:
```bash
docker run --rm -v /opt/posto/infra/nginx:/etc/nginx nginx:alpine nginx -t
```

### 4. Build + subida (20 min)

```bash
cd /opt/posto

# Build (1ª vez = ~5 min, depois rápido por cache)
docker compose -f docker-compose.prod.yml build

# Subir (inicia postgres → redis → minio → api/migrate → web → worker)
docker compose -f docker-compose.prod.yml up -d --wait

# Verificar saúde
docker compose -f docker-compose.prod.yml ps
# Todos devem estar "healthy" (após 30-60s)

# Logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

### 5. Bootstrap SUPER_ADMIN (5 min)

Sem super admin, é impossível criar o primeiro tenant real.

```bash
# Criar o SUPER_ADMIN (idempotente)
SUPERADMIN_EMAIL="seu@email.com" \
SUPERADMIN_SENHA="SenhaForte123!@#" \
SUPERADMIN_NOME="Seu Nome" \
docker compose -f docker-compose.prod.yml exec api \
  pnpm --filter "@repo/api" create-superadmin

# Retorna:
# ✅ SUPER_ADMIN pronto: seu@email.com
#    tenant "sistema": [uuid]
#    Agora faça login e provisione o primeiro tenant real em /tenants.
```

### 6. Teste funcional (5 min)

```bash
# 1. Acessar painel
open https://app.seudominio.com.br/login
# Logar com: seu@email.com / SenhaForte123!@#
# (em Prod, demo creds são rejeitadas)

# 2. Criar primeiro tenant real
# Menu → Tenants → Novo Tenant
# Nome: "Cliente Um" | Plano: ENTERPRISE | Limites adequados

# 3. Acessar portal (cliente)
# Representante faz: https://app.seudominio.com.br/portal/login
# (magic-link enviado p/ email real)

# 4. Smoke API
curl -s https://api.seudominio.com.br/health | jq
# { "status": "ok", "checks": { "db": "ok", "redis": "ok" } }
```

### 7. Backup + Observabilidade (5 min, dia 1)

```bash
# Backup automático já roda diário — teste restore
docker compose -f docker-compose.prod.yml exec postgres-backup \
  /bin/sh -c 'ls -lh /backups | head -5'
# Listar backups

# Testar RESTORE (simular perda de dados)
# [procedimento em docs/BACKUP_RESTORE.md — criar após primeira subida]

# Logs estruturados do worker (JSON pino) → centralizar se tiver ELK/Datadog
docker compose -f docker-compose.prod.yml logs worker | head -20
# {"level":30,"app":"worker","msg":"..."}  ← parseável
```

## Troubleshooting

| Sintoma | Causa | Solução |
|---------|-------|---------|
| API não boota | `ANTHROPIC_API_KEY` ou `INTEGRATION_SHARED_SECRET` vazio | preencher .env e `docker compose up --build api` |
| Server Actions falham (login/upload) | `WEB_ALLOWED_ORIGINS` faltando ou domínio errado | confirmar `next.config.ts` tem a origem correta |
| `docker compose build web` falha (Module not found) | bug corrigido (commit 1f75bd9) | `git pull` |
| Certificado inválido | auto-assinado em produção | usar Let's Encrypt (Opção A) |
| Worker não processa jobs | Redis sem senha ou `REDIS_URL` errada | `docker compose logs redis` |
| SMTP falha no envio de e-mail | `RESEND_API_KEY` inválida | validar chave em dashboard Resend |

## Pós-subida (1ª semana)

- [ ] Configurar monitoramento (Sentry — decisão adiada para pós-lançamento; ver docs/97_CONSOLIDACAO_E_PROXIMOS_PASSOS.md)
- [ ] Testar fluxo completo: login → criar OS → gerar evidência → renovar sessão → logout
- [ ] Validar restore de backup (procedimento completo em [docs/PROCEDURES.md](PROCEDURES.md))
- [ ] Certificar domínio em HTTPS (navegador verde): `curl -I https://posto.itecologica.com.br`

## Referências

- **Bloqueadores go-live**: [docs/97_CONSOLIDACAO_E_PROXIMOS_PASSOS.md](../97_CONSOLIDACAO_E_PROXIMOS_PASSOS.md#prontidão-para-go-live)
- **Plano de execução**: [mesma doc, Blocos 0-6](../97_CONSOLIDACAO_E_PROXIMOS_PASSOS.md#plano-de-execução)
- **SSH + deploy**: `ssh servidor && cd /opt/posto && docker compose -f docker-compose.prod.yml ...`
- **Rollback urgente**: `docker compose down` (dados em volumes PostgreSQL são preservados)
