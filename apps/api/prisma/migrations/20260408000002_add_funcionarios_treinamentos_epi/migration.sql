-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 1: Funcionários completo + Treinamentos SST + EPI
-- ─────────────────────────────────────────────────────────────────────────────

-- ALTER TABLE funcionarios — campos novos
ALTER TABLE "funcionarios"
  ADD COLUMN IF NOT EXISTS "rg"               TEXT,
  ADD COLUMN IF NOT EXISTS "data_nascimento"  DATE,
  ADD COLUMN IF NOT EXISTS "setor"            TEXT,
  ADD COLUMN IF NOT EXISTS "vinculo"          TEXT NOT NULL DEFAULT 'CLT',
  ADD COLUMN IF NOT EXISTS "email"            TEXT,
  ADD COLUMN IF NOT EXISTS "telefone"         TEXT,
  ADD COLUMN IF NOT EXISTS "motivo_demissao"  TEXT,
  ADD COLUMN IF NOT EXISTS "observacoes"      TEXT;

-- Índice adicional
CREATE INDEX IF NOT EXISTS "funcionarios_tenant_cargo_ativo_idx"
  ON "funcionarios"("tenant_id", "cargo", "ativo");

-- ─── Treinamentos ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "treinamento_tipos" (
  "id"                       TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenant_id"                TEXT NOT NULL,
  "nome"                     TEXT NOT NULL,
  "normativa"                TEXT NOT NULL,
  "carga_horaria"            INTEGER NOT NULL,
  "periodicidade_meses"      INTEGER NOT NULL,
  "obrigatorio_para_cargos"  TEXT[] NOT NULL DEFAULT '{}',
  "conteudo_programatico"    TEXT[] NOT NULL DEFAULT '{}',
  "ativo"                    BOOLEAN NOT NULL DEFAULT true,
  "criado_em"                TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fk_treinamento_tipos_tenant"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "treinamento_tipos_tenant_nome_normativa_key"
  ON "treinamento_tipos"("tenant_id", "nome", "normativa");

CREATE INDEX IF NOT EXISTS "treinamento_tipos_tenant_ativo_idx"
  ON "treinamento_tipos"("tenant_id", "ativo");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "treinamento_execucoes" (
  "id"                        TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenant_id"                 TEXT NOT NULL,
  "empreendimento_id"         TEXT NOT NULL,
  "tipo_id"                   TEXT NOT NULL,
  "instrutor"                 TEXT,
  "carga_horaria_realizada"   INTEGER,
  "data_realizacao"           DATE NOT NULL,
  "data_vencimento"           DATE,
  "status"                    TEXT NOT NULL DEFAULT 'REALIZADO',
  "local"                     TEXT,
  "certificado_chave_s3"      TEXT,
  "certificado_nome_arquivo"  TEXT,
  "observacoes"               TEXT,
  "criado_em"                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  "atualizado_em"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fk_treinamento_execucoes_tipo"
    FOREIGN KEY ("tipo_id") REFERENCES "treinamento_tipos"("id"),
  CONSTRAINT "fk_treinamento_execucoes_empreendimento"
    FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id")
);

CREATE INDEX IF NOT EXISTS "treinamento_execucoes_tenant_emp_status_idx"
  ON "treinamento_execucoes"("tenant_id", "empreendimento_id", "status");

CREATE INDEX IF NOT EXISTS "treinamento_execucoes_tenant_vencimento_idx"
  ON "treinamento_execucoes"("tenant_id", "data_vencimento", "status");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "treinamento_participantes" (
  "id"              TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "execucao_id"     TEXT NOT NULL,
  "funcionario_id"  TEXT NOT NULL,
  "presenca"        BOOLEAN NOT NULL DEFAULT true,
  "aprovado"        BOOLEAN NOT NULL DEFAULT true,
  "certificado_url" TEXT,
  "criado_em"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fk_treinamento_participantes_execucao"
    FOREIGN KEY ("execucao_id") REFERENCES "treinamento_execucoes"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_treinamento_participantes_funcionario"
    FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "treinamento_participantes_execucao_funcionario_key"
  ON "treinamento_participantes"("execucao_id", "funcionario_id");

CREATE INDEX IF NOT EXISTS "treinamento_participantes_funcionario_idx"
  ON "treinamento_participantes"("funcionario_id");

-- ─── EPI ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "entregas_epi" (
  "id"                  TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenant_id"           TEXT NOT NULL,
  "empreendimento_id"   TEXT NOT NULL,
  "funcionario_id"      TEXT NOT NULL,
  "tipo_epi"            TEXT NOT NULL,
  "ca"                  TEXT,
  "quantidade"          INTEGER NOT NULL DEFAULT 1,
  "data_entrega"        DATE NOT NULL,
  "data_vencimento"     DATE,
  "status"              TEXT NOT NULL DEFAULT 'VIGENTE',
  "assinatura_chave_s3" TEXT,
  "observacoes"         TEXT,
  "criado_em"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "fk_entregas_epi_funcionario"
    FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id"),
  CONSTRAINT "fk_entregas_epi_empreendimento"
    FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id")
);

CREATE INDEX IF NOT EXISTS "entregas_epi_tenant_emp_func_idx"
  ON "entregas_epi"("tenant_id", "empreendimento_id", "funcionario_id");

CREATE INDEX IF NOT EXISTS "entregas_epi_tenant_vencimento_status_idx"
  ON "entregas_epi"("tenant_id", "data_vencimento", "status");
