-- AlterTable
ALTER TABLE "autos_infracao" ADD COLUMN     "analisado_em" TIMESTAMP(3),
ADD COLUMN     "analise_ia" JSONB;

-- AlterTable
ALTER TABLE "licencas_ambientais" ADD COLUMN     "analisado_em" TIMESTAMP(3),
ADD COLUMN     "analise_ia" JSONB;

-- CreateTable
CREATE TABLE "defesas_tecnicas" (
    "id" TEXT NOT NULL,
    "auto_id" TEXT NOT NULL,
    "rascunho_ia" TEXT NOT NULL,
    "revisao_humana" TEXT,
    "chave_s3_final" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "gerado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defesas_tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "defesas_tecnicas_auto_id_idx" ON "defesas_tecnicas"("auto_id");

-- AddForeignKey
ALTER TABLE "defesas_tecnicas" ADD CONSTRAINT "defesas_tecnicas_auto_id_fkey" FOREIGN KEY ("auto_id") REFERENCES "autos_infracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
