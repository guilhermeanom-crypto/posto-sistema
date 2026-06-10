# 90. Relatorio da Onda 5.4 (fase 1) — Unificacao de Tipos

## 1. Objetivo

Eliminar a duplicacao de tipos entre frontend e backend criando fonte unica em `packages/types`, comecando pelos dominios do fluxo comercial-operacional (Contrato, OS, Entregavel, Financeiro).

## 2. Decisao de arquitetura

O backend usa `Date` nos tipos internos (camada de service), mas o JSON que trafega na resposta da API serializa datas como `string` ISO. Portanto:

- A **fonte unica do contrato de API** (wire format, datas como `string`) fica em `packages/types/src/api.ts`.
- O **frontend importa destes tipos** — elimina as redefinicoes locais.
- O **backend mantem seus tipos internos com `Date`** (`*.types.ts` dos modulos) — corretos para a camada de servico, convertidos para string na serializacao Fastify.

Isso resolve o maior risco apontado na auditoria (frontend redefinindo tipos e divergindo silenciosamente) sem reescrever a camada interna do backend.

## 3. Entregas

### packages/types
- Novo arquivo `packages/types/src/api.ts` com DTOs wire:
  - `ApiPagination`
  - Comercial: `StatusContrato`, `ContratoItemSnapshot`, `ContratoResumo`, `ContratoDetalhe`, `ContratoKpis`
  - Operacao: `StatusOrdemServico`, `PrioridadeOrdemServico`, `TipoOrdemServico`, `OrdemServicoResumo`, `OrdemServicoDetalhe`, `OrdemServicoKpis`
  - Operacao: `StatusEntregavel`, `TipoEntregavel`, `EntregavelResumo`, `EntregavelDetalhe`, `EntregavelKpis`
  - Financeiro: `FinanceiroResumo`
- `index.ts` re-exporta `./api.js`.
- Pacote rebuildado (`pnpm -F @repo/types build` → `dist/api.js` + `.d.ts`).

### Frontend (5 paginas migradas)
- `apps/web/src/app/(app)/contratos/page.tsx`
- `apps/web/src/app/(app)/ordens-servico/page.tsx`
- `apps/web/src/app/equipe/(equipe)/os/page.tsx`
- `apps/web/src/app/(app)/entregaveis/page.tsx`
- `apps/web/src/app/(app)/financeiro/page.tsx`

Cada uma agora faz `import type { ... } from '@repo/types'` em vez de redefinir interfaces. Onde havia aliases curtos muito usados em label-maps (`StatusOS`, `TipoOS`), criou-se `type StatusOS = StatusOrdemServico` local — zero churn no corpo do JSX.

## 4. Validacao

| Verificacao | Resultado |
|---|---|
| `pnpm -F @repo/types build` | ✅ dist gerado |
| `pnpm typecheck` apps/web | ✅ Limpo |
| `pnpm typecheck` apps/api | ✅ Limpo |
| `pnpm test` (suite completa) | ✅ 69/69 verdes |
| Redefinicoes locais dos dominios do fluxo | ✅ Zero |

## 5. Escopo concluido vs pendente

### Concluido (fase 1)
Dominios do fluxo comercial-operacional — os mais recentes e criticos, criados nas Ondas 3.9-3.12: Contrato, OS, Entregavel, Financeiro. 5 paginas com fonte unica de tipo.

### Pendente (fase 2 — futura)
Dominios mais antigos ainda com tipos locais no frontend: `Empreendimento` (redefinido em ~3 paginas), documentos, processos, condicionantes, SST, monitoramento, etc. Estimativa: ~250 tipos locais restantes.

Esses serao migrados incrementalmente, 1 dominio por vez, com o mesmo padrao (DTO wire em `packages/types`, frontend importa, typecheck como rede de seguranca). Nao ha urgencia — sao telas estaveis e ja funcionais.

## 6. Estado da Onda 5

```
✅ 5.1 Seguranca       — COMPLETA
✅ 5.2 Banco + Worker  — COMPLETA
✅ 5.3 Limpeza         — COMPLETA
🟡 5.4 Tipos           — FASE 1 COMPLETA (fluxo comercial-operacional); fase 2 (dominios antigos) pendente
⏳ 5.5 Service+testes  — pendente
```

## 7. Proximo passo recomendado

Onda 5.5 — extrair camada de service dos 15 modulos routes-only e ampliar cobertura de testes dos modulos criticos (documentos, processos, condicionantes, compliance, empreendimentos, usuarios). E a ultima frente de estabilizacao.
