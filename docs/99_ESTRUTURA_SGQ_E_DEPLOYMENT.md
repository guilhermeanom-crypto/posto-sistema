# 99. Estrutura SGQ e Deployment em Servidor Real (2026-06-10)

Organização conforme boas práticas de Sistema de Gestão de Qualidade (SGQ) para ambiente de produção.

## 📁 Estrutura de diretórios no servidor

```
/opt/
├── posto/                          # Aplicação (read-only + volume mounts)
│   ├── .git/                       # Repositório (para atualizações via git pull)
│   ├── docker-compose.prod.yml     # Orquestração
│   ├── .env                        ⚠️  NUNCA commitar (gerado localmente)
│   └── [código-fonte]
│
├── data/                           # Dados persistentes (volumes Docker)
│   ├── postgres/                   # Banco de dados PostgreSQL
│   ├── redis/                      # Cache Redis
│   ├── minio/                      # Documentos (S3 compatível)
│   ├── nginx-logs/                 # Logs do proxy
│   └── postgres-backups/           # Backups automáticos
│
├── infra/                          # Configuração de infraestrutura
│   ├── nginx/
│   │   ├── nginx.conf              # Proxy reverso (domínios, HTTPS)
│   │   ├── certs/                  # Certificados SSL
│   │   │   ├── api.crt/key
│   │   │   └── app.crt/key
│   │   └── conf.d/
│   │       └── security-headers.conf
│   └── scripts/
│       ├── deploy.sh               # Deploy automatizado
│       ├── rollback.sh             # Reversão de emergência
│       ├── backup-now.sh           # Backup manual
│       └── health-check.sh         # Monitoramento
│
├── logs/                           # Logs estruturados (fora do container)
│   ├── api/
│   ├── worker/
│   ├── web/
│   └── nginx/
│
└── docs/                           # Documentação operacional
    ├── DEPLOYMENT.md               # Este arquivo
    ├── RUNBOOK.md                  # Passo-a-passo
    ├── PROCEDURES.md               # Procedimentos (backup/restore/emergency)
    └── CHECKLIST.md                # Validação pós-deploy
```

---

## 🚀 Pré-requisitos (antes de começar)

- [ ] Servidor com IP fixo (anote: `X.X.X.X`)
- [ ] SSH access com privilégio `sudo`
- [ ] Docker + docker compose v2 instalados
- [ ] Git instalado
- [ ] 16GB RAM livre, 100GB SSD disponível
- [ ] Firewall: portas 80/443 abertas para internet, 3306/6379/9000 fechadas (Docker network apenas)

---

## ⚠️ Passo 0: Desmontar ITECOLOGICA com segurança

**Antes de mexer no servidor, fazer backup do estado atual:**

```bash
ssh root@X.X.X.X

# 1. Fazer snapshot/backup do servidor inteiro (se sua hospedagem permite)
# [procedimento depende do provedor]

# 2. Parar containers ITECOLOGICA (sem deletar dados)
cd /opt/itecologica
docker compose -f docker-compose.yml down
# (dados em volumes são preservados em /var/lib/docker/volumes/)

# 3. Backup dos dados ITECOLOGICA (se quiser manter)
tar -czf /home/backups/itecologica-backup-2026-06-10.tar.gz /opt/itecologica/data

# 4. Remover (opcional — se tiver certeza)
# sudo rm -rf /opt/itecologica
# (NÃO faça agora — mantenha um backup ao vivo enquanto testa Posto)
```

---

## 📦 Passo 1: Clonar repositório no servidor

```bash
# Criar estrutura
sudo mkdir -p /opt /var/data /var/logs/posto /var/backups/posto
sudo chown -R você:você /opt /var/data /var/logs/posto /var/backups/posto

# Clonar repositório (usando SSH — mais seguro)
cd /opt
git clone git@github.com:seu-usuario/posto-sistema.git posto
cd posto
```

---

## 🔐 Passo 2: Configurar variáveis de ambiente

```bash
# Copiar template
cp .env.example .env

# Editar com valores REAIS (NUNCA commitar)
nano .env
```

**Preencher EXATAMENTE:**

