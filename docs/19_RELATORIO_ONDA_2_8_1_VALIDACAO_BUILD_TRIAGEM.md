# 19_RELATORIO_ONDA_2_8_1_VALIDACAO_BUILD_TRIAGEM

## 1. Objetivo

Esta etapa teve como objetivo sanear o problema operacional do cache `.next` no frontend e validar o build da UI de Triagem Comercial entregue na Onda 2.8.

Escopo desta onda:
- verificar ownership e permissões do `.next`
- tentar remover o cache local de build com segurança
- executar `typecheck`
- executar `build`
- corrigir apenas erro real de código relacionado à Onda 2.8, se surgisse com diagnóstico confiável

Nao foi criado:
- nova funcionalidade
- proposta
- contrato
- ordem de servico
- migration
- alteracao em Prisma
- alteracao em seed
- alteracao de backend

---

## 2. Causa do Problema

Foi confirmado que o diretório `.next` do `apps/web` continha artefatos antigos com ownership inconsistente:

- `.next/server` -> `nobody:nogroup`
- `.next/static` -> `nobody:nogroup`
- `.next/types` -> `nobody:nogroup`

Esse ownership impedia:
- `rm -rf .next`
- `npm run build`
- a limpeza interna que o `next build` tenta fazer antes de gerar um novo build

Em outras palavras, o bloqueio operacional principal veio de artefatos de build antigos gerados fora do usuário atual.

---

## 3. Verificação de Permissões

Comandos executados:

```bash
ls -la .next || true
ls -la .next/server .next/static .next/types 2>/dev/null || true
```

Resultado resumido:
- `.next` em si estava com owner do usuário atual
- subdiretórios internos críticos estavam com owner `nobody:nogroup`

---

## 4. Tentativa de Saneamento

Comando tentado:

```bash
rm -rf .next
```

Resultado:
- falhou com `Permission denied` em múltiplos arquivos de `.next/server`, `.next/static` e `.next/types`

Nova tentativa com elevação disponível ao agente:

```bash
rm -rf .next
```

Resultado:
- mesma falha de permissão

Conclusão:
- o cache `.next` **não foi removido** nesta execução do agente

Orientação manual recomendada no host:

```bash
sudo rm -rf .next
```

ou

```bash
sudo chown -R $USER:$USER .next && rm -rf .next
```

---

## 5. Validação Técnica Executada

### 5.1. Typecheck

Comando:

```bash
npm run typecheck
```

Resultado:
- **Sucesso**

Conclusão:
- a UI da Triagem Comercial permaneceu consistente em TypeScript

### 5.2. Build padrão

Comando:

```bash
npm run build
```

Resultado:
- **Falhou**

Causa objetiva capturada:
- o `next build` tentou limpar `.next`
- a limpeza falhou por `EACCES: permission denied`
- o arquivo citado na falha foi, por exemplo:
  - `.next/types/cache-life.d.ts`
  - `.next/server/app-paths-manifest.json`

### 5.3. Build isolado sem usar o `.next` travado

Como `next.config.ts` já suporta `distDir` via `NEXT_DIST_DIR`, foi feita uma validação paralela em diretório temporário:

```bash
NEXT_DIST_DIR=/tmp/posto-web-next-build npm run build
```

e também:

```bash
NEXT_DIST_DIR=/tmp/posto-web-next-build npx next build --debug
```

Resultado:
- o build temporário **não esbarrou no `.next` antigo**
- porém terminou com:

```txt
Build failed because of webpack errors
```

Limitação:
- o Next 15, neste ambiente, não expôs stack detalhada adicional do webpack nem com `--debug`
- por isso **não houve base diagnóstica suficiente para corrigir código com segurança nesta onda**

---

## 6. Arquivos Alterados

Arquivos alterados nesta onda:

| Arquivo | Ação | Motivo |
|---|---|---|
| `docs/19_RELATORIO_ONDA_2_8_1_VALIDACAO_BUILD_TRIAGEM.md` | Criado | Registro da validação operacional e do resultado do build |

Nenhum arquivo de frontend ou backend foi alterado nesta execução.

---

## 7. Confirmação de Escopo

Confirmação explícita:
- nenhuma nova funcionalidade foi criada
- nenhuma tela nova além da já entregue na Onda 2.8 foi adicionada
- nenhuma lógica de proposta, contrato ou OS foi criada
- nenhum ajuste em Prisma, seed ou backend foi realizado

---

## 8. Conclusão

Resultado consolidado:

1. O problema operacional do cache `.next` foi **diagnosticado com precisão**.
2. O cache local **não pôde ser removido** pelo agente devido ownership externo (`nobody:nogroup`).
3. O `typecheck` do frontend **passou**.
4. O `build` padrão **falhou por permissão no `.next`**.
5. O `build` isolado em diretório temporário **falhou por erro genérico de webpack**, mas sem stack suficiente para correção segura nesta rodada.

---

## 9. Próxima Etapa Recomendada

Próximo passo recomendado:

1. executar localmente no host:

```bash
cd "/home/guilherme/Projetos VS CODE/Posto/sistema/apps/web"
sudo chown -R $USER:$USER .next && rm -rf .next
```

ou:

```bash
cd "/home/guilherme/Projetos VS CODE/Posto/sistema/apps/web"
sudo rm -rf .next
```

2. rerodar:

```bash
npm run build
```

3. se o erro de webpack persistir com console completo, abrir uma rodada específica de diagnóstico de build da Onda 2.8, já sem o ruído operacional do cache antigo
