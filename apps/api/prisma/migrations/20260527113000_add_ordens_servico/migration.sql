-- CreateEnum
CREATE TYPE "StatusOrdemServico" AS ENUM ('PLANEJADA', 'EM_EXECUCAO', 'AGUARDANDO_REVISAO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadeOrdemServico" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "TipoOrdemServico" AS ENUM ('VISTORIA_TECNICA', 'COLETA_AMOSTRA', 'RENOVACAO_LICENCA', 'DILIGENCIA', 'PROTOCOLO', 'RELATORIO', 'OUTRO');

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" "StatusOrdemServico" NOT NULL DEFAULT 'PLANEJADA',
    "tipo" "TipoOrdemServico" NOT NULL,
    "prioridade" "PrioridadeOrdemServico" NOT NULL DEFAULT 'MEDIA',
    "contrato_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "responsavel_id" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "atualizado_por_id" TEXT,
    "titulo" TEXT NOT NULL,
    "escopo" TEXT NOT NULL,
    "local_execucao" TEXT,
    "observacoes_execucao" TEXT,
    "observacoes_internas" TEXT,
    "motivo_cancelamento" TEXT,
    "data_planejada" TIMESTAMP(3) NOT NULL,
    "data_prevista_conclusao" TIMESTAMP(3),
    "data_inicio_execucao" TIMESTAMP(3),
    "data_conclusao" TIMESTAMP(3),
    "data_cancelamento" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_tenant_id_numero_key" ON "ordens_servico"("tenant_id", "numero");

-- CreateIndex
CREATE INDEX "ordens_servico_tenant_id_status_data_planejada_idx" ON "ordens_servico"("tenant_id", "status", "data_planejada");

-- CreateIndex
CREATE INDEX "ordens_servico_tenant_id_contrato_id_status_idx" ON "ordens_servico"("tenant_id", "contrato_id", "status");

-- CreateIndex
CREATE INDEX "ordens_servico_tenant_id_responsavel_id_status_idx" ON "ordens_servico"("tenant_id", "responsavel_id", "status");

-- CreateIndex
CREATE INDEX "ordens_servico_tenant_id_empreendimento_id_status_idx" ON "ordens_servico"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "ordens_servico_tenant_id_prioridade_status_idx" ON "ordens_servico"("tenant_id", "prioridade", "status");

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_atualizado_por_id_fkey" FOREIGN KEY ("atualizado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
