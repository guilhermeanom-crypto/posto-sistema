# Nginx (reverse proxy + TLS)

O `nginx.conf` referencia certificados em `certs/`:
`api.crt`, `api.key`, `web.crt`, `web.key`. Sem eles o container nginx **não sobe**.

## Staging / desenvolvimento — certificados auto-assinados

```bash
bash infra/gerar-certs-autoassinado.sh
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

O script gera os 4 arquivos em `infra/nginx/certs/`. Navegadores mostrarão aviso
de certificado não confiável (esperado para auto-assinado).

## Produção — Let's Encrypt

Use certificados reais (ex.: `certbot`) e copie/symlink para `infra/nginx/certs/`
com os nomes `api.crt/api.key/web.crt/web.key`, ou ajuste o `nginx.conf`.
Lembre de trocar os `server_name` placeholders (`api.seudominio.com.br`,
`app.seudominio.com.br`) pelos domínios reais. Configure renovação automática.

> Os `.crt`/`.key` são ignorados pelo git (ver `.gitignore`). Nunca versione chaves.
