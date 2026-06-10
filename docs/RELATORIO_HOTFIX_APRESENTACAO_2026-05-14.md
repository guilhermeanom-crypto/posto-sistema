# Hotfixes de Apresentação — 2026-05-14

## O que foi corrigido

### Cadastro de posto / empreendimento
- A tela de novo empreendimento deixou de depender de uma rota inexistente (`GET /empresas`).
- O carregamento de empresas agora usa o onboarding existente e, como fallback, deduplica empresas vindas da listagem de empreendimentos.
- CNPJ e CEP passam por sanitização antes do envio para a API.
- A interface agora explica que valores mascarados são aceitos e normalizados.
- Erros de validação da API passam a voltar como `400 VALIDATION_ERROR` em vez de `500` genérico.

Arquivos:
- [apps/web/src/app/(app)/empreendimentos/novo/page.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/app/(app)/empreendimentos/novo/page.tsx)
- [apps/web/src/app/(app)/empreendimentos/novo/novo-empreendimento-form.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/app/(app)/empreendimentos/novo/novo-empreendimento-form.tsx)
- [apps/web/src/app/(app)/empreendimentos/novo/actions.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/app/(app)/empreendimentos/novo/actions.ts)
- [apps/web/src/lib/api.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/lib/api.ts)
- [apps/api/src/app.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/api/src/app.ts)

### Logo e peso visual do sistema interno
- Removido o uso da imagem PNG gigante da marca nas áreas críticas.
- Criado wordmark leve em código para login, sidebar e portal.
- Simplificada a tela de login: saiu o canvas animado pesado e entrou um fundo estático com gradientes.

Arquivos:
- [apps/web/src/components/brand/habilis-wordmark.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/components/brand/habilis-wordmark.tsx)
- [apps/web/src/app/(auth)/login/page.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/app/(auth)/login/page.tsx)
- [apps/web/src/app/(auth)/login/animated-bg.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/app/(auth)/login/animated-bg.tsx)
- [apps/web/src/components/layout/app-sidebar.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/components/layout/app-sidebar.tsx)
- [apps/web/src/app/portal/(portal)/portal-nav.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/src/app/portal/(portal)/portal-nav.tsx)

### Site público: peso e repetição de imagens
- Reativada a otimização padrão do `next/image` no `web` e no `site`.
- Reduzida a repetição das imagens mais visíveis do catálogo de serviços.
- Diversificados projetos, notícias, contato e sobre com as imagens oficiais novas da Hábilis.

Arquivos:
- [apps/web/next.config.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/web/next.config.ts)
- [apps/site/next.config.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/site/next.config.ts)
- [apps/site/src/lib/content.ts](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/site/src/lib/content.ts)
- [apps/site/src/app/sobre/page.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/site/src/app/sobre/page.tsx)
- [apps/site/src/app/contato/page.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/site/src/app/contato/page.tsx)
- [apps/site/src/app/noticias/page.tsx](/home/guilherme/Projetos%20VS%20CODE/Posto/sistema/apps/site/src/app/noticias/page.tsx)

## Verificação técnica

- `apps/web`: `tsc --noEmit` OK
- `apps/site`: `tsc --noEmit` OK
- `apps/api`: `tsc --noEmit` OK

## Roteiro seguro para apresentação

### Mais seguro
- Login interno
- Dashboard
- Portal do cliente
- Assistente Hábilis
- Site institucional (`/` e `/servicos`)

### Mostrar com atenção
- Cadastro de empreendimento/posto: os hotfixes foram aplicados, mas vale testar uma vez no seu navegador antes da reunião com um caso real de preenchimento.

## Pendências pequenas que ainda podem melhorar depois da apresentação
- Trocar o wordmark temporário por uma versão vetorial oficial final.
- Comprimir também os PNGs oficiais muito grandes do site, se quiser mais ganho de performance.
- Revisar o restante das páginas públicas para eliminar repetições residuais de imagem.
