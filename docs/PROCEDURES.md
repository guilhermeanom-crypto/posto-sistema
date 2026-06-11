# Procedimentos Operacionais — Backup, Restore, Emergência

## 🔄 Backup (automático + manual)

### Automático (diário)
Docker já faz backup do Postgres diariamente:
```bash
# Verificar backups existentes
ls -lh /var/backups/posto/

# Retorno esperado:
# -rw------- 1 root root 45M Jun 10 02:00 backup.2026-06-10.sql.gz
# -rw------- 1 root root 45M Jun  9 02:00 backup.2026-06-09.sql.gz
```

Configurado em `.env`:
```env
BACKUP_SCHEDULE=@daily       # Roda todo dia 02:00
BACKUP_KEEP_DAYS=7          # Guarda últimos 7 dias
BACKUP_KEEP_WEEKS=4         # Guarda 4 semanas completas
BACKUP_KEEP_MONTHS=6        # Guarda 6 meses
```

### Manual (antes de mudanças importantes)
```bash
cd /opt/posto

# Fazer backup manual AGORA
docker compose -f docker-compose.prod.yml exec -T postgres-backup \
  /bin/sh -c 'pg_dump -U $POSTGRES_USER -d $POSTGRES_DB | gzip > /backups/backup.manual-$(date +%Y-%m-%d_%H%M%S).sql.gz'

# Verificar
ls -lh /var/backups/posto/backup.manual-*.sql.gz
```

---

## 🔄 Restore (recuperar de backup)

### Cenário A: Banco corrompido (rare, mas pode acontecer)

```bash
cd /opt/posto

# 1. Parar a API (para não interferir)
docker compose -f docker-compose.prod.yml stop api worker

# 2. Conectar ao banco
docker compose -f docker-compose.prod.yml exec -T postgres psql -U posto -d posto

# Dentro do psql:
# DROP DATABASE posto;
# CREATE DATABASE posto;
# \q

# 3. Restaurar do backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U posto -d posto < /var/backups/posto/backup.2026-06-10.sql.gz

# 4. Reiniciar API
docker compose -f docker-compose.prod.yml up -d api worker

# 5. Verificar
curl -s https://api.seu-dominio.com.br/health
```

### Cenário B: Perda total de dados (desastre)

```bash
cd /opt/posto

# 1. Parar TUDO
docker compose -f docker-compose.prod.yml down

# 2. Remover volumes Docker (⚠️ CUIDADO — isto apaga tudo)
docker volume rm postgres_data
docker volume rm redis_data

# 3. Subir NOVO banco vazio
docker compose -f docker-compose.prod.yml up -d postgres redis minio

# 4. Aguardar postgres ficar healthy
sleep 30

# 5. Rodar migrations
docker compose -f docker-compose.prod.yml exec -T postgres \
  prisma migrate deploy --schema apps/api/prisma/schema.prisma

# 6. Restaurar dados do backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U posto -d postgres < /var/backups/posto/backup.2026-06-10.sql.gz

# 7. Subir tudo
docker compose -f docker-compose.prod.yml up -d
```

---

## 🚨 Emergência — Sistema Down

### Se tudo está caído

```bash
cd /opt/posto

# 1. Diagnosticar
docker compose -f docker-compose.prod.yml ps
# Ver qual container está "Exited"

# 2. Ver logs do container problemático
docker compose -f docker-compose.prod.yml logs api  # (trocar por qual estiver problemático)

# 3. Restart rápido
docker compose -f docker-compose.prod.yml restart api

# 4. Se ainda não funcionar: rebuild
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# 5. Se AINDA não funcionar: rollback (voltar commit anterior)
git log --oneline -5  # Ver últimos commits
git reset --hard HEAD~1  # Voltar um commit
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Se API não consegue conectar ao banco

```bash
# 1. Verificar se Postgres está up
docker compose -f docker-compose.prod.yml logs postgres | tail -20

# 2. Se Postgres crashed, recuperar
docker compose -f docker-compose.prod.yml restart postgres
sleep 30

# 3. Se AINDA não conseguir, pode ser banco corrompido
# Fazer RESTORE (ver seção acima)
```

### Se Redis está lento

```bash
# Redis pode estar cheio de cache expirado
docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL

# Reiniciar
docker compose -f docker-compose.prod.yml restart redis
```

### Se MinIO (documentos) está inacessível

```bash
# MinIO precisa de espaço em disco
df -h | grep /var/data  # Ver espaço livre

# Se < 10GB, limpar algo ou expandir disco
# (minIO é regenerável — backups vão para Postgres)
```

---

## 📊 Monitoramento (diário)

```bash
cd /opt/posto

# Verificar saúde geral (rodar todo dia)
docker compose -f docker-compose.prod.yml ps
# Tudo deve estar "Up (healthy)"

# Ver consumo de recursos
docker stats --no-stream

# Esperado (para um cliente):
# postgres:   ~200MB RAM, <5% CPU
# redis:      ~50MB RAM, <1% CPU
# api:        ~300MB RAM, 0-10% CPU
# web:        ~150MB RAM, 0-5% CPU
# worker:     ~250MB RAM, 0-20% CPU (depende de carga)

# Verificar logs por erros
for svc in api worker web postgres redis; do
  echo "=== $svc ==="
  docker compose -f docker-compose.prod.yml logs --tail=5 $svc | grep -i "error\|fatal" || echo "OK"
done

# Backup rodou?
ls -lt /var/backups/posto/ | head -2

# Espaço em disco?
df -h /var/data
# Alertar se < 20% livre
```

---

## 🔐 Segurança (semanal)

```bash
# Certificado vai vencer?
openssl x509 -enddate -noout -in /opt/posto/infra/nginx/certs/api.crt

# Renovar manualmente (se certbot automático falhar)
certbot renew --force-renewal

# Logs de acesso suspeito?
tail -100 /var/log/nginx/access.log | grep -i "error\|401\|403"
```

---

## 📈 Escalability (quando ficar lento)

Se o sistema começar a ficar lento:

1. **Aumentar RAM de api/worker**
   - Editar `docker-compose.prod.yml`: adicionar `mem_limit`

2. **Aumentar concorrência do worker**
   - Editar `.env`: `WORKER_CONCURRENCY=10` (de 5)

3. **Aumentar pool de conexões do Postgres**
   - Editar Postgres config: `max_connections=200`

4. **Adicionar segundo server (load balance)**
   - Adicionar segundo server rodando web/worker
   - Nginx faz round-robin automático

---

## 📞 Quando chamar suporte

- API com erro "FATAL" nos logs por >5 min
- Postgres não consegue iniciar mesmo após restart
- Certificado expirado (pode renovar manualmente, mas checagem automática falhou)
- Disco cheio (emergência — precisa limpar urgente)
- Taxa de erro > 5% (algo fundamental quebrou)

---

**Última revisão:** 2026-06-10
**Status:** Pronto para produção
