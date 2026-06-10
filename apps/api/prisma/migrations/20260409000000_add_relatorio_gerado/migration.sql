-- CreateEnum
CREATE TYPE "TipoRelatorio" AS ENUM ('COMPLIANCE_GERAL', 'VENCIMENTOS', 'SST', 'MONITORAMENTO_AMBIENTAL', 'LOGISTICA_REVERSA', 'AUTOS_INFRACAO', 'AUDIT_LOG');

-- CreateEnum
CREATE TYPE "StatusRelatorio" AS ENUM ('AGUARDANDO', 'PROCESSANDO', 'CONCLUIDO', 'ERRO');

-- CreateTable
CREATE TABLE "relatorios_gerados" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tipo" "TipoRelatorio" NOT NULL,
    "parametros" JSONB NOT NULL,
    "status" "StatusRelatorio" NOT NULL DEFAULT 'AGUARDANDO',
    "s3_key" TEXT,
    "erro_msg" TEXT,
    "solicitado_por" TEXT NOT NULL,
    "gerado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relatorios_gerados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "relatorios_gerados_tenant_id_status_idx" ON "relatorios_gerados"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "relatorios_gerados_tenant_id_criado_em_idx" ON "relatorios_gerados"("tenant_id", "criado_em");
