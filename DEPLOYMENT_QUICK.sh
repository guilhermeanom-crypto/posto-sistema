#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# DEPLOYMENT RÁPIDO — Posto Sistema em Servidor Real
# Execute ISTO no servidor (não no seu computador local)
#
# Uso: bash DEPLOYMENT_QUICK.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Parar se qualquer comando falhar

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo "🚀 DEPLOYMENT POSTO SISTEMA"
echo -e "${YELLOW}========================================${NC}"

# ─── 1. Verificações pré-deployment ───────────────────────────────────────
echo -e "${YELLOW}[1/9] Verificando pré-requisitos...${NC}"

command -v docker &> /dev/null || { echo -e "${RED}❌ Docker não instalado${NC}"; exit 1; }
command -v git &> /dev/null || { echo -e "${RED}❌ Git não instalado${NC}"; exit 1; }
command -v openssl &> /dev/null || { echo -e "${RED}❌ OpenSSL não instalado${NC}"; exit 1; }

RAM=$(free -g | awk '/^Mem:/{print $2}')
if [ "$RAM" -lt 16 ]; then
  echo -e "${YELLOW}⚠️  RAM < 16GB (tem $RAM GB) — pode ser lento${NC}"
fi

DISK=$(df /opt | awk 'NR==2 {print $4}')
if [ "$DISK" -lt 100000 ]; then
  echo -e "${RED}❌ Disco < 100GB disponível — abortar${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Pré-requisitos OK${NC}"

# ─── 2. Estrutura de diretórios ───────────────────────────────────────────
echo -e "${YELLOW}[2/9] Criando estrutura de diretórios...${NC}"

mkdir -p /opt /var/data /var/logs/posto /var/backups/posto
mkdir -p /opt/posto/infra/nginx/certs

echo -e "${GREEN}✅ Diretórios criados${NC}"

# ─── 3. Clonar repositório ────────────────────────────────────────────────
echo -e "${YELLOW}[3/9] Clonando repositório...${NC}"

if [ ! -d "/opt/posto/.git" ]; then
  git clone git@github.com:SEU_USUARIO/posto-sistema.git /opt/posto
  echo -e "${GREEN}✅ Repositório clonado${NC}"
else
  echo -e "${GREEN}✅ Repositório já existe${NC}"
  cd /opt/posto && git pull
fi

cd /opt/posto

# ─── 4. Gerar senhas (se não existirem) ──────────────────────────────────
echo -e "${YELLOW}[4/9] Preparando arquivo .env...${NC}"

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠️  Arquivo .env criado — EDITE COM SUAS SENHAS ANTES DE CONTINUAR${NC}"
  echo -e "${YELLOW}   nano .env${NC}"
  echo -e "${RED}   ⚠️  IMPORTANTES:${NC}"
  echo "    - DATABASE_URL (SENHA_POSTGRES_FORTE)"
  echo "    - POSTGRES_PASSWORD (mesmo acima)"
  echo "    - JWT_SECRET (use: openssl rand -base64 64)"
  echo "    - INTEGRATION_SHARED_SECRET (use: openssl rand -base64 32)"
  echo "    - ANTHROPIC_API_KEY (essencial para worker)"
  echo "    - RESEND_API_KEY (para envio de email)"
  echo "    - Domínios finais (API_URL, WEB_URL)"
  exit 1
else
  echo -e "${GREEN}✅ .env já existe${NC}"
fi

# ─── 5. Certificados SSL ──────────────────────────────────────────────────
echo -e "${YELLOW}[5/9] Verificando certificados SSL...${NC}"

if [ ! -f "infra/nginx/certs/api.crt" ] || [ ! -f "infra/nginx/certs/api.key" ]; then
  echo -e "${YELLOW}⚠️  Certificados não encontrados${NC}"
  echo "    Opções:"
  echo "    A) Let's Encrypt: certbot certonly --standalone -d api.SEU_DOMINIO.com.br"
  echo "    B) Auto-assinado (staging): bash infra/gerar-certs-autoassinado.sh"
  echo -e "${RED}    Gere os certificados e rode este script novamente${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Certificados encontrados${NC}"
fi

chmod 644 infra/nginx/certs/*.crt
chmod 600 infra/nginx/certs/*.key

# ─── 6. Validar Nginx ─────────────────────────────────────────────────────
echo -e "${YELLOW}[6/9] Validando configuração Nginx...${NC}"

docker run --rm -v /opt/posto/infra/nginx:/etc/nginx nginx:alpine nginx -t 2>/dev/null \
  && echo -e "${GREEN}✅ Nginx OK${NC}" \
  || { echo -e "${RED}❌ Erro no nginx.conf — edite:${NC} nano infra/nginx/nginx.conf"; exit 1; }

# ─── 7. Build Docker ──────────────────────────────────────────────────────
echo -e "${YELLOW}[7/9] Building Docker images (pode levar ~5 min na primeira vez)...${NC}"

docker compose -f docker-compose.prod.yml build 2>&1 | tail -10

echo -e "${GREEN}✅ Build completo${NC}"

# ─── 8. Iniciar containers ───────────────────────────────────────────────
echo -e "${YELLOW}[8/9] Iniciando containers...${NC}"

docker compose -f docker-compose.prod.yml up -d --wait

echo "Aguardando healthchecks..."
sleep 30

docker compose -f docker-compose.prod.yml ps | grep -E "healthy|Exited"

if docker compose -f docker-compose.prod.yml ps | grep -q "Exited"; then
  echo -e "${RED}❌ Algum container falhou — checando logs:${NC}"
  docker compose -f docker-compose.prod.yml logs --tail=30
  exit 1
fi

echo -e "${GREEN}✅ Todos os containers estão healthy${NC}"

# ─── 9. Bootstrap SUPER_ADMIN ────────────────────────────────────────────
echo -e "${YELLOW}[9/9] Criando SUPER_ADMIN...${NC}"

echo -e "${YELLOW}Digite o email do gerente:${NC}"
read -p "> " EMAIL

echo -e "${YELLOW}Digite uma senha forte (12+ caracteres):${NC}"
read -sp "> " SENHA
echo

echo -e "${YELLOW}Digite o nome:${NC}"
read -p "> " NOME

SUPERADMIN_EMAIL="$EMAIL" \
SUPERADMIN_SENHA="$SENHA" \
SUPERADMIN_NOME="$NOME" \
docker compose -f docker-compose.prod.yml exec -T api \
  pnpm --filter "@repo/api" create-superadmin

echo -e "${GREEN}✅ SUPER_ADMIN criado${NC}"

# ─── Validação Final ──────────────────────────────────────────────────────
echo -e "${YELLOW}========================================${NC}"
echo "✅ DEPLOYMENT COMPLETO!"
echo -e "${YELLOW}========================================${NC}"

echo "Próximos passos:"
echo "1. Acessar: https://app.SEU_DOMINIO.com.br/login"
echo "2. Logar com: $EMAIL / (sua senha)"
echo "3. Ir para: /tenants → Criar primeiro cliente"
echo ""
echo "Verificações:"
echo "  API: curl -s https://api.SEU_DOMINIO.com.br/health | jq"
echo "  Privado (sem indexação): curl -I https://app.SEU_DOMINIO.com.br | grep X-Robots-Tag"
echo "  Logs: docker compose -f docker-compose.prod.yml logs -f api"
echo ""
echo "Emergência: ver docs/PROCEDURES.md"
