# Templates CSV - Guia de uso

## 1. Como usar

Cada arquivo CSV deste diretorio representa uma aba de uma planilha mestra de implantacao.

Fluxo recomendado:

1. copiar os CSVs para uma pasta de trabalho da implantacao;
2. abrir no Excel ou Google Sheets;
3. preencher mantendo o cabecalho original;
4. validar o lote;
5. importar na ordem definida em `00_controle_carga.csv`.

## 2. Padroes de preenchimento

- separador: `;`
- datas: `YYYY-MM-DD`
- booleanos: `true` ou `false`
- listas: separar por `|`
- campos vazios: deixar vazio
- JSON simples: usar texto plano controlado, ex. `entidade=licencaAmbiental|campo_data=dataVencimento|diasAntes=90`

## 3. Chaves de referencia

Usar sempre as chaves de negocio:

- `tenant_slug`
- `empresa_cnpj`
- `usuario_email`
- `empreendimento_codigo`
- `orgao_sigla`
- `tipo_documento_codigo`
- `numero_protocolo`
- `licenca_numero`
- `bomba_numero`
- `tanque_numero`
- `poco_codigo`

## 4. Mapa rapido dos arquivos

- `00_controle_carga.csv`: governanca do lote
- `01_orgaos_reguladores.csv`: `OrgaoRegulador`
- `02_tipos_documento.csv`: `TipoDocumento`
- `03_tipos_processo.csv`: `TipoProcesso`
- `04_fases_tipo_processo.csv`: `FaseTipoProcesso`
- `05_requisitos_tipo_processo.csv`: `RequisitoTipoProcesso`
- `06_obrigacoes_regulatorias.csv`: `ObrigacaoRegulatoriaBase`
- `07_limites_parametros.csv`: `LimiteParametro`
- `08_usuarios.csv`: `Usuario`
- `09_empreendimentos.csv`: `Empreendimento`
- `10_acessos_empreendimento.csv`: `EmpreendimentoAcesso`
- `11_processos_documentos.csv`: `Processo` e `Documento`
- `12_licencas_alvaras_condicionantes.csv`: `LicencaAmbiental`, `CondicaoLicenca`, `AlvaraUrbanistico`
- `13_sst.csv`: `Funcionario`, `ASO`, `DocumentoSST`, `TreinamentoTipo`, `TreinamentoExecucao`, `TreinamentoParticipante`, `EntregaEPI`
- `14_equipamentos_residuos.csv`: `BombaAbastecimento`, `Tanque`, `TesteEstanqueidade`, `Transportadora`, `MTR`, `CCR`, `PGRS`, `PGRSExigencia`
- `15_outorga_monitoramento.csv`: `PocoArtesiano`, `LaudoAgua`, `PocoMonitoramento`, `CampanhaMonitoramento`, `ParametroContaminante`
- `16_BACKLOG_ORQUESTRACAO.csv`: backlog operacional da consolidacao
- `17_fontes_oficiais.csv`: registro mestre das fontes oficiais e sua vigencia

## 5. Regra pratica

Se um arquivo tiver coluna `registro_tipo`, cada linha indica qual entidade sera importada naquela planilha combinada.
