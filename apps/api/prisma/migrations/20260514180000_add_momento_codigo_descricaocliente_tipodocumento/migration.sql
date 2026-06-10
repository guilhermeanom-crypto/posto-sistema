-- 1. Enum MomentoDocumento (ANTES_PROCESSO / DURANTE_PROCESSO / APOS_EMISSAO)
CREATE TYPE "MomentoDocumento" AS ENUM ('ANTES_PROCESSO', 'DURANTE_PROCESSO', 'APOS_EMISSAO');

-- 2. Novos campos em tipos_documento para suportar Portal do Cliente
ALTER TABLE "tipos_documento"
ADD COLUMN "codigo" TEXT,
ADD COLUMN "descricao_cliente" TEXT,
ADD COLUMN "momento" "MomentoDocumento";

-- 3. codigo único por tenant (slug estável usado pelo seed JSON do portal)
CREATE UNIQUE INDEX "tipos_documento_tenant_id_codigo_key" ON "tipos_documento"("tenant_id", "codigo");

-- 4. Índice para filtrar/agrupar por momento no portal
CREATE INDEX "tipos_documento_tenant_id_momento_idx" ON "tipos_documento"("tenant_id", "momento");
