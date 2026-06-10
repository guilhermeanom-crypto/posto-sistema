-- CreateTable
CREATE TABLE "transportadoras" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "licenca_ambiental" TEXT,
    "validade_licenca" DATE,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transportadoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mtrs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "transportadora_id" TEXT,
    "numero_mtr" TEXT,
    "data_emissao" DATE NOT NULL,
    "data_coleta" DATE,
    "residuos" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "certidao_s3" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mtrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pocos_artesianos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "profundidade" DECIMAL(8,2),
    "coordenadas" TEXT,
    "outorga_daee" TEXT,
    "validade_outorga" DATE,
    "vazao_autorizada" DECIMAL(10,2),
    "data_perforacao" DATE,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pocos_artesianos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laudos_agua" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "data_campanha" DATE NOT NULL,
    "laboratorio" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "parametros" JSONB NOT NULL,
    "chave_s3" TEXT,
    "nome_arquivo" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laudos_agua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pocos_monitoramento" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "profundidade" DECIMAL(8,2),
    "coordenadas" TEXT,
    "data_instalacao" DATE,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pocos_monitoramento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanhas_monitoramento" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "poco_monitoramento_id" TEXT,
    "tipo" TEXT NOT NULL,
    "data_coleta" DATE NOT NULL,
    "laboratorio" TEXT NOT NULL,
    "resultado" TEXT NOT NULL DEFAULT 'CONFORME',
    "chave_s3" TEXT,
    "nome_arquivo" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campanhas_monitoramento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros_contaminantes" (
    "id" TEXT NOT NULL,
    "campanha_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor_medido" DECIMAL(15,6) NOT NULL,
    "limite_vmp" DECIMAL(15,6),
    "unidade" TEXT NOT NULL,
    "em_alerta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "parametros_contaminantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transportadoras_tenant_id_ativo_idx" ON "transportadoras"("tenant_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "transportadoras_tenant_id_cnpj_key" ON "transportadoras"("tenant_id", "cnpj");

-- CreateIndex
CREATE INDEX "mtrs_tenant_id_empreendimento_id_status_idx" ON "mtrs"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "mtrs_tenant_id_data_emissao_idx" ON "mtrs"("tenant_id", "data_emissao");

-- CreateIndex
CREATE INDEX "pocos_artesianos_tenant_id_empreendimento_id_status_idx" ON "pocos_artesianos"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "pocos_artesianos_tenant_id_validade_outorga_idx" ON "pocos_artesianos"("tenant_id", "validade_outorga");

-- CreateIndex
CREATE INDEX "laudos_agua_poco_id_data_campanha_idx" ON "laudos_agua"("poco_id", "data_campanha");

-- CreateIndex
CREATE INDEX "pocos_monitoramento_tenant_id_empreendimento_id_idx" ON "pocos_monitoramento"("tenant_id", "empreendimento_id");

-- CreateIndex
CREATE INDEX "campanhas_monitoramento_tenant_id_empreendimento_id_resulta_idx" ON "campanhas_monitoramento"("tenant_id", "empreendimento_id", "resultado");

-- CreateIndex
CREATE INDEX "campanhas_monitoramento_tenant_id_data_coleta_idx" ON "campanhas_monitoramento"("tenant_id", "data_coleta");

-- CreateIndex
CREATE INDEX "parametros_contaminantes_campanha_id_em_alerta_idx" ON "parametros_contaminantes"("campanha_id", "em_alerta");

-- AddForeignKey
ALTER TABLE "transportadoras" ADD CONSTRAINT "transportadoras_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mtrs" ADD CONSTRAINT "mtrs_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mtrs" ADD CONSTRAINT "mtrs_transportadora_id_fkey" FOREIGN KEY ("transportadora_id") REFERENCES "transportadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pocos_artesianos" ADD CONSTRAINT "pocos_artesianos_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laudos_agua" ADD CONSTRAINT "laudos_agua_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "pocos_artesianos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pocos_monitoramento" ADD CONSTRAINT "pocos_monitoramento_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas_monitoramento" ADD CONSTRAINT "campanhas_monitoramento_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas_monitoramento" ADD CONSTRAINT "campanhas_monitoramento_poco_monitoramento_id_fkey" FOREIGN KEY ("poco_monitoramento_id") REFERENCES "pocos_monitoramento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametros_contaminantes" ADD CONSTRAINT "parametros_contaminantes_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas_monitoramento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
