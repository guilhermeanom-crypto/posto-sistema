-- CreateTable: leads_whatsapp
CREATE TABLE "leads_whatsapp" (
    "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero"            TEXT NOT NULL,
    "nome"              TEXT,
    "empresa"           TEXT,
    "quantidade_postos" INTEGER,
    "desafios"          TEXT,
    "status"            TEXT NOT NULL DEFAULT 'NOVO',
    "notas"             TEXT,
    "criado_em"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leads_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable: mensagens_lead
CREATE TABLE "mensagens_lead" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id"    UUID NOT NULL,
    "direcao"    TEXT NOT NULL,
    "conteudo"   TEXT NOT NULL,
    "criado_em"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mensagens_lead_pkey" PRIMARY KEY ("id")
);

-- Unique / Indexes
CREATE UNIQUE INDEX "leads_whatsapp_numero_key" ON "leads_whatsapp"("numero");
CREATE INDEX "leads_whatsapp_status_criado_em_idx" ON "leads_whatsapp"("status", "criado_em");
CREATE INDEX "mensagens_lead_lead_id_criado_em_idx" ON "mensagens_lead"("lead_id", "criado_em");

-- AddForeignKey
ALTER TABLE "mensagens_lead" ADD CONSTRAINT "mensagens_lead_lead_id_fkey"
    FOREIGN KEY ("lead_id") REFERENCES "leads_whatsapp"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
