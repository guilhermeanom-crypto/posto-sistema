/*
  Warnings:

  - The primary key for the `leads_whatsapp` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `mensagens_lead` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "entregas_epi" DROP CONSTRAINT "fk_entregas_epi_empreendimento";

-- DropForeignKey
ALTER TABLE "entregas_epi" DROP CONSTRAINT "fk_entregas_epi_funcionario";

-- DropForeignKey
ALTER TABLE "mensagens_lead" DROP CONSTRAINT "mensagens_lead_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "treinamento_execucoes" DROP CONSTRAINT "fk_treinamento_execucoes_empreendimento";

-- DropForeignKey
ALTER TABLE "treinamento_execucoes" DROP CONSTRAINT "fk_treinamento_execucoes_tipo";

-- DropForeignKey
ALTER TABLE "treinamento_participantes" DROP CONSTRAINT "fk_treinamento_participantes_execucao";

-- DropForeignKey
ALTER TABLE "treinamento_participantes" DROP CONSTRAINT "fk_treinamento_participantes_funcionario";

-- DropForeignKey
ALTER TABLE "treinamento_tipos" DROP CONSTRAINT "fk_treinamento_tipos_tenant";

-- AlterTable
ALTER TABLE "entregas_epi" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "leads_whatsapp" DROP CONSTRAINT "leads_whatsapp_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "leads_whatsapp_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "mensagens_lead" DROP CONSTRAINT "mensagens_lead_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "lead_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "mensagens_lead_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pocos_monitoramento" ALTER COLUMN "atualizado_em" DROP DEFAULT;

-- AlterTable
ALTER TABLE "treinamento_execucoes" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "atualizado_em" DROP DEFAULT,
ALTER COLUMN "atualizado_em" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "treinamento_participantes" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "treinamento_tipos" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "obrigatorio_para_cargos" DROP DEFAULT,
ALTER COLUMN "conteudo_programatico" DROP DEFAULT,
ALTER COLUMN "criado_em" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "obrigacoes_regulatorias_base" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo_empreendimento" TEXT NOT NULL,
    "uf" TEXT,
    "modulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fundamento_legal" TEXT,
    "periodicidade" TEXT NOT NULL,
    "tipo_documento_ref" TEXT,
    "criticidade" TEXT NOT NULL,
    "dias_alerta_antes" INTEGER[] DEFAULT ARRAY[90, 60, 30]::INTEGER[],
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obrigacoes_regulatorias_base_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "obrigacoes_regulatorias_base_codigo_key" ON "obrigacoes_regulatorias_base"("codigo");

-- CreateIndex
CREATE INDEX "obrigacoes_regulatorias_base_tipo_empreendimento_uf_ativo_idx" ON "obrigacoes_regulatorias_base"("tipo_empreendimento", "uf", "ativo");

-- CreateIndex
CREATE INDEX "obrigacoes_regulatorias_base_modulo_ativo_idx" ON "obrigacoes_regulatorias_base"("modulo", "ativo");

-- AddForeignKey
ALTER TABLE "treinamento_tipos" ADD CONSTRAINT "treinamento_tipos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinamento_execucoes" ADD CONSTRAINT "treinamento_execucoes_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "treinamento_tipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinamento_execucoes" ADD CONSTRAINT "treinamento_execucoes_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinamento_participantes" ADD CONSTRAINT "treinamento_participantes_execucao_id_fkey" FOREIGN KEY ("execucao_id") REFERENCES "treinamento_execucoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinamento_participantes" ADD CONSTRAINT "treinamento_participantes_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas_epi" ADD CONSTRAINT "entregas_epi_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas_epi" ADD CONSTRAINT "entregas_epi_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_lead" ADD CONSTRAINT "mensagens_lead_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads_whatsapp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "entregas_epi_tenant_emp_func_idx" RENAME TO "entregas_epi_tenant_id_empreendimento_id_funcionario_id_idx";

-- RenameIndex
ALTER INDEX "entregas_epi_tenant_vencimento_status_idx" RENAME TO "entregas_epi_tenant_id_data_vencimento_status_idx";

-- RenameIndex
ALTER INDEX "funcionarios_tenant_cargo_ativo_idx" RENAME TO "funcionarios_tenant_id_cargo_ativo_idx";

-- RenameIndex
ALTER INDEX "metas_residuos_anuais_tenant_id_empreendimento_id_ano_tipo_resi" RENAME TO "metas_residuos_anuais_tenant_id_empreendimento_id_ano_tipo__key";

-- RenameIndex
ALTER INDEX "treinamento_execucoes_tenant_emp_status_idx" RENAME TO "treinamento_execucoes_tenant_id_empreendimento_id_status_idx";

-- RenameIndex
ALTER INDEX "treinamento_execucoes_tenant_vencimento_idx" RENAME TO "treinamento_execucoes_tenant_id_data_vencimento_status_idx";

-- RenameIndex
ALTER INDEX "treinamento_participantes_execucao_funcionario_key" RENAME TO "treinamento_participantes_execucao_id_funcionario_id_key";

-- RenameIndex
ALTER INDEX "treinamento_participantes_funcionario_idx" RENAME TO "treinamento_participantes_funcionario_id_idx";

-- RenameIndex
ALTER INDEX "treinamento_tipos_tenant_ativo_idx" RENAME TO "treinamento_tipos_tenant_id_ativo_idx";

-- RenameIndex
ALTER INDEX "treinamento_tipos_tenant_nome_normativa_key" RENAME TO "treinamento_tipos_tenant_id_nome_normativa_key";
