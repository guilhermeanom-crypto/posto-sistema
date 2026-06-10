-- CreateTable
CREATE TABLE "publicacoes_do" (
    "id" TEXT NOT NULL,
    "fonte" TEXT NOT NULL,
    "data_publicacao" DATE NOT NULL,
    "secao" TEXT,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT,
    "url" TEXT,
    "keywords_match" TEXT[],
    "relevante" BOOLEAN NOT NULL DEFAULT false,
    "classificacao" TEXT,
    "impacto" TEXT,
    "resumo_ia" TEXT,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publicacoes_do_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publicacoes_do_data_publicacao_relevante_idx" ON "publicacoes_do"("data_publicacao", "relevante");

-- CreateIndex
CREATE INDEX "publicacoes_do_relevante_notificado_idx" ON "publicacoes_do"("relevante", "notificado");

-- CreateIndex
CREATE UNIQUE INDEX "publicacoes_do_fonte_data_publicacao_url_key" ON "publicacoes_do"("fonte", "data_publicacao", "url");
