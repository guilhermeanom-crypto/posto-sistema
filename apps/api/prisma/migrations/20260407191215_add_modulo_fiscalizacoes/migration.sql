-- CreateEnum
CREATE TYPE "StatusAutoInfracao" AS ENUM ('RECEBIDO', 'EM_DEFESA', 'AGUARDANDO_JULGAMENTO', 'JULGADO_FAVORAVEL', 'JULGADO_DESFAVORAVEL', 'EM_RECURSO', 'ENCERRADO', 'PAGO');

-- CreateEnum
CREATE TYPE "InstanciaRecurso" AS ENUM ('PRIMEIRA', 'SEGUNDA', 'TERCEIRA', 'JUDICIAL');

-- CreateTable
CREATE TABLE "autos_infracao" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "numero_auto" TEXT NOT NULL,
    "data_lavratura" DATE NOT NULL,
    "data_recebimento" DATE,
    "artigo" TEXT,
    "descricao" TEXT NOT NULL,
    "valor_multa" DECIMAL(12,2),
    "prazo_defesa" DATE NOT NULL,
    "status" "StatusAutoInfracao" NOT NULL DEFAULT 'RECEBIDO',
    "chave_s3" TEXT,
    "nome_arquivo" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autos_infracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos_administrativos" (
    "id" TEXT NOT NULL,
    "auto_id" TEXT NOT NULL,
    "instancia" "InstanciaRecurso" NOT NULL,
    "data_protocolo" DATE NOT NULL,
    "prazo_resposta" DATE,
    "numero_protocolo" TEXT,
    "peticao_s3" TEXT,
    "resultado_s3" TEXT,
    "resultado" TEXT,
    "data_julgamento" DATE,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recursos_administrativos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "autos_infracao_tenant_id_empreendimento_id_status_idx" ON "autos_infracao"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "autos_infracao_tenant_id_prazo_defesa_status_idx" ON "autos_infracao"("tenant_id", "prazo_defesa", "status");

-- CreateIndex
CREATE INDEX "recursos_administrativos_auto_id_idx" ON "recursos_administrativos"("auto_id");

-- AddForeignKey
ALTER TABLE "autos_infracao" ADD CONSTRAINT "autos_infracao_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos_administrativos" ADD CONSTRAINT "recursos_administrativos_auto_id_fkey" FOREIGN KEY ("auto_id") REFERENCES "autos_infracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
