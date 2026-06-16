-- CreateEnum
CREATE TYPE "Porte" AS ENUM ('MEI', 'ME', 'EPP', 'MEDIO', 'GRANDE');

-- CreateEnum
CREATE TYPE "SituacaoEmpreendimento" AS ENUM ('PLANEJADO', 'IMPLANTACAO', 'OPERACAO', 'IRREGULAR', 'RENOVACAO');

-- CreateEnum
CREATE TYPE "TipoCaptacao" AS ENUM ('POCO_ARTESIANO', 'SUPERFICIAL', 'CONCESSIONARIA', 'NENHUMA');

-- CreateEnum
CREATE TYPE "MaterialTanque" AS ENUM ('ACO_PAREDE_SIMPLES', 'ACO_PAREDE_DUPLA', 'FIBRA_PAREDE_SIMPLES', 'FIBRA_PAREDE_DUPLA', 'JAQUETADO');

-- CreateEnum
CREATE TYPE "ClasseAquifero" AS ENUM ('LIVRE_RASO', 'LIVRE_PROFUNDO', 'CONFINADO', 'DESCONHECIDO');

-- CreateEnum
CREATE TYPE "TipoSolo" AS ENUM ('ARENOSO', 'ARGILOSO', 'MISTO', 'ROCHOSO', 'DESCONHECIDO');

-- CreateEnum
CREATE TYPE "ClassificacaoAreaContaminada" AS ENUM ('NAO_AVALIADA', 'SEM_INDICIO', 'SUSPEITA', 'CONTAMINADA', 'REABILITADA');

-- CreateEnum
CREATE TYPE "EsferaLicenciamento" AS ENUM ('MUNICIPAL', 'ESTADUAL', 'FEDERAL');

-- CreateEnum
CREATE TYPE "NivelRiscoDiagnostico" AS ENUM ('BAIXO', 'MEDIO', 'ALTO', 'CRITICO');

-- CreateEnum
CREATE TYPE "StatusObrigacaoDiag" AS ENUM ('CONFORME', 'A_RENOVAR', 'SEM_DADOS', 'NAO_APLICAVEL');

-- AlterTable
ALTER TABLE "empreendimentos" ADD COLUMN     "area_m2" DECIMAL(12,2),
ADD COLUMN     "capta_para_consumo" BOOLEAN,
ADD COLUMN     "classe_aquifero" "ClasseAquifero",
ADD COLUMN     "classificacao_area_contaminada" "ClassificacaoAreaContaminada",
ADD COLUMN     "cnae_principal" TEXT,
ADD COLUMN     "cnaes_secundarios" TEXT[],
ADD COLUMN     "codigo_ibge" TEXT,
ADD COLUMN     "distancia_corpo_hidrico_m" INTEGER,
ADD COLUMN     "distancia_poco_abastecimento_m" INTEGER,
ADD COLUMN     "em_app" BOOLEAN,
ADD COLUMN     "porte" "Porte",
ADD COLUMN     "possui_captacao" BOOLEAN,
ADD COLUMN     "possui_sao" BOOLEAN,
ADD COLUMN     "profundidade_nivel_agua_m" DECIMAL(6,2),
ADD COLUMN     "situacao_empreendimento" "SituacaoEmpreendimento",
ADD COLUMN     "tipo_captacao" "TipoCaptacao",
ADD COLUMN     "tipo_solo" "TipoSolo";

-- AlterTable
ALTER TABLE "obrigacoes_regulatorias_base" ADD COLUMN     "aplicabilidade" JSONB,
ADD COLUMN     "base_legal_consequencia" TEXT,
ADD COLUMN     "consequencia_sem_fazer" TEXT,
ADD COLUMN     "custo_servico_ref" DECIMAL(12,2),
ADD COLUMN     "multa_maxima" TEXT;

-- AlterTable
ALTER TABLE "tanques" ADD COLUMN     "material_tanque" "MaterialTanque";

-- CreateTable
CREATE TABLE "cnaes" (
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "secao" TEXT,
    "divisao" TEXT,
    "grupo" TEXT,

    CONSTRAINT "cnaes_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "regulatory_matrix" (
    "id" TEXT NOT NULL,
    "cnae_codigo" TEXT NOT NULL,
    "classe_risco" TEXT,
    "potencial_poluidor" TEXT,
    "licenciamento_tipo" TEXT,
    "orgao_competente" TEXT,
    "esfera" "EsferaLicenciamento",
    "necessita_eia" BOOLEAN NOT NULL DEFAULT false,
    "necessita_outorga" BOOLEAN NOT NULL DEFAULT false,
    "necessita_monitoramento" BOOLEAN NOT NULL DEFAULT false,
    "nivel_risco" INTEGER,
    "impactos" TEXT[],
    "servicos_recomendados" TEXT[],
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orgaos_licenciadores_uf" (
    "uf" CHAR(2) NOT NULL,
    "orgao" TEXT NOT NULL,
    "esfera_padrao" "EsferaLicenciamento" NOT NULL,

    CONSTRAINT "orgaos_licenciadores_uf_pkey" PRIMARY KEY ("uf")
);

-- CreateTable
CREATE TABLE "diagnosticos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "snapshot_hash" TEXT NOT NULL,
    "engine_version" TEXT NOT NULL,
    "rules_version" TEXT NOT NULL,
    "risco_conformidade_score" INTEGER NOT NULL,
    "risco_intrinseco_score" INTEGER NOT NULL,
    "risco_nivel" "NivelRiscoDiagnostico" NOT NULL,
    "conformidade_score" INTEGER NOT NULL,
    "enquadramento" JSONB,
    "fatores_risco" JSONB,
    "fases" JSONB,
    "orcamento" JSONB,
    "input_snapshot" JSONB,
    "calculado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostico_obrigacoes" (
    "id" TEXT NOT NULL,
    "diagnostico_id" TEXT NOT NULL,
    "obrigacao_base_id" TEXT,
    "codigo" TEXT NOT NULL,
    "aplicavel" BOOLEAN NOT NULL DEFAULT true,
    "motivo_aplicabilidade" TEXT,
    "status" "StatusObrigacaoDiag" NOT NULL DEFAULT 'SEM_DADOS',
    "consequencia" TEXT,
    "multa_maxima" TEXT,
    "custo_servico" DECIMAL(12,2),
    "periodicidade_derivada" TEXT,

    CONSTRAINT "diagnostico_obrigacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regulatory_matrix_cnae_codigo_key" ON "regulatory_matrix"("cnae_codigo");

-- CreateIndex
CREATE INDEX "diagnosticos_tenant_id_empreendimento_id_idx" ON "diagnosticos"("tenant_id", "empreendimento_id");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosticos_empreendimento_id_versao_key" ON "diagnosticos"("empreendimento_id", "versao");

-- CreateIndex
CREATE INDEX "diagnostico_obrigacoes_diagnostico_id_idx" ON "diagnostico_obrigacoes"("diagnostico_id");

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostico_obrigacoes" ADD CONSTRAINT "diagnostico_obrigacoes_diagnostico_id_fkey" FOREIGN KEY ("diagnostico_id") REFERENCES "diagnosticos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

