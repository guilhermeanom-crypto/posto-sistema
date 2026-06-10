-- DropForeignKey
ALTER TABLE "defesas_tecnicas" DROP CONSTRAINT "defesas_tecnicas_auto_id_fkey";

-- DropForeignKey
ALTER TABLE "laudos_agua" DROP CONSTRAINT "laudos_agua_poco_id_fkey";

-- DropForeignKey
ALTER TABLE "recursos_administrativos" DROP CONSTRAINT "recursos_administrativos_auto_id_fkey";

-- DropForeignKey
ALTER TABLE "testes_estanqueidade" DROP CONSTRAINT "testes_estanqueidade_tanque_id_fkey";

-- CreateIndex
CREATE INDEX "sessoes_refresh_expires_at_idx" ON "sessoes_refresh"("expires_at");

-- AddForeignKey
ALTER TABLE "testes_estanqueidade" ADD CONSTRAINT "testes_estanqueidade_tanque_id_fkey" FOREIGN KEY ("tanque_id") REFERENCES "tanques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laudos_agua" ADD CONSTRAINT "laudos_agua_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "pocos_artesianos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos_administrativos" ADD CONSTRAINT "recursos_administrativos_auto_id_fkey" FOREIGN KEY ("auto_id") REFERENCES "autos_infracao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defesas_tecnicas" ADD CONSTRAINT "defesas_tecnicas_auto_id_fkey" FOREIGN KEY ("auto_id") REFERENCES "autos_infracao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

