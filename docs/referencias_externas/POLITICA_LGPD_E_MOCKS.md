# Política de LGPD e Uso de Mocks

## Objetivo
Estabelecer diretrizes rígidas sobre o tratamento de dados reais de clientes copiados ou utilizados como referência no monorepo oficial do projeto Hábilis (`Posto/sistema`).

## Contexto da Onda 1.1
Durante a consolidação da Onda 1, pastas externas contendo histórico real de clientes (como o caso "Z+Z - América") foram mapeadas e importadas. Estas pastas continham dezenas de megabytes em relatórios originais (PDFs, planilhas) e documentos ambientais que expõem CNPJs, nomes, endereços e históricos processuais reais.

Para garantir a leveza do repositório Git e o cumprimento da Lei Geral de Proteção de Dados (LGPD), **todos os arquivos pesados, binários e documentos finais contendo dados sensíveis foram permanentemente excluídos** do código-fonte na Onda 1.1. 

Apenas a estrutura de pastas vazia, scripts de geração e templates `.html` não preenchidos (ou com dados abertos) foram mantidos como referência para o desenvolvimento de rotinas de PDF e UI.

## Regras de Versionamento (O QUE NÃO PODE)
É terminantemente proibido commitar neste repositório:
1. Cópias de licenças ambientais, outorgas ou alvarás de clientes (PDF, JPG).
2. Orçamentos ou propostas em PDF assinados ou timbrados.
3. Bases de dados Excel (XLSX) contendo listas de clientes reais.
4. Qualquer dump de banco de dados (`.sql`) que contenha informações de produção sem anonimização.
5. Arquivos `.zip` com compilação de documentos recebidos de clientes.

## Como Desenvolver Testes (O QUE DEVE SER FEITO)
- **Seeds do Prisma:** Para testar funcionalidades de CRM e Dashboard, utilize os arquivos de seed (`prisma/seed.ts`). Os seeds devem utilizar bibliotecas como `faker` para gerar nomes fictícios (ex: "Auto Posto Exemplo Ltda", "CNPJ 00.000.000/0001-00").
- **Templates de Documento:** Os arquivos HTML de referência em `/docs/referencias_externas` devem ser tratados apenas como modelos (templates). A lógica de preenchimento de variáveis deve ocorrer estritamente na API e os arquivos de saída devem ser salvos em um bucket S3/MinIO, nunca no disco do servidor ou versionados.

## Rastreabilidade
Um índice completo dos arquivos originais do "Z+Z - América" antes da limpeza foi preservado no arquivo `INDICE_ARQUIVOS_ORIGINAIS.txt` na respectiva pasta, servindo unicamente para auditoria de estrutura, provando que o material binário foi expurgado.
