# Camada Transversal C4 — Sistema de Alertas e Escalonamento

## Decisão transversal nº4
Modelo em **3 níveis**:
1. **`RegraAlerta`** (catálogo): declara gatilho, público, canais, escalonamento.
2. **`Alerta`** (instância): gerado quando regra dispara.
3. **`EntregaAlerta`** (envio): cada destinatário × canal vira entrega rastreada.

Escalonamento: `Alerta` tem `nivelEscalonamento` que cresce automaticamente se não acked.

## Modelo (deltas)

```prisma
enum CanalEntrega { IN_APP EMAIL WHATSAPP SMS PUSH_MOBILE WEBHOOK }
enum NivelAlerta { INFO AVISO ATENCAO CRITICO FATAL }

model RegraAlerta {
  id String @id; nome String; descricao String?
  origem OrigemObrigacao              // mesmo enum da Camada 2
  condicao Json                       // {tipo: 'antecedencia', dias: 90}
  publico Json                        // {papeis: [...], usuariosFixos: [...], grupoEmail: ?}
  canais CanalEntrega[]               // canais default
  templateMensagem String             // {{empreendimento}}, {{vencimento}}, etc.
  nivelInicial NivelAlerta
  escalonamento Json?                 // [{aposHoras, novoNivel, novosPapeis, novosCanais}]
  agrupar Boolean
  janelaAgrupamentoMin Int?
  ativo Boolean
  vigenteDesde DateTime @db.Date
}

model Alerta {
  id String @id
  regraId String?; empreendimentoId String?; obrigacaoAgendadaId String?
  entidadeTipo String?; entidadeId String?
  titulo String; mensagem String
  nivel NivelAlerta; nivelEscalonamento Int
  proximaEscalacaoEm DateTime?
  ackedEm DateTime?; ackedPorId String?; ackMotivo String?
  resolvedEm DateTime?
  status String                       // ABERTO | EM_ESCALONAMENTO | ACKED | RESOLVIDO | EXPIRADO
  criadoEm DateTime
}

model EntregaAlerta {
  id String @id
  alertaId String; destinatarioId String
  canal CanalEntrega; enderecoCanal String
  enviadoEm DateTime?; entregueEm DateTime?; lidoEm DateTime?
  erroEnvio String?; tentativas Int
}
```

## Algoritmo de escalonamento

```
worker AlertaEscalonadorJob (cron 5 min):
  abertos = Alerta.where(status='EM_ESCALONAMENTO', proximaEscalacaoEm <= now())
  para cada alerta em abertos:
    proximoNivel = regra.escalonamento[alerta.nivelEscalonamento]
    se proximoNivel:
      alerta.nivel = proximoNivel.novoNivel
      alerta.nivelEscalonamento += 1
      criar EntregaAlerta para cada novo destinatário/canal
      alerta.proximaEscalacaoEm = now() + proximoNivel.aposHoras
    senao:
      alerta.status = 'EXPIRADO'
    gravar AuditLog
```

## Templates seed (catálogo inicial)

| Origem | Antecedência | Nível inicial | Escalonamento |
|---|---|---|---|
| LICENCA_VENCIMENTO | 180/90/60/30/15/7d | AVISO → CRITICO | RT → +Coord → +Diretoria |
| PRAZO_PROCESSUAL (M5) | 7/3/1d, 4h | CRITICO → FATAL | Resp → +Coord → +Diretoria + advogado |
| ENSAIO_VENCIMENTO | 90/60/30d | AVISO → ATENCAO | RT → +Coord |
| CAT_ACIDENTE | 24h, 12h, 4h | FATAL | Compliance + Diretoria + RH (canais redundantes) |
| SIMP_MENSAL | 7/3/1d | ATENCAO → CRITICO | Compliance Officer |
| EMBARGO_VIGENTE | imediato | FATAL | Tudo (top management) |
| MTR_SEM_CDF (60d) | imediato | CRITICO | Operação |
| ASO_VENCIDO | imediato | ATENCAO | RH + Pessoa |

## Regras
- **Anti-spam**: agrupamento configurável (1 alerta com 5 condicionantes vencendo, não 5 alertas).
- **Quiet hours**: alertas non-FATAL não enviam fora do horário (canais SMS/WPP).
- **Ack obrigatório com motivo** para CRITICO/FATAL.
- **Reentrega** se canal falhou (3 tentativas com backoff).
- **Webhooks**: clientes podem assinar para integração com sistemas internos.

## Casos de borda
1. Pessoa em férias: regras suportam substituto temporário por papel.
2. Canal indisponível: fallback automático para email.
3. Mudança de regra com alertas em escalonamento: respeita versão original.
4. Acks em massa (gerente acka 50 alertas): exigir motivo único + auditoria.

## Perguntas abertas
1. Editor visual de regras de alerta v1 ou v2?
2. Voice call em FATAL (TTS)? v2?
3. Integração Slack/Teams além de WhatsApp/Email?
