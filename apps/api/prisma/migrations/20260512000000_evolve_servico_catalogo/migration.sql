-- DropIndex
DROP INDEX "integracao_eventos_source_system_event_name_criado_em_idx";

-- DropIndex
DROP INDEX "integracao_eventos_tenant_id_status_criado_em_idx";

-- AlterTable
ALTER TABLE "integracao_eventos" DROP CONSTRAINT "integracao_eventos_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tenant_id" SET DATA TYPE TEXT,
ALTER COLUMN "empresa_id" SET DATA TYPE TEXT,
ALTER COLUMN "empreendimento_id" SET DATA TYPE TEXT,
ALTER COLUMN "tarefa_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "integracao_eventos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "servicos_consultoria_base" ADD COLUMN     "custo_interno_estimado" DECIMAL(12,2),
ADD COLUMN     "margem_lucro_alvo" DECIMAL(6,2),
ADD COLUMN     "meses_recorrencia" INTEGER,
ADD COLUMN     "preco_base" DECIMAL(12,2),
ADD COLUMN     "preco_maximo" DECIMAL(12,2),
ADD COLUMN     "preco_minimo" DECIMAL(12,2),
ADD COLUMN     "recorrente" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "integracao_eventos_tenant_id_status_criado_em_idx" ON "integracao_eventos"("tenant_id", "status", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "integracao_eventos_source_system_event_name_criado_em_idx" ON "integracao_eventos"("source_system", "event_name", "criado_em" DESC);

