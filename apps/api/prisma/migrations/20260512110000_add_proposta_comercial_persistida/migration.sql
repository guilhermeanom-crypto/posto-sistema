-- CreateEnum
CREATE TYPE "StatusPropostaComercial" AS ENUM ('RASCUNHO', 'PRONTA', 'ENVIADA', 'EM_NEGOCIACAO', 'APROVADA', 'REJEITADA', 'EXPIRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "OrigemPropostaComercial" AS ENUM ('TRIAGEM_CNAE', 'CRM', 'ONBOARDING', 'MANUAL');

-- CreateEnum
CREATE TYPE "PorteDiagnosticoComercial" AS ENUM ('MICRO', 'PEQUENO', 'MEDIO', 'GRANDE', 'MUITO_GRANDE');

-- CreateEnum
CREATE TYPE "SituacaoDiagnosticoComercial" AS ENUM ('PLANEJADO', 'IMPLANTACAO', 'OPERACAO', 'IRREGULAR', 'RENOVACAO');

-- CreateEnum
CREATE TYPE "NivelRiscoComercial" AS ENUM ('BAIXO', 'MEDIO', 'ALTO', 'CRITICO');

-- CreateEnum
CREATE TYPE "PotencialPoluidorComercial" AS ENUM ('BAIXO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "DecisaoItemProposta" AS ENUM ('OBRIGATORIO', 'CONDICIONAL', 'OPCIONAL', 'MANUAL');

-- CreateTable
CREATE TABLE "diagnosticos_comerciais" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "criado_por_id" TEXT NOT NULL,
    "lead_whatsapp_id" TEXT,
    "empreendimento_id" TEXT,
    "origem" "OrigemPropostaComercial" NOT NULL DEFAULT 'TRIAGEM_CNAE',
    "cnaes" TEXT[],
    "uf" CHAR(2) NOT NULL,
    "municipio" TEXT,
    "porte" "PorteDiagnosticoComercial" NOT NULL,
    "situacao" "SituacaoDiagnosticoComercial" NOT NULL,
    "tem_licenca_anterior" BOOLEAN NOT NULL DEFAULT false,
    "tem_outorga_anterior" BOOLEAN NOT NULL DEFAULT false,
    "cnae_principal_codigo" TEXT NOT NULL,
    "cnae_principal_descricao" TEXT NOT NULL,
    "risco_score" INTEGER NOT NULL,
    "risco_nivel" "NivelRiscoComercial" NOT NULL,
    "potencial_poluidor" "PotencialPoluidorComercial" NOT NULL,
    "licenciamento_tipo" TEXT NOT NULL,
    "orgao_competente" TEXT NOT NULL,
    "esfera" "EsferaRegulatoria" NOT NULL,
    "necessita_eia" BOOLEAN NOT NULL DEFAULT false,
    "necessita_outorga" BOOLEAN NOT NULL DEFAULT false,
    "necessita_monitoramento" BOOLEAN NOT NULL DEFAULT false,
    "principais_impactos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orcamento_minimo" DECIMAL(12,2) NOT NULL,
    "orcamento_base" DECIMAL(12,2) NOT NULL,
    "orcamento_maximo" DECIMAL(12,2) NOT NULL,
    "alertas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "proximos_passos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cobertura_limitada" BOOLEAN NOT NULL DEFAULT false,
    "input_snapshot" JSONB NOT NULL,
    "resultado_snapshot" JSONB NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosticos_comerciais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propostas_comerciais" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "diagnostico_id" TEXT NOT NULL,
    "lead_whatsapp_id" TEXT,
    "empreendimento_id" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "atualizado_por_id" TEXT,
    "numero" TEXT NOT NULL,
    "origem" "OrigemPropostaComercial" NOT NULL DEFAULT 'TRIAGEM_CNAE',
    "status" "StatusPropostaComercial" NOT NULL DEFAULT 'RASCUNHO',
    "nome_lead" TEXT,
    "empresa_lead" TEXT,
    "documento_lead" TEXT,
    "email_contato" TEXT,
    "telefone_contato" TEXT,
    "municipio" TEXT,
    "uf" CHAR(2) NOT NULL,
    "subtotal_minimo" DECIMAL(12,2) NOT NULL,
    "subtotal_base" DECIMAL(12,2) NOT NULL,
    "subtotal_maximo" DECIMAL(12,2) NOT NULL,
    "desconto_valor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "acrescimo_valor" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_minimo" DECIMAL(12,2) NOT NULL,
    "total_base" DECIMAL(12,2) NOT NULL,
    "total_maximo" DECIMAL(12,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "data_validade" DATE NOT NULL,
    "observacoes_comerciais" TEXT,
    "observacoes_internas" TEXT,
    "catalogo_snapshot_em" TIMESTAMP(3) NOT NULL,
    "enviada_em" TIMESTAMP(3),
    "aprovada_em" TIMESTAMP(3),
    "rejeitada_em" TIMESTAMP(3),
    "expirada_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propostas_comerciais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_proposta" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "proposta_id" TEXT NOT NULL,
    "servico_catalogo_id" TEXT,
    "ordem" INTEGER NOT NULL,
    "origem" "OrigemPropostaComercial" NOT NULL DEFAULT 'TRIAGEM_CNAE',
    "decisao" "DecisaoItemProposta" NOT NULL,
    "codigo_servico" TEXT NOT NULL,
    "nome_servico" TEXT NOT NULL,
    "categoria_servico" TEXT NOT NULL,
    "justificativa" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "preco_minimo_unitario" DECIMAL(12,2) NOT NULL,
    "preco_base_unitario" DECIMAL(12,2) NOT NULL,
    "preco_maximo_unitario" DECIMAL(12,2) NOT NULL,
    "preco_aplicado_unitario" DECIMAL(12,2) NOT NULL,
    "valor_minimo_linha" DECIMAL(12,2) NOT NULL,
    "valor_base_linha" DECIMAL(12,2) NOT NULL,
    "valor_maximo_linha" DECIMAL(12,2) NOT NULL,
    "valor_aplicado_linha" DECIMAL(12,2) NOT NULL,
    "observacao_linha" TEXT,
    "editavel" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "snapshot_catalogo" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_proposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diagnosticos_comerciais_tenant_id_criado_em_idx" ON "diagnosticos_comerciais"("tenant_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "diagnosticos_comerciais_tenant_id_lead_whatsapp_id_criado_e_idx" ON "diagnosticos_comerciais"("tenant_id", "lead_whatsapp_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "diagnosticos_comerciais_tenant_id_empreendimento_id_criado__idx" ON "diagnosticos_comerciais"("tenant_id", "empreendimento_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "diagnosticos_comerciais_tenant_id_risco_nivel_criado_em_idx" ON "diagnosticos_comerciais"("tenant_id", "risco_nivel", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "propostas_comerciais_tenant_id_status_criado_em_idx" ON "propostas_comerciais"("tenant_id", "status", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "propostas_comerciais_tenant_id_lead_whatsapp_id_criado_em_idx" ON "propostas_comerciais"("tenant_id", "lead_whatsapp_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "propostas_comerciais_tenant_id_empreendimento_id_criado_em_idx" ON "propostas_comerciais"("tenant_id", "empreendimento_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "propostas_comerciais_tenant_id_data_validade_idx" ON "propostas_comerciais"("tenant_id", "data_validade");

-- CreateIndex
CREATE INDEX "propostas_comerciais_tenant_id_diagnostico_id_idx" ON "propostas_comerciais"("tenant_id", "diagnostico_id");

-- CreateIndex
CREATE UNIQUE INDEX "propostas_comerciais_tenant_id_numero_key" ON "propostas_comerciais"("tenant_id", "numero");

-- CreateIndex
CREATE INDEX "itens_proposta_tenant_id_proposta_id_ordem_idx" ON "itens_proposta"("tenant_id", "proposta_id", "ordem");

-- CreateIndex
CREATE INDEX "itens_proposta_tenant_id_servico_catalogo_id_idx" ON "itens_proposta"("tenant_id", "servico_catalogo_id");

-- CreateIndex
CREATE INDEX "itens_proposta_tenant_id_codigo_servico_idx" ON "itens_proposta"("tenant_id", "codigo_servico");

-- CreateIndex
CREATE UNIQUE INDEX "itens_proposta_proposta_id_ordem_key" ON "itens_proposta"("proposta_id", "ordem");

-- AddForeignKey
ALTER TABLE "diagnosticos_comerciais" ADD CONSTRAINT "diagnosticos_comerciais_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_comerciais" ADD CONSTRAINT "diagnosticos_comerciais_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_comerciais" ADD CONSTRAINT "diagnosticos_comerciais_lead_whatsapp_id_fkey" FOREIGN KEY ("lead_whatsapp_id") REFERENCES "leads_whatsapp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_comerciais" ADD CONSTRAINT "diagnosticos_comerciais_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas_comerciais" ADD CONSTRAINT "propostas_comerciais_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas_comerciais" ADD CONSTRAINT "propostas_comerciais_diagnostico_id_fkey" FOREIGN KEY ("diagnostico_id") REFERENCES "diagnosticos_comerciais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas_comerciais" ADD CONSTRAINT "propostas_comerciais_lead_whatsapp_id_fkey" FOREIGN KEY ("lead_whatsapp_id") REFERENCES "leads_whatsapp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas_comerciais" ADD CONSTRAINT "propostas_comerciais_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas_comerciais" ADD CONSTRAINT "propostas_comerciais_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas_comerciais" ADD CONSTRAINT "propostas_comerciais_atualizado_por_id_fkey" FOREIGN KEY ("atualizado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_proposta" ADD CONSTRAINT "itens_proposta_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_proposta" ADD CONSTRAINT "itens_proposta_proposta_id_fkey" FOREIGN KEY ("proposta_id") REFERENCES "propostas_comerciais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_proposta" ADD CONSTRAINT "itens_proposta_servico_catalogo_id_fkey" FOREIGN KEY ("servico_catalogo_id") REFERENCES "servicos_consultoria_base"("id") ON DELETE SET NULL ON UPDATE CASCADE;
