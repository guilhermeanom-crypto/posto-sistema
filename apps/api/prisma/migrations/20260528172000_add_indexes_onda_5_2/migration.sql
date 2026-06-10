-- Onda 5.2: indices nao destrutivos para consultas operacionais e auditoria.

CREATE INDEX IF NOT EXISTS "empreendimento_acessos_empreendimento_id_idx"
  ON "empreendimento_acessos" ("empreendimento_id");

CREATE INDEX IF NOT EXISTS "tarefas_dependencias_depende_de_id_idx"
  ON "tarefas_dependencias" ("depende_de_id");

CREATE INDEX IF NOT EXISTS "regras_automaticas_tenant_id_ativo_ordem_execucao_idx"
  ON "regras_automaticas" ("tenant_id", "ativo", "ordem_execucao");

CREATE INDEX IF NOT EXISTS "audit_log_tenant_id_criado_em_idx"
  ON "audit_log" ("tenant_id", "criado_em" DESC);

CREATE INDEX IF NOT EXISTS "audit_log_tenant_id_entidade_tipo_idx"
  ON "audit_log" ("tenant_id", "entidade_tipo");

CREATE INDEX IF NOT EXISTS "mtrs_tenant_id_status_data_emissao_idx"
  ON "mtrs" ("tenant_id", "status", "data_emissao");

CREATE INDEX IF NOT EXISTS "mtrs_transportadora_id_status_idx"
  ON "mtrs" ("transportadora_id", "status");

CREATE INDEX IF NOT EXISTS "laudos_agua_resultado_data_campanha_idx"
  ON "laudos_agua" ("resultado", "data_campanha");