```env
# ── Identidade ──
NODE_ENV=production

# ── URLs (atrás do domínio + HTTPS) ──
API_URL=https://api.seu-dominio.com.br
WEB_URL=https://app.seu-dominio.com.br
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com.br
WEB_ALLOWED_ORIGINS=app.seu-dominio.com.br

# ── Banco de Dados ──
DATABASE_URL=postgresql://posto:SENHA_POSTGRES_64CHARS@postgres:5432/posto
POSTGRES_USER=posto
POSTGRES_PASSWORD=SENHA_POSTGRES_64CHARS

# ── Redis ──
REDIS_URL=redis://:SENHA_REDIS_64CHARS@redis:6379
REDIS_PASSWORD=SENHA_REDIS_64CHARS

# ── MinIO (storage de documentos) ──
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=SENHA_MINIO_64CHARS
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=SENHA_MINIO_64CHARS
S3_BUCKET=posto-documentos
S3_REGION=us-east-1

# ── Autenticação ──
JWT_SECRET=CHAVE_JWT_64CHARS  # openssl rand -base64 64
INTEGRATION_SHARED_SECRET=CHAVE_WEBHOOK_48CHARS  # openssl rand -base64 32
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# ── E-mail ──
RESEND_API_KEY=re_XXXXX
EMAIL_FROM=noreply@seu-dominio.com.br
EMAIL_FROM_NAME=Hábilis Posto

# ── IA (Claude — CRÍTICO para worker) ──
ANTHROPIC_API_KEY=sk-ant-XXXXX

# ── WhatsApp (opcional) ──
ZAPI_INSTANCE_ID=
ZAPI_TOKEN=
ZAPI_CLIENT_TOKEN=

# ── Logging ──
LOG_LEVEL=info

# ── Backup ──
BACKUP_SCHEDULE=@daily
BACKUP_KEEP_DAYS=7
BACKUP_KEEP_WEEKS=4
BACKUP_KEEP_MONTHS=6

# ── Privacidade (NÃO indexar no Google) ──
ROBOTS_DISALLOW_ALL=true  # Impede busca orgânica
```

**Gerar senhas FORTES:**

```bash
# No seu computador local (NUNCA no servidor com shell insegura)
openssl rand -base64 64   # JWT_SECRET
openssl rand -base64 64   # POSTGRES_PASSWORD
openssl rand -base64 64   # REDIS_PASSWORD
openssl rand -base64 64   # MINIO_PASSWORD
openssl rand -base64 32   # INTEGRATION_SHARED_SECRET

# Copiar valores e colar no nano (Shift+Insert)
```

**Proteger o arquivo:**

```bash
chmod 600 .env
# Só você consegue ler (outros usuários não conseguem)
```

---

## 🔐 Passo 3: Certificados SSL (TLS)

### Opção A: Let's Encrypt (RECOMENDADO)

```bash
# Instalar certbot (se não tiver)
sudo apt-get install certbot python3-certbot-nginx -y

# Gerar certificados (válido 90 dias, renovação automática)
certbot certonly --standalone \
  -d api.seu-dominio.com.br \
  -d app.seu-dominio.com.br

# Copiar para o projeto
mkdir -p /opt/posto/infra/nginx/certs
sudo cp /etc/letsencrypt/live/api.seu-dominio.com.br/fullchain.pem \
        /opt/posto/infra/nginx/certs/api.crt
sudo cp /etc/letsencrypt/live/api.seu-dominio.com.br/privkey.pem \
        /opt/posto/infra/nginx/certs/api.key
sudo cp /etc/letsencrypt/live/app.seu-dominio.com.br/fullchain.pem \
        /opt/posto/infra/nginx/certs/web.crt
sudo cp /etc/letsencrypt/live/app.seu-dominio.com.br/privkey.pem \
        /opt/posto/infra/nginx/certs/web.key

# Ajustar permissões
sudo chown -R você:você /opt/posto/infra/nginx/certs
chmod 644 /opt/posto/infra/nginx/certs/*.crt
chmod 600 /opt/posto/infra/nginx/certs/*.key

# Auto-renovação (cron)
sudo crontab -e
# Adicione: 0 2 * * * certbot renew --quiet && cp /etc/letsencrypt/live/*/fullchain.pem /opt/posto/infra/nginx/certs/ && cp /etc/letsencrypt/live/*/privkey.pem /opt/posto/infra/nginx/certs/
```

### Opção B: Auto-assinado (STAGING ONLY)

```bash
cd /opt/posto/infra/nginx/certs

# Gerar certificates auto-assinados (válidos 365 dias)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout api.key -out api.crt \
  -subj "/CN=api.seu-dominio.com.br"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout web.key -out web.crt \
  -subj "/CN=app.seu-dominio.com.br"
```

---

## 🌐 Passo 4: Configurar Nginx (proxy reverso + HTTPS)

Editar `/opt/posto/infra/nginx/nginx.conf`:

```bash
nano /opt/posto/infra/nginx/nginx.conf
```

**Trocar placeholders:**

```nginx
# Linha ~15: servidor API
server_name api.seu-dominio.com.br;

# Linha ~70: servidor Web
server_name app.seu-dominio.com.br;
```

