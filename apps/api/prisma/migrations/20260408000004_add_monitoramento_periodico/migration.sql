-- Migration: add_monitoramento_periodico
-- Phase 4c: periodicidade+proximaColeta on pocos_monitoramento + LimiteParametro

-- Alter pocos_monitoramento
ALTER TABLE "pocos_monitoramento"
  ADD COLUMN "periodicidade"  TEXT,
  ADD COLUMN "proxima_coleta" DATE,
  ADD COLUMN "observacoes"    TEXT,
  ADD COLUMN "atualizado_em"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "pocos_monitoramento_tenant_id_proxima_coleta_idx"
  ON "pocos_monitoramento"("tenant_id", "proxima_coleta");

-- LimiteParametro
CREATE TABLE "limites_parametros" (
  "id"              TEXT NOT NULL,
  "tenant_id"       TEXT NOT NULL,
  "nome_parametro"  TEXT NOT NULL,
  "tipo_medio"      TEXT NOT NULL,
  "limite_vmp"      DECIMAL(15, 6) NOT NULL,
  "unidade"         TEXT NOT NULL,
  "referencia"      TEXT,
  "criado_em"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "limites_parametros_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "limites_parametros_tenant_id_nome_parametro_tipo_medio_key"
  ON "limites_parametros"("tenant_id", "nome_parametro", "tipo_medio");

CREATE INDEX "limites_parametros_tenant_id_tipo_medio_idx"
  ON "limites_parametros"("tenant_id", "tipo_medio");

ALTER TABLE "limites_parametros"
  ADD CONSTRAINT "limites_parametros_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
