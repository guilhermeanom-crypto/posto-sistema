-- CreateTable
CREATE TABLE "scores_risco" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "nivel" TEXT NOT NULL,
    "fatores" JSONB NOT NULL,
    "recomendacoes" TEXT[],
    "calculado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scores_risco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scores_risco_tenant_id_empreendimento_id_idx" ON "scores_risco"("tenant_id", "empreendimento_id");

-- CreateIndex
CREATE INDEX "scores_risco_tenant_id_nivel_idx" ON "scores_risco"("tenant_id", "nivel");

-- CreateIndex
CREATE UNIQUE INDEX "scores_risco_empreendimento_id_orgao_key" ON "scores_risco"("empreendimento_id", "orgao");

-- AddForeignKey
ALTER TABLE "scores_risco" ADD CONSTRAINT "scores_risco_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
