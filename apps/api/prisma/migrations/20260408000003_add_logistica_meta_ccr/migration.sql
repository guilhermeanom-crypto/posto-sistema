-- Migration: add_logistica_meta_ccr
-- Phase 4b: Metas de resíduo anuais + CCR (Certificado de Destinação de Resíduos)

CREATE TABLE "metas_residuos_anuais" (
  "id"               TEXT NOT NULL,
  "tenant_id"        TEXT NOT NULL,
  "empreendimento_id" TEXT NOT NULL,
  "ano"              INTEGER NOT NULL,
  "tipo_residuo"     TEXT NOT NULL,
  "unidade"          TEXT NOT NULL,
  "meta_quantidade"  DECIMAL(12, 3) NOT NULL,
  "observacoes"      TEXT,
  "criado_em"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "metas_residuos_anuais_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ccrs" (
  "id"               TEXT NOT NULL,
  "tenant_id"        TEXT NOT NULL,
  "mtr_id"           TEXT NOT NULL,
  "numero_ccr"       TEXT,
  "tipo_residuo"     TEXT NOT NULL,
  "quantidade_kg"    DECIMAL(12, 3) NOT NULL,
  "destinador"       TEXT NOT NULL,
  "cnpj_destinador"  TEXT,
  "data_destinacao"  DATE NOT NULL,
  "tecnologia_uso"   TEXT,
  "arquivo_s3"       TEXT,
  "criado_em"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ccrs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "metas_residuos_anuais_tenant_id_empreendimento_id_ano_tipo_residuo_key"
  ON "metas_residuos_anuais"("tenant_id", "empreendimento_id", "ano", "tipo_residuo");

CREATE INDEX "metas_residuos_anuais_tenant_id_empreendimento_id_ano_idx"
  ON "metas_residuos_anuais"("tenant_id", "empreendimento_id", "ano");

CREATE INDEX "ccrs_tenant_id_mtr_id_idx"
  ON "ccrs"("tenant_id", "mtr_id");

CREATE INDEX "ccrs_tenant_id_data_destinacao_idx"
  ON "ccrs"("tenant_id", "data_destinacao");

-- Foreign Keys
ALTER TABLE "metas_residuos_anuais"
  ADD CONSTRAINT "metas_residuos_anuais_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "metas_residuos_anuais"
  ADD CONSTRAINT "metas_residuos_anuais_empreendimento_id_fkey"
  FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ccrs"
  ADD CONSTRAINT "ccrs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ccrs"
  ADD CONSTRAINT "ccrs_mtr_id_fkey"
  FOREIGN KEY ("mtr_id") REFERENCES "mtrs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
