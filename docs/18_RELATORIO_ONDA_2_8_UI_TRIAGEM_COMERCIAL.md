# 18_RELATORIO_ONDA_2_8_UI_TRIAGEM_COMERCIAL

## 1. Objetivo

A Onda 2.8 teve como objetivo criar a primeira interface interna de Triagem Comercial consumindo o endpoint ja entregue na Onda 2.7:

`POST /api/v1/comercial/diagnostico/cnae`

Escopo executado:
- tela interna no frontend Next.js
- consumo autenticado do endpoint de diagnostico
- exibicao de risco, score, servicos, alertas, proximos passos e orcamento
- indicacao de cobertura limitada para CNAE nao mapeado
- integracao com a navegacao interna existente

Escopo explicitamente nao executado:
- proposta persistida
- contrato
- ordem de servico
- migration
- Prisma
- seed
- motor financeiro
- alteracoes em dashboard, documentos, processos, tarefas, condicionantes ou portal

---

## 2. Arquivos Criados/Alterados

| Arquivo | Acao | Finalidade |
|---|---|---|
| `apps/web/src/app/(app)/comercial/triagem/page.tsx` | Criado | Entrada da nova rota interna de Triagem Comercial |
| `apps/web/src/app/(app)/comercial/triagem/triagem-form.tsx` | Criado | UI client-side da triagem e exibicao do resultado |
| `apps/web/src/app/(app)/comercial/triagem/actions.ts` | Criado | Server action autenticada para consumir o endpoint do diagnostico |
| `apps/web/src/app/(app)/comercial/triagem/shared.ts` | Criado | Tipos e constantes alinhados ao schema atual do backend |
| `apps/web/src/components/layout/app-sidebar.tsx` | Alterado | Inclusao do item de menu `Triagem Comercial` |

---

## 3. Navegacao

Foi identificado um padrao claro de menu na sidebar interna.

Decisao adotada:
- item adicionado no grupo `Inteligência`
- nome: `Triagem Comercial`
- caminho: `/comercial/triagem`

Essa escolha manteve proximidade com:
- `CRM Leads`
- `Risco`
- `Relatórios`

sem criar uma secao nova isolada e sem quebrar a organizacao atual do app.

---

## 4. Estrutura da Tela

A nova tela foi implementada em:

`apps/web/src/app/(app)/comercial/triagem/page.tsx`

Ela contem:

1. **Bloco de abertura**
- contextualiza a triagem como leitura comercial interna
- reforca que a tela consome o diagnostico validado no backend

2. **Formulario de triagem**
- CNAE principal
- UF
- municipio
- porte
- situacao
- possui licenca
- licenca vencida
- tem outorga anterior
- possui PGRS
- possui auto de infracao

3. **Painel de resposta**
- risco estimado
- score
- cobertura
- enquadramento
- faixa de orcamento
- servicos sugeridos
- alertas
- proximos passos
- obrigatoriedades e impactos

---

## 5. Alinhamento com o Backend

O payload enviado ao backend segue estritamente o schema real atual da Onda 2.7:

```json
{
  "cnaes": ["..."],
  "uf": "GO",
  "municipio": "Goiânia",
  "porte": "MEDIO",
  "situacao": "IRREGULAR",
  "temLicencaAnterior": false,
  "temOutorgaAnterior": false
}
```

Enums usados na UI foram mantidos identicos ao backend:
- `MICRO`
- `PEQUENO`
- `MEDIO`
- `GRANDE`
- `MUITO_GRANDE`

e

- `PLANEJADO`
- `IMPLANTACAO`
- `OPERACAO`
- `IRREGULAR`
- `RENOVACAO`

Importante:
- `licenca vencida`
- `possui PGRS`
- `possui auto de infracao`

foram mantidos na tela como **contexto comercial complementar**, mas **nao sao enviados ao backend**, porque o schema atual da API ainda nao aceita esses campos.

Essa limitacao foi explicitamente comunicada na propria interface.

---

## 6. Protecao de Dados no Frontend

O frontend nao expoe:
- custo interno
- margem
- metadata

A tela mostra apenas dados seguros ja fornecidos pela resposta sanitizada do backend:
- `precoEstimado`
- `precoMinimo`
- `precoMaximo`
- justificativa
- nome/codigo/categoria do servico

---

## 7. Cobertura Limitada

Foi implementado um aviso visual especifico quando o backend retorna um CNAE nao mapeado em detalhe.

Comportamento:
- a UI detecta esse caso pela descricao retornada no diagnostico
- exibe um banner de `Cobertura limitada do CNAE`
- orienta o usuario a tratar a resposta como triagem preliminar

---

## 8. Validacao Tecnica

Validacao executada:

```bash
npm run typecheck
```

Resultado:
- `typecheck` do `apps/web` passou

Tentativa adicional:

```bash
npm run build
```

Status:
- a validacao de build foi bloqueada por permissao no cache existente de `.next`
- o erro encontrado foi de ownership/permissao em arquivos antigos de `.next`, nao de tipagem da nova tela

Observacao:
- o diretório `.next/server`, `.next/static` e `.next/types` estava com ownership de `nobody:nogroup`, impedindo a limpeza do cache pelo `next build`

---

## 9. Conclusao

A Onda 2.8 foi concluida com sucesso no escopo de UI interna.

Ganhos objetivos:
- o sistema agora possui uma primeira interface de triagem comercial real
- a tela consome o diagnostico por CNAE ja validado nas ondas 2.7 e 2.7.1
- a navegacao interna foi atualizada com um ponto claro de acesso
- a resposta do backend foi apresentada de forma util para comercial e operacao
- campos sensiveis permaneceram protegidos no frontend

Observacao final:
- esta etapa entregou apenas UI + consumo do endpoint existente, sem iniciar persistencia comercial
