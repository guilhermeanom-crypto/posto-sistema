-- CreateEnum
CREATE TYPE "StatusTenant" AS ENUM ('ATIVO', 'SUSPENSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PlanoTenant" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "TipoEquipamento" AS ENUM ('TANQUE', 'BOMBA', 'LINHA', 'SENSOR', 'CAIXA_SEPARADORA', 'SRV', 'OUTROS');

-- CreateEnum
CREATE TYPE "TipoEventoEquipamento" AS ENUM ('MANUTENCAO_PREVENTIVA', 'MANUTENCAO_CORRETIVA', 'CALIBRACAO', 'SUBSTITUICAO', 'OCORRENCIA', 'DESATIVACAO', 'REATIVACAO', 'INSTALACAO', 'VISTORIA');

-- CreateEnum
CREATE TYPE "StatusPGRS" AS ENUM ('EM_ELABORACAO', 'VIGENTE', 'A_RENOVAR', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusPGRSExigencia" AS ENUM ('PENDENTE', 'EM_CUMPRIMENTO', 'COMPROVADO', 'VENCIDO', 'NAO_APLICAVEL');

-- CreateEnum
CREATE TYPE "EstagioCRM" AS ENUM ('NOVO', 'CONTATADO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO', 'GANHO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "TipoFollowUp" AS ENUM ('LIGACAO', 'EMAIL', 'WHATSAPP', 'VISITA', 'REUNIAO', 'OUTROS');

-- CreateEnum
CREATE TYPE "TipoAutorMsg" AS ENUM ('SISTEMA', 'REPRESENTANTE', 'CONSULTOR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrigemTarefa" ADD VALUE 'REGRA_VENCIMENTO_SST';
ALTER TYPE "OrigemTarefa" ADD VALUE 'REGRA_VENCIMENTO_ESTANQUEIDADE';
ALTER TYPE "OrigemTarefa" ADD VALUE 'REGRA_VENCIMENTO_ANP';
ALTER TYPE "OrigemTarefa" ADD VALUE 'REGRA_VENCIMENTO_OUTORGA';
ALTER TYPE "OrigemTarefa" ADD VALUE 'REGRA_VENCIMENTO_LICENCA';
ALTER TYPE "OrigemTarefa" ADD VALUE 'REGRA_VENCIMENTO_PGRS';

-- AlterEnum
ALTER TYPE "TipoAlerta" ADD VALUE 'ANOMALIA_MONITORAMENTO';

-- DropIndex
DROP INDEX "leads_whatsapp_numero_key";

-- DropIndex
DROP INDEX "leads_whatsapp_status_criado_em_idx";

-- AlterTable
ALTER TABLE "leads_whatsapp" ADD COLUMN     "data_proximo_contato" DATE,
ADD COLUMN     "estagio" "EstagioCRM" NOT NULL DEFAULT 'NOVO',
ADD COLUMN     "responsavel_id" TEXT,
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "valor_estimado" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "tarefas" ADD COLUMN     "score_criticidade" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "data_ativacao" TIMESTAMP(3),
ADD COLUMN     "data_expiracao" TIMESTAMP(3),
ADD COLUMN     "status" "StatusTenant" NOT NULL DEFAULT 'ATIVO',
DROP COLUMN "plano",
ADD COLUMN     "plano" "PlanoTenant" NOT NULL DEFAULT 'STARTER';

-- CreateTable
CREATE TABLE "equipamentos_historico" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "equipamento_tipo" "TipoEquipamento" NOT NULL,
    "equipamento_id" TEXT NOT NULL,
    "tipo_evento" "TipoEventoEquipamento" NOT NULL,
    "data_evento" DATE NOT NULL,
    "descricao" TEXT NOT NULL,
    "responsavel" TEXT,
    "custo" DECIMAL(12,2),
    "documento_id" TEXT,
    "observacoes" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipamentos_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pgrs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "versao" TEXT NOT NULL,
    "responsavel_tecnico" TEXT NOT NULL,
    "art_numero" TEXT,
    "data_aprovacao" DATE NOT NULL,
    "data_vencimento" DATE NOT NULL,
    "status" "StatusPGRS" NOT NULL DEFAULT 'VIGENTE',
    "documento_id" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pgrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pgrs_exigencias" (
    "id" TEXT NOT NULL,
    "pgrs_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo_residuo" TEXT NOT NULL,
    "periodicidade" "PeriodicidadeCondicionante" NOT NULL,
    "prazo_comprovacao_dias" INTEGER NOT NULL,
    "status" "StatusPGRSExigencia" NOT NULL DEFAULT 'PENDENTE',
    "nao_aplicavel" BOOLEAN NOT NULL DEFAULT false,
    "nao_aplicavel_justificativa" TEXT,
    "nao_aplicavel_por_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pgrs_exigencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pgrs_evidencias" (
    "id" TEXT NOT NULL,
    "exigencia_id" TEXT NOT NULL,
    "documento_id" TEXT NOT NULL,
    "periodo_referencia" TEXT NOT NULL,
    "vinculado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pgrs_evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followups_lead" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "autor_id" TEXT,
    "tipo" "TipoFollowUp" NOT NULL,
    "notas" TEXT,
    "realizado_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followups_lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_portal" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "autor_id" TEXT,
    "tipo_autor" "TipoAutorMsg" NOT NULL,
    "texto" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_portal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipamentos_historico_tenant_id_equipamento_tipo_equipamen_idx" ON "equipamentos_historico"("tenant_id", "equipamento_tipo", "equipamento_id");

-- CreateIndex
CREATE INDEX "equipamentos_historico_tenant_id_empreendimento_id_data_eve_idx" ON "equipamentos_historico"("tenant_id", "empreendimento_id", "data_evento");

-- CreateIndex
CREATE INDEX "pgrs_tenant_id_empreendimento_id_status_idx" ON "pgrs"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "pgrs_tenant_id_data_vencimento_idx" ON "pgrs"("tenant_id", "data_vencimento");

-- CreateIndex
CREATE INDEX "pgrs_exigencias_pgrs_id_status_idx" ON "pgrs_exigencias"("pgrs_id", "status");

-- CreateIndex
CREATE INDEX "pgrs_evidencias_exigencia_id_idx" ON "pgrs_evidencias"("exigencia_id");

-- CreateIndex
CREATE INDEX "followups_lead_lead_id_realizado_em_idx" ON "followups_lead"("lead_id", "realizado_em");

-- CreateIndex
CREATE INDEX "mensagens_portal_tenant_id_empreendimento_id_criado_em_idx" ON "mensagens_portal"("tenant_id", "empreendimento_id", "criado_em");

-- CreateIndex
CREATE INDEX "leads_whatsapp_tenant_id_estagio_criado_em_idx" ON "leads_whatsapp"("tenant_id", "estagio", "criado_em");

-- CreateIndex
CREATE INDEX "leads_whatsapp_tenant_id_status_criado_em_idx" ON "leads_whatsapp"("tenant_id", "status", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "leads_whatsapp_tenant_id_numero_key" ON "leads_whatsapp"("tenant_id", "numero");

-- CreateIndex
CREATE INDEX "tarefas_tenant_id_score_criticidade_status_idx" ON "tarefas"("tenant_id", "score_criticidade" DESC, "status");

-- AddForeignKey
ALTER TABLE "equipamentos_historico" ADD CONSTRAINT "equipamentos_historico_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos_historico" ADD CONSTRAINT "equipamentos_historico_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos_historico" ADD CONSTRAINT "equipamentos_historico_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pgrs" ADD CONSTRAINT "pgrs_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pgrs" ADD CONSTRAINT "pgrs_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pgrs_exigencias" ADD CONSTRAINT "pgrs_exigencias_pgrs_id_fkey" FOREIGN KEY ("pgrs_id") REFERENCES "pgrs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pgrs_evidencias" ADD CONSTRAINT "pgrs_evidencias_exigencia_id_fkey" FOREIGN KEY ("exigencia_id") REFERENCES "pgrs_exigencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pgrs_evidencias" ADD CONSTRAINT "pgrs_evidencias_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads_whatsapp" ADD CONSTRAINT "leads_whatsapp_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followups_lead" ADD CONSTRAINT "followups_lead_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_whatsapp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_portal" ADD CONSTRAINT "mensagens_portal_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

