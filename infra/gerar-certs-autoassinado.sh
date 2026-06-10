#!/usr/bin/env bash
# Gera certificados TLS auto-assinados para staging/desenvolvimento.
# Produção deve usar certificados reais (Let's Encrypt). Ver infra/nginx/README.md.
set -euo pipefail

CERTS_DIR="$(dirname "$0")/nginx/certs"
mkdir -p "$CERTS_DIR"

gerar() {
  local nome="$1" cn="$2"
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "$CERTS_DIR/${nome}.key" \
    -out "$CERTS_DIR/${nome}.crt" \
    -subj "/CN=${cn}" \
    -addext "subjectAltName=DNS:${cn},DNS:localhost"
  echo "  ✓ ${nome}.crt / ${nome}.key (CN=${cn})"
}

echo "Gerando certificados auto-assinados em ${CERTS_DIR}..."
gerar api "api.localhost"
gerar web "app.localhost"
echo "Pronto. Para produção use certificados reais (ver infra/nginx/README.md)."
