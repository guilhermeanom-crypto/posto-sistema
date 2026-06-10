-- CreateTable
CREATE TABLE "funcionarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "cargo" TEXT NOT NULL,
    "data_admissao" DATE NOT NULL,
    "data_demissao" DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "funcionario_id" TEXT,
    "funcionario_nome" TEXT NOT NULL,
    "funcionario_cpf" TEXT,
    "cargo" TEXT,
    "tipo" TEXT NOT NULL,
    "data_exame" DATE NOT NULL,
    "data_vencimento" DATE,
    "aptidao" TEXT NOT NULL,
    "medico_responsavel" TEXT,
    "chave_s3" TEXT,
    "nome_arquivo" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_sst" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "responsavel" TEXT,
    "data_elaboracao" DATE,
    "data_vencimento" DATE,
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "chave_s3" TEXT,
    "nome_arquivo" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_sst_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bombas_abastecimento" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fabricante" TEXT NOT NULL,
    "modelo" TEXT,
    "numero_de_serie" TEXT,
    "combustiveis" TEXT[],
    "ultima_calibracao" DATE,
    "proxima_calibracao" DATE,
    "sticker_inmetro" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bombas_abastecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tanques" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "capacidade_litros" INTEGER NOT NULL,
    "combustivel" TEXT NOT NULL,
    "material" TEXT,
    "data_instalacao" DATE,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tanques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testes_estanqueidade" (
    "id" TEXT NOT NULL,
    "tanque_id" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "responsavel" TEXT,
    "data_execucao" DATE NOT NULL,
    "resultado" TEXT NOT NULL,
    "metodo" TEXT,
    "proximo_teste" DATE NOT NULL,
    "chave_s3" TEXT,
    "nome_arquivo" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testes_estanqueidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funcionarios_tenant_id_empreendimento_id_ativo_idx" ON "funcionarios"("tenant_id", "empreendimento_id", "ativo");

-- CreateIndex
CREATE INDEX "asos_tenant_id_empreendimento_id_idx" ON "asos"("tenant_id", "empreendimento_id");

-- CreateIndex
CREATE INDEX "asos_tenant_id_data_vencimento_aptidao_idx" ON "asos"("tenant_id", "data_vencimento", "aptidao");

-- CreateIndex
CREATE INDEX "documentos_sst_tenant_id_empreendimento_id_tipo_idx" ON "documentos_sst"("tenant_id", "empreendimento_id", "tipo");

-- CreateIndex
CREATE INDEX "documentos_sst_tenant_id_data_vencimento_status_idx" ON "documentos_sst"("tenant_id", "data_vencimento", "status");

-- CreateIndex
CREATE INDEX "bombas_abastecimento_tenant_id_empreendimento_id_status_idx" ON "bombas_abastecimento"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "bombas_abastecimento_tenant_id_proxima_calibracao_idx" ON "bombas_abastecimento"("tenant_id", "proxima_calibracao");

-- CreateIndex
CREATE UNIQUE INDEX "bombas_abastecimento_empreendimento_id_numero_key" ON "bombas_abastecimento"("empreendimento_id", "numero");

-- CreateIndex
CREATE INDEX "tanques_tenant_id_empreendimento_id_status_idx" ON "tanques"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tanques_empreendimento_id_numero_key" ON "tanques"("empreendimento_id", "numero");

-- CreateIndex
CREATE INDEX "testes_estanqueidade_tanque_id_data_execucao_idx" ON "testes_estanqueidade"("tanque_id", "data_execucao");

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asos" ADD CONSTRAINT "asos_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asos" ADD CONSTRAINT "asos_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_sst" ADD CONSTRAINT "documentos_sst_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bombas_abastecimento" ADD CONSTRAINT "bombas_abastecimento_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tanques" ADD CONSTRAINT "tanques_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testes_estanqueidade" ADD CONSTRAINT "testes_estanqueidade_tanque_id_fkey" FOREIGN KEY ("tanque_id") REFERENCES "tanques"("id") ON DELETE CASCADE ON UPDATE CASCADE;
