-- Migration: add_checklists
-- Phase 4a: Operational Checklists

CREATE TABLE "checklist_templates" (
  "id"            TEXT NOT NULL,
  "tenant_id"     TEXT NOT NULL,
  "nome"          TEXT NOT NULL,
  "descricao"     TEXT,
  "modulo"        TEXT NOT NULL,
  "periodicidade" TEXT NOT NULL,
  "ativo"         BOOLEAN NOT NULL DEFAULT true,
  "criado_em"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "checklist_itens" (
  "id"          TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "ordem"       INTEGER NOT NULL,
  "descricao"   TEXT NOT NULL,
  "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
  "categoria"   TEXT,

  CONSTRAINT "checklist_itens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "checklist_execucoes" (
  "id"                TEXT NOT NULL,
  "template_id"       TEXT NOT NULL,
  "tenant_id"         TEXT NOT NULL,
  "empreendimento_id" TEXT NOT NULL,
  "executado_por_id"  TEXT NOT NULL,
  "status"            TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
  "iniciada_em"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finalizada_em"     TIMESTAMP(3),
  "observacoes"       TEXT,

  CONSTRAINT "checklist_execucoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "checklist_respostas" (
  "id"          TEXT NOT NULL,
  "execucao_id" TEXT NOT NULL,
  "item_id"     TEXT NOT NULL,
  "status"      TEXT NOT NULL,
  "observacao"  TEXT,

  CONSTRAINT "checklist_respostas_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "checklist_templates_tenant_id_modulo_ativo_idx"
  ON "checklist_templates"("tenant_id", "modulo", "ativo");

CREATE INDEX "checklist_itens_template_id_ordem_idx"
  ON "checklist_itens"("template_id", "ordem");

CREATE INDEX "checklist_execucoes_tenant_id_empreendimento_id_status_idx"
  ON "checklist_execucoes"("tenant_id", "empreendimento_id", "status");

CREATE INDEX "checklist_execucoes_tenant_id_template_id_iniciada_em_idx"
  ON "checklist_execucoes"("tenant_id", "template_id", "iniciada_em");

CREATE INDEX "checklist_respostas_execucao_id_idx"
  ON "checklist_respostas"("execucao_id");

CREATE UNIQUE INDEX "checklist_respostas_execucao_id_item_id_key"
  ON "checklist_respostas"("execucao_id", "item_id");

-- Foreign Keys
ALTER TABLE "checklist_templates"
  ADD CONSTRAINT "checklist_templates_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checklist_itens"
  ADD CONSTRAINT "checklist_itens_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checklist_execucoes"
  ADD CONSTRAINT "checklist_execucoes_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checklist_execucoes"
  ADD CONSTRAINT "checklist_execucoes_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checklist_execucoes"
  ADD CONSTRAINT "checklist_execucoes_empreendimento_id_fkey"
  FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checklist_execucoes"
  ADD CONSTRAINT "checklist_execucoes_executado_por_id_fkey"
  FOREIGN KEY ("executado_por_id") REFERENCES "usuarios"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checklist_respostas"
  ADD CONSTRAINT "checklist_respostas_execucao_id_fkey"
  FOREIGN KEY ("execucao_id") REFERENCES "checklist_execucoes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checklist_respostas"
  ADD CONSTRAINT "checklist_respostas_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "checklist_itens"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
