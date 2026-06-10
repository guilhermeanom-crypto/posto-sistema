-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('RASCUNHO', 'ATIVO', 'SUSPENSO', 'ENCERRADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'RASCUNHO',
    "handoff_comercial_id" TEXT NOT NULL,
    "proposta_comercial_id" TEXT NOT NULL,
    "empreendimento_id" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "atualizado_por_id" TEXT,
    "objeto" TEXT NOT NULL,
    "observacoes_contratuais" TEXT,
    "observacoes_internas" TEXT,
    "data_inicio_vigencia" DATE NOT NULL,
    "data_fim_vigencia" DATE,
    "dia_vencimento" INTEGER NOT NULL,
    "valor_mensal" DECIMAL(12,2) NOT NULL,
    "valor_total_estimado" DECIMAL(14,2),
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "itens_snapshot" JSONB NOT NULL,
    "ativado_em" TIMESTAMP(3),
    "suspenso_em" TIMESTAMP(3),
    "encerrado_em" TIMESTAMP(3),
    "cancelado_em" TIMESTAMP(3),
    "motivo_encerramento" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contratos_tenant_id_numero_key" ON "contratos"("tenant_id", "numero");

-- CreateIndex
CREATE INDEX "contratos_tenant_id_status_criado_em_idx" ON "contratos"("tenant_id", "status", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "contratos_tenant_id_handoff_comercial_id_idx" ON "contratos"("tenant_id", "handoff_comercial_id");

-- CreateIndex
CREATE INDEX "contratos_tenant_id_empreendimento_id_status_idx" ON "contratos"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "contratos_tenant_id_data_inicio_vigencia_idx" ON "contratos"("tenant_id", "data_inicio_vigencia");

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_handoff_comercial_id_fkey" FOREIGN KEY ("handoff_comercial_id") REFERENCES "handoffs_comerciais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_proposta_comercial_id_fkey" FOREIGN KEY ("proposta_comercial_id") REFERENCES "propostas_comerciais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_atualizado_por_id_fkey" FOREIGN KEY ("atualizado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
