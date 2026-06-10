-- CreateTable
CREATE TABLE "contatos_whatsapp" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT,
    "usuario_id" TEXT,
    "numero" TEXT NOT NULL,
    "nome" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contatos_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_whatsapp" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "direcao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'TEXTO',
    "conteudo" TEXT NOT NULL,
    "erro" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contatos_whatsapp_tenant_id_ativo_idx" ON "contatos_whatsapp"("tenant_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "contatos_whatsapp_tenant_id_numero_key" ON "contatos_whatsapp"("tenant_id", "numero");

-- CreateIndex
CREATE INDEX "mensagens_whatsapp_tenant_id_numero_criado_em_idx" ON "mensagens_whatsapp"("tenant_id", "numero", "criado_em");

-- CreateIndex
CREATE INDEX "mensagens_whatsapp_tenant_id_direcao_criado_em_idx" ON "mensagens_whatsapp"("tenant_id", "direcao", "criado_em");

-- AddForeignKey
ALTER TABLE "contatos_whatsapp" ADD CONSTRAINT "contatos_whatsapp_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contatos_whatsapp" ADD CONSTRAINT "contatos_whatsapp_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_whatsapp" ADD CONSTRAINT "mensagens_whatsapp_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