**Adicionar headers de segurança + bloqueio de indexação:**

Editar `/opt/posto/infra/nginx/conf.d/security-headers.conf` (criar se não existir):

```nginx
# Não indexar em Google/Bing (testes privados)
add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet";

# Segurança
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

**Validar sintaxe:**

```bash
docker run --rm -v /opt/posto/infra/nginx:/etc/nginx nginx:alpine nginx -t
# Resultado: syntax is ok
```

---

## 🚀 Passo 5: Build + Deploy

```bash
cd /opt/posto

# 1. Build das imagens Docker (leva ~5-10 min primeira vez)
docker compose -f docker-compose.prod.yml build

# 2. Subir (inicia postgres → redis → minio → api/migrate → web → worker)
docker compose -f docker-compose.prod.yml up -d --wait

# 3. Aguardar healthchecks (ver abaixo)
sleep 60 && docker compose -f docker-compose.prod.yml ps
```

**Esperar até tudo estar "healthy":**

```bash
docker compose -f docker-compose.prod.yml ps

# Esperado:
# postgres       Up (healthy)
# redis         Up (healthy)
# minio         Up (healthy)
# api           Up (healthy)
# web           Up (healthy)
# worker        Up (healthy)
# nginx         Up
```

---

## 👤 Passo 6: Criar SUPER_ADMIN

```bash
# Criar conta de gerente (idempotente)
SUPERADMIN_EMAIL="seu@empresa.com.br" \
SUPERADMIN_SENHA="SenhaForte123!@#" \
SUPERADMIN_NOME="Seu Nome" \
docker compose -f docker-compose.prod.yml exec -T api \
  pnpm --filter "@repo/api" create-superadmin

# Resultado:
# ✅ SUPER_ADMIN pronto: seu@empresa.com.br
#    tenant "sistema": [uuid]
#    Agora faça login e provisione o primeiro tenant real em /tenants.
```

---

## ✅ Passo 7: Validar (CHECKLIST)

```bash
# 1. Acesso HTTP/HTTPS
curl -I https://app.seu-dominio.com.br
# Esperado: HTTP 200 + headers de segurança

# 2. Verifica se está privado (sem indexação)
curl -I https://app.seu-dominio.com.br | grep X-Robots-Tag
# Esperado: X-Robots-Tag: noindex, nofollow, noarchive, nosnippet

# 3. Health check da API
curl -s https://api.seu-dominio.com.br/health | jq
# Esperado: { "status": "ok", "checks": { "db": "ok", "redis": "ok" } }

# 4. Login funciona
# Abrir: https://app.seu-dominio.com.br/login
# Entrar com: seu@empresa.com.br / SenhaForte123!@#
# Esperado: redireciona para /dashboard

# 5. Logs sem erros
docker compose -f docker-compose.prod.yml logs -f api | head -20
# Esperado: nada de "ERROR" ou "FATAL"
```

---

## 🔄 Passo 8: Manutenção Diária

```bash
# Ver status
docker compose -f docker-compose.prod.yml ps

# Ver logs (últimas 50 linhas)
docker compose -f docker-compose.prod.yml logs --tail=50

# Restart de emergência (se algo congelar)
docker compose -f docker-compose.prod.yml restart api

# Parar tudo (SEM deletar dados)
docker compose -f docker-compose.prod.yml down

# Retomar
docker compose -f docker-compose.prod.yml up -d
```

---

## 🆘 Rollback de Emergência

Se algo der errado:

```bash
# 1. Parar tudo
docker compose -f docker-compose.prod.yml down

# 2. Voltar para commit anterior
git reset --hard HEAD~1

# 3. Rebuild + retomar
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 4. Restore de backup (se necessário)
# [ver docs/PROCEDURES.md]
```

---

## 📋 Checklist Pós-Deploy

- [ ] Nginx respondendo HTTPS com certificado válido
- [ ] X-Robots-Tag presente (não-indexável)
- [ ] API health check OK (db + redis)
- [ ] Login SUPER_ADMIN funciona
- [ ] Criar tenant real funciona
- [ ] Upload de documento funciona
- [ ] App de campo carrega
- [ ] Worker processando (logs sem erro)
- [ ] Backup rodando (check /var/backups/posto)
- [ ] Senhas FORTES em .env (não defaultadas)

---

## 📞 Suporte / Troubleshooting

Ver: `docs/PROCEDURES.md` (backup/restore/emergency)
Ver: `docs/RUNBOOK.md` (operação diária)

---

**Status:** ✅ Pronto para deploy em servidor real com SGQ.
