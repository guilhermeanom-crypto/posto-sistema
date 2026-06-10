-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('SUPER_ADMIN', 'ADMIN_TENANT', 'COORDENADOR', 'ANALISTA', 'ANALISTA_CAMPO', 'EXECUTIVO', 'REPRESENTANTE_POSTO');

-- CreateEnum
CREATE TYPE "EsferaRegulatoria" AS ENUM ('FEDERAL', 'ESTADUAL', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "TipoOrgao" AS ENUM ('AMBIENTAL', 'SEGURANCA', 'COMERCIAL', 'SANITARIO', 'METROLOGIA', 'TRANSPORTE', 'TRIBUTARIO', 'OUTROS');

-- CreateEnum
CREATE TYPE "CategoriaProcesso" AS ENUM ('LICENCA', 'AUTORIZACAO', 'CERTIFICACAO', 'REGISTRO', 'CADASTRO', 'RENOVACAO', 'ADITAMENTO', 'CANCELAMENTO');

-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('LICENCA', 'ALVARA', 'CERTIFICADO', 'LAUDO', 'RELATORIO', 'ART_RRT', 'CONTRATO', 'DOCUMENTO_SOCIETARIO', 'COMPROVANTE', 'DECLARACAO', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusProcesso" AS ENUM ('EM_ELABORACAO', 'AGUARDANDO_DOCUMENTOS', 'PRONTO_PROTOCOLO', 'PROTOCOLADO', 'EM_ANALISE', 'EXIGENCIA_DOCUMENTAL', 'EM_VISTORIA', 'DEFERIDO', 'INDEFERIDO', 'EM_RECURSO', 'SUSPENSO', 'CANCELADO', 'VENCIDO', 'EM_RENOVACAO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('PENDENTE', 'ENVIADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'VENCIDO', 'A_RENOVAR', 'SUBSTITUIDO', 'DISPENSADO');

-- CreateEnum
CREATE TYPE "StatusVersaoDocumento" AS ENUM ('AGUARDANDO_UPLOAD', 'ENVIADA', 'EM_VALIDACAO', 'ATIVA', 'REJEITADA', 'SUBSTITUIDA', 'UPLOAD_FALHOU');

-- CreateEnum
CREATE TYPE "StatusCondicionante" AS ENUM ('PENDENTE', 'EM_CUMPRIMENTO', 'AGUARDANDO_EVIDENCIA', 'CUMPRIDA', 'VENCIDA', 'DISPENSADA');

-- CreateEnum
CREATE TYPE "PeriodicidadeCondicionante" AS ENUM ('UNICA', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'BIENAL', 'PERSONALIZADA');

-- CreateEnum
CREATE TYPE "TipoCondicionante" AS ENUM ('DOCUMENTAL', 'EXECUTIVA', 'MONITORAMENTO', 'FINANCEIRA', 'CORRETIVA');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'APROVADA', 'CONCLUIDA', 'CANCELADA', 'BLOQUEADA', 'ESCALONADA');

-- CreateEnum
CREATE TYPE "PrioridadeTarefa" AS ENUM ('CRITICA', 'ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "OrigemTarefa" AS ENUM ('MANUAL', 'REGRA_VENCIMENTO_DOC', 'REGRA_VENCIMENTO_PROC', 'REGRA_CONDICIONANTE', 'REGRA_REQUISITO_PENDENTE', 'WORKFLOW', 'ESCALAMENTO');

-- CreateEnum
CREATE TYPE "TipoEvidencia" AS ENUM ('DOCUMENTO', 'FOTO', 'TEXTO', 'LINK');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('VENCIMENTO_DOCUMENTO', 'VENCIMENTO_PROCESSO', 'PRAZO_CONDICIONANTE', 'TAREFA_SEM_INICIO', 'TAREFA_ATRASADA', 'DOCUMENTO_REJEITADO', 'NOVO_REQUISITO', 'TAREFA_ATRIBUIDA', 'COMPLIANCE_CRITICO', 'COMPLIANCE_ATENCAO', 'ESCALONAMENTO_TAREFA');

-- CreateEnum
CREATE TYPE "NivelAlerta" AS ENUM ('CRITICO', 'ALTO', 'MEDIO', 'INFORMATIVO');

-- CreateEnum
CREATE TYPE "StatusCompliance" AS ENUM ('REGULAR', 'ATENCAO', 'CRITICO', 'EMERGENCIA');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plano" TEXT NOT NULL DEFAULT 'standard',
    "limite_empreendimentos" INTEGER NOT NULL DEFAULT 100,
    "configuracoes" JSONB NOT NULL DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_acesso" TIMESTAMP(3),
    "tentativas_login_falhas" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" TIMESTAMP(3),
    "configuracoes" JSONB NOT NULL DEFAULT '{}',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "inativado_em" TIMESTAMP(3),
    "inativado_por_id" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes_refresh" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revogado_em" TIMESTAMP(3),
    "motivo_revogacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_refresh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_portal" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "solicitado_por_id" TEXT NOT NULL,
    "email_destinatario" TEXT NOT NULL,
    "nome_contato" TEXT,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_portal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "inscricao_estadual" TEXT,
    "inscricao_municipal" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empreendimentos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "cnpj" TEXT,
    "codigo_interno" TEXT,
    "bandeira" TEXT,
    "tipo" TEXT,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "responsavel_tecnico_nome" TEXT,
    "responsavel_tecnico_crea" TEXT,
    "responsavel_tecnico_email" TEXT,
    "contato_email" TEXT,
    "contato_telefone" TEXT,
    "atividades" TEXT[],
    "data_inicio_operacao" DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empreendimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empreendimento_acessos" (
    "usuario_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" TEXT,

    CONSTRAINT "empreendimento_acessos_pkey" PRIMARY KEY ("usuario_id","empreendimento_id")
);

-- CreateTable
CREATE TABLE "orgaos_reguladores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "esfera" "EsferaRegulatoria" NOT NULL,
    "tipo" "TipoOrgao" NOT NULL,
    "estado_uf" CHAR(2),
    "municipio" TEXT,
    "site" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orgaos_reguladores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_processo" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "orgao_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "CategoriaProcesso" NOT NULL,
    "requer_renovacao" BOOLEAN NOT NULL DEFAULT true,
    "periodo_validade_anos" INTEGER,
    "dias_antecedencia_renovacao" INTEGER NOT NULL DEFAULT 180,
    "dias_alerta" INTEGER[] DEFAULT ARRAY[90, 60, 30, 15, 7]::INTEGER[],
    "instrucoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fases_tipo_processo" (
    "id" TEXT NOT NULL,
    "tipo_processo_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "dias_estimados" INTEGER,
    "instrucoes" TEXT,

    CONSTRAINT "fases_tipo_processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "CategoriaDocumento" NOT NULL,
    "formatos_aceitos" TEXT[] DEFAULT ARRAY['pdf']::TEXT[],
    "tamanho_maximo_mb" INTEGER NOT NULL DEFAULT 20,
    "tem_validade" BOOLEAN NOT NULL DEFAULT true,
    "validade_media_meses" INTEGER,
    "exige_assinatura" BOOLEAN NOT NULL DEFAULT false,
    "instrucoes_obtencao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitos_tipo_processo" (
    "id" TEXT NOT NULL,
    "tipo_processo_id" TEXT NOT NULL,
    "tipo_documento_id" TEXT NOT NULL,
    "fase_tipo_processo_id" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "descricao_especifica" TEXT,
    "condicoes" JSONB,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "requisitos_tipo_processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "tipo_processo_id" TEXT NOT NULL,
    "orgao_id" TEXT NOT NULL,
    "status" "StatusProcesso" NOT NULL DEFAULT 'EM_ELABORACAO',
    "fase_atual_ordem" INTEGER NOT NULL DEFAULT 1,
    "numero_protocolo" TEXT,
    "numero_licenca" TEXT,
    "data_abertura" DATE,
    "data_protocolo" DATE,
    "data_decisao" DATE,
    "data_emissao" DATE,
    "data_vencimento" DATE,
    "data_inicio_renovacao" DATE,
    "responsavel_id" TEXT,
    "observacoes" TEXT,
    "metadados" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_fases_processo" (
    "id" TEXT NOT NULL,
    "processo_id" TEXT NOT NULL,
    "fase_tipo_processo_id" TEXT NOT NULL,
    "ordem_fase" INTEGER NOT NULL,
    "nome_fase" TEXT NOT NULL,
    "iniciou_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluiu_em" TIMESTAMP(3),
    "avancado_por_id" TEXT NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "historico_fases_processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitos_processo" (
    "id" TEXT NOT NULL,
    "processo_id" TEXT NOT NULL,
    "tipo_documento_id" TEXT NOT NULL,
    "requisito_tipo_id" TEXT,
    "fase_tipo_processo_id" TEXT,
    "documento_id" TEXT,
    "descricao" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "status" "StatusDocumento" NOT NULL DEFAULT 'PENDENTE',
    "dispensado_por_id" TEXT,
    "motivo_dispensa" TEXT,
    "dispensado_em" TIMESTAMP(3),
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisitos_processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "processo_id" TEXT,
    "condicionante_id" TEXT,
    "tipo_documento_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusDocumento" NOT NULL DEFAULT 'PENDENTE',
    "data_emissao" DATE,
    "data_validade" DATE,
    "orgao_emissor" TEXT,
    "versao_atual_id" TEXT,
    "total_versoes" INTEGER NOT NULL DEFAULT 0,
    "alerta_dias_antes" INTEGER[],
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_versoes" (
    "id" TEXT NOT NULL,
    "documento_id" TEXT NOT NULL,
    "numero_versao" INTEGER NOT NULL,
    "arquivo_chave_s3" TEXT NOT NULL,
    "arquivo_nome" TEXT NOT NULL,
    "arquivo_mime" TEXT NOT NULL,
    "arquivo_bytes" BIGINT NOT NULL,
    "hash_sha256" TEXT NOT NULL,
    "status" "StatusVersaoDocumento" NOT NULL DEFAULT 'AGUARDANDO_UPLOAD',
    "observacoes_envio" TEXT,
    "enviado_por_id" TEXT NOT NULL,
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validado_por_id" TEXT,
    "validado_em" TIMESTAMP(3),
    "motivo_rejeicao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_versoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condicionantes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "processo_id" TEXT,
    "descricao" TEXT NOT NULL,
    "numero_condicionante" TEXT,
    "tipo" "TipoCondicionante" NOT NULL,
    "status" "StatusCondicionante" NOT NULL DEFAULT 'PENDENTE',
    "periodicidade" "PeriodicidadeCondicionante" NOT NULL DEFAULT 'UNICA',
    "intervalo_dias" INTEGER,
    "prazo_cumprimento" DATE,
    "proximo_vencimento" DATE,
    "evidencia_exigida" TEXT,
    "documento_evidencia_id" TEXT,
    "responsavel_id" TEXT,
    "gerar_tarefa_auto" BOOLEAN NOT NULL DEFAULT true,
    "dias_alerta_antes" INTEGER[] DEFAULT ARRAY[30, 15, 7]::INTEGER[],
    "cumprida_em" TIMESTAMP(3),
    "dispensado_por_id" TEXT,
    "motivo_dispensa" TEXT,
    "dispensado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condicionantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclos_condicionante" (
    "id" TEXT NOT NULL,
    "condicionante_id" TEXT NOT NULL,
    "numero_ciclo" INTEGER NOT NULL,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fim" DATE NOT NULL,
    "status" "StatusCondicionante" NOT NULL DEFAULT 'PENDENTE',
    "documento_evidencia_id" TEXT,
    "observacoes" TEXT,
    "cumprido_em" TIMESTAMP(3),
    "cumprido_por_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ciclos_condicionante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "processo_id" TEXT,
    "condicionante_id" TEXT,
    "ciclo_condicionante_id" TEXT,
    "documento_id" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "prioridade" "PrioridadeTarefa" NOT NULL DEFAULT 'MEDIA',
    "origem" "OrigemTarefa" NOT NULL DEFAULT 'MANUAL',
    "regra_origem_id" TEXT,
    "responsavel_id" TEXT,
    "criador_id" TEXT NOT NULL,
    "data_vencimento" TIMESTAMP(3),
    "data_conclusao" TIMESTAMP(3),
    "data_escalonamento" TIMESTAMP(3),
    "escalado_para_id" TEXT,
    "observacoes_conclusao" TEXT,
    "metadados" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas_dependencias" (
    "tarefa_id" TEXT NOT NULL,
    "depende_de_id" TEXT NOT NULL,

    CONSTRAINT "tarefas_dependencias_pkey" PRIMARY KEY ("tarefa_id","depende_de_id")
);

-- CreateTable
CREATE TABLE "evidencias_tarefas" (
    "id" TEXT NOT NULL,
    "tarefa_id" TEXT NOT NULL,
    "tipo" "TipoEvidencia" NOT NULL,
    "descricao" TEXT,
    "documento_versao_id" TEXT,
    "arquivo_chave_s3" TEXT,
    "arquivo_nome" TEXT,
    "texto_livre" TEXT,
    "url" TEXT,
    "enviado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_automaticas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "gatilho" JSONB NOT NULL,
    "acao" TEXT NOT NULL,
    "parametros" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "escopo" TEXT NOT NULL DEFAULT 'global',
    "escopo_referencia_id" TEXT,
    "ordem_execucao" INTEGER NOT NULL DEFAULT 100,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_automaticas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT,
    "tipo" "TipoAlerta" NOT NULL,
    "nivel" "NivelAlerta" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "entidade_tipo" TEXT,
    "entidade_id" TEXT,
    "dados" JSONB,
    "email_enviado" BOOLEAN NOT NULL DEFAULT false,
    "email_enviado_em" TIMESTAMP(3),
    "wpp_enviado" BOOLEAN NOT NULL DEFAULT false,
    "wpp_enviado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_destinatarios" (
    "alerta_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "lido_em" TIMESTAMP(3),
    "canais" TEXT[],

    CONSTRAINT "alertas_destinatarios_pkey" PRIMARY KEY ("alerta_id","usuario_id")
);

-- CreateTable
CREATE TABLE "compliance_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empreendimento_id" TEXT NOT NULL,
    "indice_conformidade" DECIMAL(5,2) NOT NULL,
    "status_compliance" "StatusCompliance" NOT NULL,
    "documentos_validos" INTEGER NOT NULL,
    "documentos_total" INTEGER NOT NULL,
    "processos_regulares" INTEGER NOT NULL,
    "processos_total" INTEGER NOT NULL,
    "condicionantes_cumpridas" INTEGER NOT NULL,
    "condicionantes_ativas" INTEGER NOT NULL,
    "detalhes" JSONB,
    "calculado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "usuario_nome" TEXT,
    "usuario_email" TEXT,
    "usuario_perfil" TEXT,
    "acao" TEXT NOT NULL,
    "entidade_tipo" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "dados_antes" JSONB,
    "dados_depois" JSONB,
    "ip_origem" TEXT,
    "user_agent" TEXT,
    "contexto" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "usuarios_tenant_id_ativo_idx" ON "usuarios"("tenant_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_tenant_id_email_key" ON "usuarios"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_refresh_token_hash_key" ON "sessoes_refresh"("token_hash");

-- CreateIndex
CREATE INDEX "sessoes_refresh_usuario_id_idx" ON "sessoes_refresh"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_portal_token_key" ON "tokens_portal"("token");

-- CreateIndex
CREATE INDEX "tokens_portal_empreendimento_id_idx" ON "tokens_portal"("empreendimento_id");

-- CreateIndex
CREATE INDEX "empresas_tenant_id_ativo_idx" ON "empresas"("tenant_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_tenant_id_cnpj_key" ON "empresas"("tenant_id", "cnpj");

-- CreateIndex
CREATE INDEX "empreendimentos_tenant_id_ativo_idx" ON "empreendimentos"("tenant_id", "ativo");

-- CreateIndex
CREATE INDEX "empreendimentos_tenant_id_estado_cidade_idx" ON "empreendimentos"("tenant_id", "estado", "cidade");

-- CreateIndex
CREATE INDEX "orgaos_reguladores_tenant_id_esfera_ativo_idx" ON "orgaos_reguladores"("tenant_id", "esfera", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "orgaos_reguladores_tenant_id_sigla_estado_uf_municipio_key" ON "orgaos_reguladores"("tenant_id", "sigla", "estado_uf", "municipio");

-- CreateIndex
CREATE INDEX "tipos_processo_tenant_id_orgao_id_ativo_idx" ON "tipos_processo"("tenant_id", "orgao_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "fases_tipo_processo_tipo_processo_id_ordem_key" ON "fases_tipo_processo"("tipo_processo_id", "ordem");

-- CreateIndex
CREATE INDEX "tipos_documento_tenant_id_ativo_idx" ON "tipos_documento"("tenant_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_tenant_id_nome_key" ON "tipos_documento"("tenant_id", "nome");

-- CreateIndex
CREATE INDEX "requisitos_tipo_processo_tipo_processo_id_fase_tipo_process_idx" ON "requisitos_tipo_processo"("tipo_processo_id", "fase_tipo_processo_id");

-- CreateIndex
CREATE INDEX "processos_tenant_id_empreendimento_id_status_idx" ON "processos"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "processos_tenant_id_data_vencimento_status_idx" ON "processos"("tenant_id", "data_vencimento", "status");

-- CreateIndex
CREATE INDEX "processos_tenant_id_responsavel_id_status_idx" ON "processos"("tenant_id", "responsavel_id", "status");

-- CreateIndex
CREATE INDEX "historico_fases_processo_processo_id_ordem_fase_idx" ON "historico_fases_processo"("processo_id", "ordem_fase");

-- CreateIndex
CREATE INDEX "requisitos_processo_processo_id_status_idx" ON "requisitos_processo"("processo_id", "status");

-- CreateIndex
CREATE INDEX "requisitos_processo_processo_id_fase_tipo_processo_id_idx" ON "requisitos_processo"("processo_id", "fase_tipo_processo_id");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_versao_atual_id_key" ON "documentos"("versao_atual_id");

-- CreateIndex
CREATE INDEX "documentos_tenant_id_empreendimento_id_idx" ON "documentos"("tenant_id", "empreendimento_id");

-- CreateIndex
CREATE INDEX "documentos_tenant_id_data_validade_status_idx" ON "documentos"("tenant_id", "data_validade", "status");

-- CreateIndex
CREATE INDEX "documentos_tenant_id_processo_id_idx" ON "documentos"("tenant_id", "processo_id");

-- CreateIndex
CREATE INDEX "documento_versoes_documento_id_status_idx" ON "documento_versoes"("documento_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "documento_versoes_documento_id_numero_versao_key" ON "documento_versoes"("documento_id", "numero_versao");

-- CreateIndex
CREATE INDEX "condicionantes_tenant_id_empreendimento_id_status_idx" ON "condicionantes"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "condicionantes_tenant_id_status_proximo_vencimento_idx" ON "condicionantes"("tenant_id", "status", "proximo_vencimento");

-- CreateIndex
CREATE INDEX "condicionantes_processo_id_status_idx" ON "condicionantes"("processo_id", "status");

-- CreateIndex
CREATE INDEX "ciclos_condicionante_condicionante_id_status_idx" ON "ciclos_condicionante"("condicionante_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ciclos_condicionante_condicionante_id_numero_ciclo_key" ON "ciclos_condicionante"("condicionante_id", "numero_ciclo");

-- CreateIndex
CREATE INDEX "tarefas_tenant_id_responsavel_id_status_idx" ON "tarefas"("tenant_id", "responsavel_id", "status");

-- CreateIndex
CREATE INDEX "tarefas_tenant_id_empreendimento_id_status_idx" ON "tarefas"("tenant_id", "empreendimento_id", "status");

-- CreateIndex
CREATE INDEX "tarefas_tenant_id_data_vencimento_status_idx" ON "tarefas"("tenant_id", "data_vencimento", "status");

-- CreateIndex
CREATE INDEX "tarefas_tenant_id_prioridade_status_idx" ON "tarefas"("tenant_id", "prioridade", "status");

-- CreateIndex
CREATE INDEX "evidencias_tarefas_tarefa_id_idx" ON "evidencias_tarefas"("tarefa_id");

-- CreateIndex
CREATE INDEX "regras_automaticas_tenant_id_ativo_tipo_idx" ON "regras_automaticas"("tenant_id", "ativo", "tipo");

-- CreateIndex
CREATE INDEX "alertas_tenant_id_nivel_criado_em_idx" ON "alertas"("tenant_id", "nivel", "criado_em");

-- CreateIndex
CREATE INDEX "alertas_tenant_id_empreendimento_id_criado_em_idx" ON "alertas"("tenant_id", "empreendimento_id", "criado_em");

-- CreateIndex
CREATE INDEX "alertas_destinatarios_usuario_id_lido_idx" ON "alertas_destinatarios"("usuario_id", "lido");

-- CreateIndex
CREATE INDEX "compliance_snapshots_tenant_id_empreendimento_id_calculado__idx" ON "compliance_snapshots"("tenant_id", "empreendimento_id", "calculado_em" DESC);

-- CreateIndex
CREATE INDEX "compliance_snapshots_tenant_id_status_compliance_calculado__idx" ON "compliance_snapshots"("tenant_id", "status_compliance", "calculado_em" DESC);

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_entidade_tipo_entidade_id_criado_em_idx" ON "audit_log"("tenant_id", "entidade_tipo", "entidade_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_usuario_id_criado_em_idx" ON "audit_log"("tenant_id", "usuario_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "audit_log_criado_em_idx" ON "audit_log"("criado_em" DESC);

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_refresh" ADD CONSTRAINT "sessoes_refresh_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_portal" ADD CONSTRAINT "tokens_portal_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_portal" ADD CONSTRAINT "tokens_portal_solicitado_por_id_fkey" FOREIGN KEY ("solicitado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empreendimentos" ADD CONSTRAINT "empreendimentos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empreendimento_acessos" ADD CONSTRAINT "empreendimento_acessos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empreendimento_acessos" ADD CONSTRAINT "empreendimento_acessos_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orgaos_reguladores" ADD CONSTRAINT "orgaos_reguladores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_processo" ADD CONSTRAINT "tipos_processo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_processo" ADD CONSTRAINT "tipos_processo_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgaos_reguladores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fases_tipo_processo" ADD CONSTRAINT "fases_tipo_processo_tipo_processo_id_fkey" FOREIGN KEY ("tipo_processo_id") REFERENCES "tipos_processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_documento" ADD CONSTRAINT "tipos_documento_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_tipo_processo" ADD CONSTRAINT "requisitos_tipo_processo_tipo_processo_id_fkey" FOREIGN KEY ("tipo_processo_id") REFERENCES "tipos_processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_tipo_processo" ADD CONSTRAINT "requisitos_tipo_processo_tipo_documento_id_fkey" FOREIGN KEY ("tipo_documento_id") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_tipo_processo" ADD CONSTRAINT "requisitos_tipo_processo_fase_tipo_processo_id_fkey" FOREIGN KEY ("fase_tipo_processo_id") REFERENCES "fases_tipo_processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_tipo_processo_id_fkey" FOREIGN KEY ("tipo_processo_id") REFERENCES "tipos_processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgaos_reguladores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_fases_processo" ADD CONSTRAINT "historico_fases_processo_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_fases_processo" ADD CONSTRAINT "historico_fases_processo_fase_tipo_processo_id_fkey" FOREIGN KEY ("fase_tipo_processo_id") REFERENCES "fases_tipo_processo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_fases_processo" ADD CONSTRAINT "historico_fases_processo_avancado_por_id_fkey" FOREIGN KEY ("avancado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_processo" ADD CONSTRAINT "requisitos_processo_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_processo" ADD CONSTRAINT "requisitos_processo_tipo_documento_id_fkey" FOREIGN KEY ("tipo_documento_id") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_processo" ADD CONSTRAINT "requisitos_processo_fase_tipo_processo_id_fkey" FOREIGN KEY ("fase_tipo_processo_id") REFERENCES "fases_tipo_processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_processo" ADD CONSTRAINT "requisitos_processo_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_processo" ADD CONSTRAINT "requisitos_processo_dispensado_por_id_fkey" FOREIGN KEY ("dispensado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_condicionante_id_fkey" FOREIGN KEY ("condicionante_id") REFERENCES "condicionantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tipo_documento_id_fkey" FOREIGN KEY ("tipo_documento_id") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_versao_atual_id_fkey" FOREIGN KEY ("versao_atual_id") REFERENCES "documento_versoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_versoes" ADD CONSTRAINT "documento_versoes_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_versoes" ADD CONSTRAINT "documento_versoes_enviado_por_id_fkey" FOREIGN KEY ("enviado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_versoes" ADD CONSTRAINT "documento_versoes_validado_por_id_fkey" FOREIGN KEY ("validado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_documento_evidencia_id_fkey" FOREIGN KEY ("documento_evidencia_id") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_dispensado_por_id_fkey" FOREIGN KEY ("dispensado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclos_condicionante" ADD CONSTRAINT "ciclos_condicionante_condicionante_id_fkey" FOREIGN KEY ("condicionante_id") REFERENCES "condicionantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclos_condicionante" ADD CONSTRAINT "ciclos_condicionante_documento_evidencia_id_fkey" FOREIGN KEY ("documento_evidencia_id") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclos_condicionante" ADD CONSTRAINT "ciclos_condicionante_cumprido_por_id_fkey" FOREIGN KEY ("cumprido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_condicionante_id_fkey" FOREIGN KEY ("condicionante_id") REFERENCES "condicionantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_ciclo_condicionante_id_fkey" FOREIGN KEY ("ciclo_condicionante_id") REFERENCES "ciclos_condicionante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_criador_id_fkey" FOREIGN KEY ("criador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_escalado_para_id_fkey" FOREIGN KEY ("escalado_para_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_dependencias" ADD CONSTRAINT "tarefas_dependencias_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_dependencias" ADD CONSTRAINT "tarefas_dependencias_depende_de_id_fkey" FOREIGN KEY ("depende_de_id") REFERENCES "tarefas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_tarefas" ADD CONSTRAINT "evidencias_tarefas_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_tarefas" ADD CONSTRAINT "evidencias_tarefas_documento_versao_id_fkey" FOREIGN KEY ("documento_versao_id") REFERENCES "documento_versoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_automaticas" ADD CONSTRAINT "regras_automaticas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_destinatarios" ADD CONSTRAINT "alertas_destinatarios_alerta_id_fkey" FOREIGN KEY ("alerta_id") REFERENCES "alertas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_destinatarios" ADD CONSTRAINT "alertas_destinatarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_snapshots" ADD CONSTRAINT "compliance_snapshots_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

