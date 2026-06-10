-- CreateEnum
CREATE TYPE "TipoLicencaAmbiental" AS ENUM ('LI', 'LP', 'LO', 'LAO', 'LAS', 'LAF', 'LAT', 'OUTRAS');

-- CreateEnum
CREATE TYPE "StatusLicenca" AS ENUM ('VIGENTE', 'A_RENOVAR', 'VENCIDA', 'SUSPENSA', 'CANCELADA', 'EM_RENOVACAO');

-- CreateEnum
CREATE TYPE "TipoAlvara" AS ENUM ('AVCB', 'HABITE_SE', 'ALVARA_FUNCIONAMENTO', 'PPCI', 'LICENCA_SANITARIA', 'ALVARA_OBRAS', 'OUTROS');

-- CreateTable
CREATE TABLE "licencas_ambientais" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "tipo" "TipoLicencaAmbiental" NOT NULL,
    "numero" TEXT NOT NULL,
    "orgao_emissor" TEXT NOT NULL,
    "responsavel_tecnico" TEXT,
    "data_emissao" DATE NOT NULL,
    "data_vencimento" DATE NOT NULL,
    "status" "StatusLicenca" NOT NULL DEFAULT 'VIGENTE',
    "chave_s3" TEXT,
    "nome_arquivo" TEXT,
    "observacoes" TEXT,
    "dias_alerta" INTEGER[] DEFAULT ARRAY[90, 60, 30, 15, 7]::INTEGER[],
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licencas_ambientais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condicoes_licenca" (
    "id" TEXT NOT NULL,
    "licenca_id" TEXT NOT NULL,
    "numero" TEXT,
    "descricao" TEXT NOT NULL,
    "prazo" DATE,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "comprovante" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condicoes_licenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alvaras_urbanisticos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "tipo" "TipoAlvara" NOT NULL,
    "numero" TEXT,
    "orgao_emissor" TEXT NOT NULL,
    "data_emissao" DATE,
    "data_vencimento" DATE,
    "status" "StatusLicenca" NOT NULL DEFAULT 'VIGENTE',
    "chave_s3" TEXT,
    "nome_arquivo" TEXT,
    "observacoes" TEXT,
    "dias_alerta" INTEGER[] DEFAULT ARRAY[120, 60, 30]::INTEGER[],
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alvaras_urbanisticos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "licencas_ambientais_tenant_id_empreendimento_id_status_idx" ON "licencas_ambientais"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "licencas_ambientais_tenant_id_data_vencimento_status_idx" ON "licencas_ambientais"("tenant_id", "data_vencimento", "status");

-- CreateIndex
CREATE INDEX "condicoes_licenca_licenca_id_status_idx" ON "condicoes_licenca"("licenca_id", "status");

-- CreateIndex
CREATE INDEX "alvaras_urbanisticos_tenant_id_empreendimento_id_status_idx" ON "alvaras_urbanisticos"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "alvaras_urbanisticos_tenant_id_data_vencimento_status_idx" ON "alvaras_urbanisticos"("tenant_id", "data_vencimento", "status");

-- AddForeignKey
ALTER TABLE "licencas_ambientais" ADD CONSTRAINT "licencas_ambientais_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicoes_licenca" ADD CONSTRAINT "condicoes_licenca_licenca_id_fkey" FOREIGN KEY ("licenca_id") REFERENCES "licencas_ambientais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alvaras_urbanisticos" ADD CONSTRAINT "alvaras_urbanisticos_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
