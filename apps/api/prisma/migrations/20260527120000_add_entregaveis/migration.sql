-- CreateEnum
CREATE TYPE "StatusEntregavel" AS ENUM ('PENDENTE', 'GERANDO', 'DISPONIVEL', 'ERRO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoEntregavel" AS ENUM ('LAUDO', 'RELATORIO', 'PROTOCOLO', 'CERTIFICADO', 'ATA', 'EVIDENCIA', 'OUTRO');

-- CreateTable
CREATE TABLE "entregaveis" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" "StatusEntregavel" NOT NULL DEFAULT 'PENDENTE',
    "tipo" "TipoEntregavel" NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
    "contrato_id" TEXT,
    "empreendimento_id" TEXT NOT NULL,
    "criado_por_id" TEXT NOT NULL,
    "atualizado_por_id" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "s3_key" TEXT,
    "nome_arquivo" TEXT,
    "tamanho_bytes" INTEGER,
    "erro_msg" TEXT,
    "gerado_em" TIMESTAMP(3),
    "cancelado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entregaveis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entregaveis_tenant_id_numero_key" ON "entregaveis"("tenant_id", "numero");

-- CreateIndex
CREATE INDEX "entregaveis_tenant_id_status_criado_em_idx" ON "entregaveis"("tenant_id", "status", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "entregaveis_tenant_id_ordem_servico_id_status_idx" ON "entregaveis"("tenant_id", "ordem_servico_id", "status");

-- CreateIndex
CREATE INDEX "entregaveis_tenant_id_contrato_id_status_idx" ON "entregaveis"("tenant_id", "contrato_id", "status");

-- CreateIndex
CREATE INDEX "entregaveis_tenant_id_empreendimento_id_status_idx" ON "entregaveis"("tenant_id", "empreendimento_id", "status");

-- AddForeignKey
ALTER TABLE "entregaveis" ADD CONSTRAINT "entregaveis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregaveis" ADD CONSTRAINT "entregaveis_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregaveis" ADD CONSTRAINT "entregaveis_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregaveis" ADD CONSTRAINT "entregaveis_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregaveis" ADD CONSTRAINT "entregaveis_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregaveis" ADD CONSTRAINT "entregaveis_atualizado_por_id_fkey" FOREIGN KEY ("atualizado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
