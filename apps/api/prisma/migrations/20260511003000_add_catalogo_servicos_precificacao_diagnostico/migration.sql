-- CreateTable: servicos_consultoria_base
CREATE TABLE "servicos_consultoria_base" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "horas_tecnicas_base" DECIMAL(10,2) NOT NULL DEFAULT 8,
    "fator_complexidade" DECIMAL(6,2) NOT NULL DEFAULT 1,
    "valor_referencia_hora" DECIMAL(12,2) NOT NULL DEFAULT 180,
    "obrigacao_base_id" TEXT,
    "obrigacao_base_codigo" TEXT,
    "metadata" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "servicos_consultoria_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable: politicas_precificacao_diagnostico
CREATE TABLE "politicas_precificacao_diagnostico" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Padrao',
    "porte_pequeno_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 0.90,
    "porte_medio_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.15,
    "porte_grande_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.40,
    "situacao_implantacao_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.10,
    "situacao_operacao_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    "situacao_irregular_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.30,
    "situacao_ampliacao_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.15,
    "potencial_alto_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.10,
    "potencial_muito_alto_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.20,
    "area_media_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.10,
    "area_grande_multiplier" DECIMAL(6,2) NOT NULL DEFAULT 1.20,
    "desconto_categoria_3_plus" DECIMAL(6,2) NOT NULL DEFAULT 0.10,
    "desconto_volume_5_plus" DECIMAL(6,2) NOT NULL DEFAULT 0.05,
    "desconto_maximo" DECIMAL(6,2) NOT NULL DEFAULT 0.15,
    "validade_proposta_dias" INTEGER NOT NULL DEFAULT 30,
    "metadata" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "politicas_precificacao_diagnostico_pkey" PRIMARY KEY ("id")
);

-- Unique / Indexes
CREATE UNIQUE INDEX "servicos_consultoria_base_codigo_key"
    ON "servicos_consultoria_base"("codigo");

CREATE INDEX "servicos_consultoria_base_categoria_ativo_idx"
    ON "servicos_consultoria_base"("categoria", "ativo");

CREATE INDEX "servicos_consultoria_base_obrigacao_base_id_ativo_idx"
    ON "servicos_consultoria_base"("obrigacao_base_id", "ativo");

CREATE INDEX "servicos_consultoria_base_obrigacao_base_codigo_ativo_idx"
    ON "servicos_consultoria_base"("obrigacao_base_codigo", "ativo");

CREATE UNIQUE INDEX "politicas_precificacao_diagnostico_tenant_id_key"
    ON "politicas_precificacao_diagnostico"("tenant_id");

CREATE INDEX "politicas_precificacao_diagnostico_ativo_idx"
    ON "politicas_precificacao_diagnostico"("ativo");

-- Foreign Keys
ALTER TABLE "servicos_consultoria_base"
    ADD CONSTRAINT "servicos_consultoria_base_obrigacao_base_id_fkey"
    FOREIGN KEY ("obrigacao_base_id")
    REFERENCES "obrigacoes_regulatorias_base"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE "politicas_precificacao_diagnostico"
    ADD CONSTRAINT "politicas_precificacao_diagnostico_tenant_id_fkey"
    FOREIGN KEY ("tenant_id")
    REFERENCES "tenants"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
