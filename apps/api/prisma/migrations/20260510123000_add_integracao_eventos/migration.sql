-- CreateTable: integracao_eventos
CREATE TABLE "integracao_eventos" (
    "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"          UUID NOT NULL,
    "source_system"      TEXT NOT NULL,
    "event_name"         TEXT NOT NULL,
    "idempotency_key"    TEXT NOT NULL,
    "payload_json"       JSONB NOT NULL,
    "status"             TEXT NOT NULL DEFAULT 'received',
    "processed_at"       TIMESTAMP(3),
    "error_message"      TEXT,
    "empresa_id"         UUID,
    "empreendimento_id"  UUID,
    "tarefa_id"          UUID,
    "criado_em"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "integracao_eventos_pkey" PRIMARY KEY ("id")
);

-- Unique / Indexes
CREATE UNIQUE INDEX "integracao_eventos_tenant_id_source_system_idempotency_key_key"
    ON "integracao_eventos"("tenant_id", "source_system", "idempotency_key");

CREATE INDEX "integracao_eventos_tenant_id_status_criado_em_idx"
    ON "integracao_eventos"("tenant_id", "status", "criado_em");

CREATE INDEX "integracao_eventos_source_system_event_name_criado_em_idx"
    ON "integracao_eventos"("source_system", "event_name", "criado_em");
