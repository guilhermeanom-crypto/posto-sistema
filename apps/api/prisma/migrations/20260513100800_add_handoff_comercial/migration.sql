-- CreateEnum
CREATE TYPE "StatusHandoffComercial" AS ENUM ('AGUARDANDO_HANDOFF', 'EM_TRIAGEM_OPERACIONAL', 'AGUARDANDO_DOCUMENTOS', 'EM_PLANEJAMENTO', 'EM_EXECUCAO', 'PAUSADO', 'CANCELADO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "handoffs_comerciais" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "proposta_comercial_id" TEXT NOT NULL,
    "lead_whatsapp_id" TEXT,
    "empreendimento_id" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "responsavel_comercial_id" TEXT NOT NULL,
    "responsavel_operacional_id" TEXT,
    "status" "StatusHandoffComercial" NOT NULL DEFAULT 'AGUARDANDO_HANDOFF',
    "status_proposta_origem" "StatusPropostaComercial" NOT NULL,
    "origem_proposta" "OrigemPropostaComercial" NOT NULL,
    "numero_proposta" TEXT NOT NULL,
    "data_aprovacao_proposta" TIMESTAMP(3),
    "data_validade_proposta" DATE,
    "nome_lead" TEXT,
    "empresa_lead" TEXT,
    "documento_lead" TEXT,
    "email_contato" TEXT,
    "telefone_contato" TEXT,
    "municipio" TEXT,
    "uf" CHAR(2),
    "cnae_principal_codigo" TEXT,
    "cnae_principal_descricao" TEXT,
    "risco_nivel" "NivelRiscoComercial",
    "risco_score" INTEGER,
    "potencial_poluidor" "PotencialPoluidorComercial",
    "licenciamento_tipo" TEXT,
    "orgao_competente" TEXT,
    "esfera" "EsferaRegulatoria",
    "alertas_resumo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "proximos_passos_resumo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observacoes_liberadas" TEXT,
    "servicos_resumo" JSONB NOT NULL,
    "origem_snapshot_saneado" JSONB NOT NULL,
    "pendencias_operacionais" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observacoes_operacionais" TEXT,
    "assumido_em" TIMESTAMP(3),
    "concluido_em" TIMESTAMP(3),
    "cancelado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handoffs_comerciais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "handoffs_comerciais_tenant_id_status_criado_em_idx" ON "handoffs_comerciais"("tenant_id", "status", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "handoffs_comerciais_tenant_id_proposta_comercial_id_status_idx" ON "handoffs_comerciais"("tenant_id", "proposta_comercial_id", "status");

-- CreateIndex
CREATE INDEX "handoffs_comerciais_tenant_id_lead_whatsapp_id_status_idx" ON "handoffs_comerciais"("tenant_id", "lead_whatsapp_id", "status");

-- CreateIndex
CREATE INDEX "handoffs_comerciais_tenant_id_empreendimento_id_status_idx" ON "handoffs_comerciais"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "handoffs_comerciais_tenant_id_responsavel_comercial_id_stat_idx" ON "handoffs_comerciais"("tenant_id", "responsavel_comercial_id", "status");

-- CreateIndex
CREATE INDEX "handoffs_comerciais_tenant_id_responsavel_operacional_id_st_idx" ON "handoffs_comerciais"("tenant_id", "responsavel_operacional_id", "status");

-- AddForeignKey
ALTER TABLE "handoffs_comerciais" ADD CONSTRAINT "handoffs_comerciais_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs_comerciais" ADD CONSTRAINT "handoffs_comerciais_proposta_comercial_id_fkey" FOREIGN KEY ("proposta_comercial_id") REFERENCES "propostas_comerciais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs_comerciais" ADD CONSTRAINT "handoffs_comerciais_lead_whatsapp_id_fkey" FOREIGN KEY ("lead_whatsapp_id") REFERENCES "leads_whatsapp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs_comerciais" ADD CONSTRAINT "handoffs_comerciais_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs_comerciais" ADD CONSTRAINT "handoffs_comerciais_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs_comerciais" ADD CONSTRAINT "handoffs_comerciais_responsavel_comercial_id_fkey" FOREIGN KEY ("responsavel_comercial_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs_comerciais" ADD CONSTRAINT "handoffs_comerciais_responsavel_operacional_id_fkey" FOREIGN KEY ("responsavel_operacional_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
