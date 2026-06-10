-- CreateEnum
CREATE TYPE "PrioridadePendencia" AS ENUM ('CRITICA', 'ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "StatusPendenciaCampo" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'ENVIADA_CLIENTE', 'RESOLVIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusValidacaoEvidencia" AS ENUM ('PENDENTE', 'VALIDADA', 'REJEITADA');

-- CreateTable
CREATE TABLE "pendencias_campo" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" "PrioridadePendencia" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusPendenciaCampo" NOT NULL DEFAULT 'ABERTA',
    "prazo" DATE,
    "observacao" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "responsavel_id" TEXT,
    "resolvido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendencias_campo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias_campo" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ordem_servico_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "nota" TEXT NOT NULL,
    "chave_s3" TEXT,
    "arquivo_nome" TEXT,
    "arquivo_mime" TEXT,
    "arquivo_bytes" BIGINT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "statusValidacao" "StatusValidacaoEvidencia" NOT NULL DEFAULT 'PENDENTE',
    "validado_por_id" TEXT,
    "validado_em" TIMESTAMP(3),
    "capturado_por_id" TEXT NOT NULL,
    "capturado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_campo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pendencias_campo_tenant_id_ordem_servico_id_status_idx" ON "pendencias_campo"("tenant_id", "ordem_servico_id", "status");

-- CreateIndex
CREATE INDEX "pendencias_campo_tenant_id_empreendimento_id_status_idx" ON "pendencias_campo"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "pendencias_campo_tenant_id_status_prazo_idx" ON "pendencias_campo"("tenant_id", "status", "prazo");

-- CreateIndex
CREATE INDEX "evidencias_campo_tenant_id_ordem_servico_id_idx" ON "evidencias_campo"("tenant_id", "ordem_servico_id");

-- CreateIndex
CREATE INDEX "evidencias_campo_tenant_id_empreendimento_id_statusValidaca_idx" ON "evidencias_campo"("tenant_id", "empreendimento_id", "statusValidacao");

-- CreateIndex
CREATE INDEX "evidencias_campo_tenant_id_statusValidacao_idx" ON "evidencias_campo"("tenant_id", "statusValidacao");

-- AddForeignKey
ALTER TABLE "pendencias_campo" ADD CONSTRAINT "pendencias_campo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias_campo" ADD CONSTRAINT "pendencias_campo_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias_campo" ADD CONSTRAINT "pendencias_campo_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias_campo" ADD CONSTRAINT "pendencias_campo_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias_campo" ADD CONSTRAINT "pendencias_campo_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_campo" ADD CONSTRAINT "evidencias_campo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_campo" ADD CONSTRAINT "evidencias_campo_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_campo" ADD CONSTRAINT "evidencias_campo_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_campo" ADD CONSTRAINT "evidencias_campo_capturado_por_id_fkey" FOREIGN KEY ("capturado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_campo" ADD CONSTRAINT "evidencias_campo_validado_por_id_fkey" FOREIGN KEY ("validado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

