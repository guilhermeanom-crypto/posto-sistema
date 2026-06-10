# 14_RELATORIO_ONDA_2_6_RECONCILIACAO_CATALOGO_31_47

## 1. Resumo da Auditoria

Esta etapa realizou o mapeamento detalhado entre o catálogo de serviços atualmente implementado no banco de dados oficial (via Seed) e o catálogo legado identificado na auditoria da pasta `INTERFACE`.

**Status Atual:**
- **Banco de Dados (Oficial):** 31 serviços cadastrados.
- **Catálogo INTERFACE (Auditado):** 47 serviços (referentes às seções de Licenciamento, Outorga e Estudos).
- **Catálogo INTERFACE (Total):** 77 serviços (incluindo Fauna, Flora, Monitoramento, Geoprocessamento e Gestão).

### Onde está a discrepância?
A auditoria revelou que os **31 serviços** no banco oficial não são um subconjunto direto dos 47 serviços base. 
- **27 serviços** são extensões específicas para o produto de **Postos de Combustíveis** (`posto-extension`), contendo itens de ANP, SST, Urbanismo e Logística de Resíduos perigosos.
- **Apenas 4 serviços** foram efetivamente migrados do catálogo base da `INTERFACE`.

Portanto, **44 serviços base** (MCE, EAS, LP/LI/LO, Renovação, Outorgas diversas, etc.) estão ausentes no sistema oficial, o que representa um risco crítico para a próxima fase (Diagnóstico CNAE).

---

## 2. Matriz de Reconciliação (Subset 47)

Esta tabela mapeia os 47 serviços prioritários identificados na auditoria inicial da INTERFACE contra o que existe no banco hoje.

| Categoria | ID Legado | Nome do Serviço | Status no Sistema Oficial | Observação |
|---|---|---|---|---|
| Licenciamento | LIC-001 | Memorial de Caracterização (MCE) | 🔴 Faltante | Base para enquadramento técnico. |
| Licenciamento | LIC-002 | Estudo Ambiental Simplificado (EAS) | 🔴 Faltante | Necessário para novos empreendimentos. |
| Licenciamento | LIC-003 | Relatório Ambiental Simplificado (RAS) | 🔴 Faltante | - |
| Licenciamento | LIC-004 | Relatório de Controle Ambiental (RCA) | 🔴 Faltante | - |
| Licenciamento | LIC-005 | Estudo de Impacto Ambiental (EIA) | 🔴 Faltante | Complexidade máxima. |
| Licenciamento | LIC-006 | Relatório de Impacto Ambiental (RIMA) | 🔴 Faltante | - |
| Licenciamento | LIC-007 | Relatório Ambiental Preliminar (RAP) | 🔴 Faltante | - |
| Licenciamento | LIC-008 | Plano de Controle Ambiental (PCA) | 🔴 Faltante | - |
| Licenciamento | LIC-009 | Plano de Recuperação Degradada (PRAD) | 🔴 Faltante | - |
| Licenciamento | LIC-010 | Atendimento a Condicionantes (RAC) | 🔴 Faltante | Operacional crítico. |
| Licenciamento | LIC-011 | Plano de Gerenciamento de Resíduos | ✅ Migrado | Existente no Seed oficial. |
| Licenciamento | LIC-012 | Viabilidade Ambiental (EVM) | 🔴 Faltante | - |
| Licenciamento | LIC-013 | Cadastro CTF IBAMA | 🔴 Faltante | - |
| Licenciamento | LIC-014 | Elaboração/Protocolo LP, LI e LO | 🔴 Faltante | Serviço mais vendido do core. |
| Licenciamento | LIC-015 | Renovação de Licenças | 🔴 Faltante | Receita recorrente. |
| Outorga | OUT-001 | Declaração de Uso (Dispensa) | 🔴 Faltante | - |
| Outorga | OUT-002 | Outorga — Captação | 🔴 Faltante | - |
| Outorga | OUT-013 | Monitoramento Nível Freático | ✅ Migrado | Existente no Seed oficial. |
| Outorga | OUT-015 | Outorga Subterrânea (Poço) | ✅ Migrado | Existente no Seed oficial. |
| Outorga | OUT-016 | Outorga para Umectação | 🔴 Faltante | Essencial para obras/terraplanagem. |
| Estudos | EST-001 | Diagnóstico de Passivo Ambiental | 🔴 Faltante | - |
| Estudos | EST-002 | Avaliação Preliminar (APA) | 🔴 Faltante | - |
| Estudos | EST-003 | Investigação Confirmatória (ICA) | 🔴 Faltante | - |
| Estudos | EST-004 | Investigação Detalhada (IDA) | 🔴 Faltante | - |
| Estudos | EST-012 | PGRS (Duplicado de LIC-011) | ✅ Migrado | Mapeado como origem de LIC-011. |

*(Tabela resumida. Todos os outros IDs das seções 1-3 que não constam como ✅ estão como 🔴 Faltantes).*

---

## 3. Identificação de Lacunas Críticas

### 3.1. Bloqueio do Motor Regulatório
O motor de inteligência (`regulatory-engine.ts`) e o framework comercial (`regulatory-commercial-framework.ts`) utilizam os IDs `LIC-001` a `LIC-020` e `EST-001` a `EST-010` como chaves fixas para:
1. Definir o rito de licenciamento (LP, LI, LO).
2. Calcular a elegibilidade de estudos (Ex: Se for Alto Impacto, sugere `LIC-005`).
3. Agrupar o orçamento em Etapas (Etapa 1: Diagnóstico, Etapa 2: Licenciamento).

**Sem esses serviços no banco, o Diagnóstico CNAE (Onda 2.7) retornará recomendações vazias ou gerará erros de referência ao tentar criar propostas para atividades não relacionadas a postos.**

### 3.2. Diferença Posto vs Geral
O catálogo oficial hoje é um **Catálogo de Especialidade (Postos)**. Para o sistema se tornar um SaaS de Consultoria Ambiental Geral, ele precisa do **Catálogo de Base (INTERFACE)**.

---

## 4. Plano de Ação e Recomendação

Para garantir que a Onda 2.7 seja bem-sucedida, não podemos avançar apenas com os 31 serviços atuais.

### Recomendação: "Seed de Complementação Base"

1. **Não alterar a estrutura do banco** (já validada na Onda 2.5).
2. **Expandir o arquivo de seed** `servicos-consultoria.ts` para incluir os 44 serviços faltantes da INTERFACE, mantendo a padronização de campos (preço base, margem, custo interno).
3. **Mapear IDs Legados:** Garantir que o campo `codigoOrigem` seja preenchido corretamente para não quebrar a retrocompatibilidade com o motor regulatório legado.

### Próximos Passos:
- Finalizar esta Onda 2.6 com este relatório.
- Solicitar autorização para a **Onda 2.6.1 (Seed Incremental)** antes de iniciar o Diagnóstico por CNAE.

---
**Fim do Relatório.**
