ALTER TABLE "handoffs_comerciais"
ADD COLUMN "observacoes_planejamento" TEXT,
ADD COLUMN "prioridade_operacional" TEXT,
ADD COLUMN "necessidade_documentos" BOOLEAN,
ADD COLUMN "necessidade_visita" BOOLEAN,
ADD COLUMN "necessidade_terceiro" BOOLEAN;
