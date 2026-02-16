# 📡 API de Disparo em Massa (Mass Broadcast)

## 📌 Visão Geral

A API de Disparo em Massa permite criar e gerenciar campanhas de envio de mensagens via WhatsApp para múltiplos clientes de forma controlada. O sistema utiliza uma fila exclusiva, isolada do sistema de re-engagement, garantindo rate limiting independente e controle total sobre o ciclo de vida das campanhas.

---

## 🔐 Autenticação e Permissões

Todas as rotas requerem:
- **Autenticação**: Token JWT válido
- **Permissão**: `update:pipeline`
- **Guard**: `@UseGuards(PermissionsGuard)`

---

## 📋 Rotas da API

### 1. Preview de Destinatários

**Visualiza quais clientes serão incluídos na campanha sem criar nada no banco.**

```http
POST /mass-broadcast/preview-recipients
```

#### Request Body

```typescript
{
  workspaceId: string;          // UUID do workspace
  customerIds?: string[];       // IDs de customers selecionados diretamente
  includeTagIds?: string[];     // Tags para inclusão (customers com chat que tenha essas tags)
  excludeTagIds?: string[];     // Tags para exclusão (remove customers com chat que tenha essas tags)
  pipelineStageIds?: string[];  // Stages de pipeline (customers com deal nessas stages)
}
```

> **Nota**: Pelo menos um dos critérios de seleção (`customerIds`, `includeTagIds`, ou `pipelineStageIds`) deve ser fornecido.

#### Response Success (200)

```typescript
{
  recipients: [
    {
      customerId: string,
      chatId: string,
      customerPhone: string,
      customerName: string
    }
  ],
  total: number
}
```

#### Response Error (400/500)

Em caso de erro, o controller lança uma exception HTTP com a mensagem de erro:

- **400 Bad Request**: `"No selection criteria provided"`
- **500 Internal Server Error**: `"Internal error"`

---

### 2. Criar Campanha

**Cria uma nova campanha de disparo em massa.**

```http
POST /mass-broadcast
```

#### Request Body

```typescript
{
  name: string;                   // Nome da campanha (1-100 caracteres)
  messages: string[];             // Array de mensagens (1-20 itens, sorteia aleatoriamente)
  pipelineId: string;             // UUID do pipeline (define conexão WhatsApp a usar)
  workspaceId: string;            // UUID do workspace

  // Filtros de seleção (pelo menos um deve ter valores)
  customerIds?: string[];         // IDs de customers diretos
  includeTagIds?: string[];       // Tags para inclusão
  excludeTagIds?: string[];       // Tags para exclusão
  pipelineStageIds?: string[];    // Stages de qualquer pipeline do workspace

  // Opcional
  applyTagIds?: string[];         // Tags a aplicar ao chat após envio bem-sucedido
  messageDelaySeconds?: number;   // Delay entre mensagens (10-300s, padrão: 30s)
  startTime?: string;             // ISO datetime - início da janela de envio
  endTime?: string;               // ISO datetime - fim da janela de envio
}
```

> **IMPORTANTE**:
> - O `pipelineId` serve **exclusivamente** para definir qual conexão WhatsApp será usada no envio.
> - O `pipelineStageIds` pode conter stages de **qualquer pipeline do workspace** (ou da empresa se admin), não necessariamente do `pipelineId` especificado.

#### Response Success (201)

```typescript
{
  id: string,
  companyId: string,
  workspaceId: string,
  createdByUserId: string,
  name: string,
  messages: string[],
  pipelineId: string,
  status: "READY",  // Status inicial após criação bem-sucedida
  totalRecipients: number,
  sentCount: number,
  failedCount: number,
  customerIds: string[],
  includeTagIds: string[],
  excludeTagIds: string[],
  pipelineStageIds: string[],
  applyTagIds: string[],
  messageDelaySeconds: number,
  startTime: Date | null,
  endTime: Date | null,
  startedAt: Date | null,
  completedAt: Date | null,
  cancelledAt: Date | null,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

#### Response Error (400/404/500)

Em caso de erro, o controller lança uma exception HTTP com a mensagem de erro:

- **404 Not Found**: `"Pipeline not found"`, `"No recipients found for the given criteria"`
- **400 Bad Request**: `"Pipeline has no WhatsApp integration"`, `"Invalid tags"`, `"Invalid pipeline stages"`, `"Messages cannot be empty"`
- **500 Internal Server Error**: `"Internal error"`

---

### 3. Listar Campanhas

**Lista campanhas de disparo em massa com paginação e filtros.**

```http
GET /mass-broadcast
```

#### Query Parameters

```typescript
{
  page?: number;          // Número da página (padrão: 1)
  limit?: number;         // Itens por página (1-100, padrão: 20)
  workspaceId?: string;   // Filtrar por workspace
  status?: string;        // Filtrar por status (DRAFT, PROCESSING, READY, SENDING, PAUSED, COMPLETED, CANCELLED, FAILED)
}
```

#### Response Success (200)

```typescript
{
  items: MassBroadcast[],  // Array de campanhas
  total: number,           // Total de registros
  page: number,            // Página atual
  limit: number,           // Limite por página
  totalPages: number       // Total de páginas
}
```

#### Response Error (500)

Em caso de erro, o controller lança uma exception HTTP:

- **500 Internal Server Error**: `"Internal error"`

---

### 4. Obter Detalhes da Campanha

**Retorna detalhes completos de uma campanha, incluindo resumo de destinatários.**

```http
GET /mass-broadcast/:id
```

#### Path Parameters

- `id`: UUID da campanha

#### Response Success (200)

```typescript
{
  // Dados da campanha (MassBroadcast)
  id: string,
  companyId: string,
  name: string,
  status: string,
  totalRecipients: number,
  sentCount: number,
  failedCount: number,
  // ... outros campos

  // Resumo de destinatários
  recipientsSummary: {
    total: number,
    pending: number,
    queued: number,
    sent: number,
    failed: number,
    cancelled: number,
    skipped: number
  }
}
```

#### Response Error (404/500)

Em caso de erro, o controller lança uma exception HTTP:

- **404 Not Found**: `"Broadcast not found"`
- **500 Internal Server Error**: `"Internal error"`

---

### 5. Listar Destinatários da Campanha

**Lista os destinatários de uma campanha específica com paginação.**

```http
GET /mass-broadcast/:id/recipients
```

#### Path Parameters

- `id`: UUID da campanha

#### Query Parameters

```typescript
{
  page?: number;          // Número da página (padrão: 1)
  limit?: number;         // Itens por página (1-100, padrão: 20)
  status?: string;        // Filtrar por status (PENDING, QUEUED, SENT, FAILED, CANCELLED, SKIPPED)
}
```

#### Response Success (200)

```typescript
{
  items: [
    {
      id: string,
      massBroadcastId: string,
      customerId: string,
      chatId: string,
      status: string,
      messageContent: string,
      messageId: string | null,
      sentAt: Date | null,
      failedAt: Date | null,
      errorMessage: string | null,
      tagsApplied: boolean,
      createdAt: Date,
      updatedAt: Date
    }
  ],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

#### Response Error (404/500)

Em caso de erro, o controller lança uma exception HTTP:

- **404 Not Found**: `"Broadcast not found"`
- **500 Internal Server Error**: `"Internal error"`

---

### 6. Iniciar Campanha

**Inicia o envio de mensagens de uma campanha.**

```http
POST /mass-broadcast/:id/start
```

#### Path Parameters

- `id`: UUID da campanha

#### Response Success (200)

Retorna o objeto `MassBroadcast` completo com status atualizado para `SENDING`.

```typescript
{
  id: string,
  // ... todos os campos de MassBroadcast
  status: "SENDING",
  // ...
}
```

#### Response Error (400/404/500)

Em caso de erro, o controller lança uma exception HTTP:

- **404 Not Found**: `"Broadcast not found"`
- **400 Bad Request**: `"Broadcast is not in DRAFT, READY, or PAUSED status"`, `"Pipeline has no WhatsApp integration"`, `"No recipients to send"`
- **500 Internal Server Error**: `"Internal error"`

---

### 7. Pausar Campanha

**Pausa uma campanha em andamento.**

```http
POST /mass-broadcast/:id/pause
```

#### Path Parameters

- `id`: UUID da campanha

#### Response Success (200)

Retorna o objeto `MassBroadcast` completo com status atualizado para `PAUSED`.

```typescript
{
  id: string,
  // ... todos os campos de MassBroadcast
  status: "PAUSED",
  // ...
}
```

#### Response Error (400/404/500)

Em caso de erro, o controller lança uma exception HTTP:

- **404 Not Found**: `"Broadcast not found"`
- **400 Bad Request**: `"Broadcast is not in SENDING status"`
- **500 Internal Server Error**: `"Internal error"`

> **Comportamento**:
> - Mensagens PENDING na fila exclusiva são canceladas
> - Recipients QUEUED voltam para PENDING (serão reprocessados ao retomar)
> - Recipients já SENT permanecem inalterados

---

### 8. Cancelar Campanha

**Cancela uma campanha permanentemente.**

```http
POST /mass-broadcast/:id/cancel
```

#### Path Parameters

- `id`: UUID da campanha

#### Response Success (200)

Retorna o objeto `MassBroadcast` completo com status atualizado para `CANCELLED`.

```typescript
{
  id: string,
  // ... todos os campos de MassBroadcast
  status: "CANCELLED",
  cancelledAt: Date,
  // ...
}
```

#### Response Error (400/404/500)

Em caso de erro, o controller lança uma exception HTTP:

- **404 Not Found**: `"Broadcast not found"`
- **400 Bad Request**: `"Broadcast is already completed or cancelled"`
- **500 Internal Server Error**: `"Internal error"`

> **Comportamento**:
> - Mensagens PENDING na fila exclusiva são canceladas
> - Recipients PENDING e QUEUED são marcados como CANCELLED
> - Recipients já SENT permanecem inalterados

---

### 9. Retentar Destinatários Falhados

**Reprocessa recipients que falharam no envio.**

```http
POST /mass-broadcast/:id/retry-failed
```

#### Path Parameters

- `id`: UUID da campanha

#### Response Success (200)

```typescript
{
  broadcast: MassBroadcast,  // Campanha completa
  retriedCount: number       // Quantidade de recipients reprocessados
}
```

#### Response Error (400/404/500)

Em caso de erro, o controller lança uma exception HTTP:

- **404 Not Found**: `"Broadcast not found"`
- **400 Bad Request**: `"No failed recipients to retry"`
- **500 Internal Server Error**: `"Internal error"`

---

### 10. Deletar Campanha

**Remove uma campanha (soft delete).**

```http
DELETE /mass-broadcast/:id
```

#### Path Parameters

- `id`: UUID da campanha

#### Response Success (200)

```typescript
{
  message: "Broadcast deleted successfully"
}
```

#### Response Error (400/404/500)

Em caso de erro, o controller lança uma exception HTTP:

- **404 Not Found**: `"Broadcast not found"`
- **400 Bad Request**: `"Cannot delete a broadcast that is sending"`
- **500 Internal Server Error**: `"Internal error"`

---

## 🔄 Fluxo de Utilização Completo

### 1️⃣ Criar Campanha

Crie a campanha com os filtros desejados:

```bash
POST /mass-broadcast
{
  "name": "Promoção Black Friday 2026",
  "messages": [
    "Olá {nome}! Temos uma oferta especial para você! 🎉",
    "Oi {nome}! Não perca essa promoção incrível! 🔥",
    "E aí {nome}! Aproveite nosso desconto exclusivo! 💰"
  ],
  "pipelineId": "pipeline-uuid",
  "workspaceId": "workspace-uuid",
  "includeTagIds": ["tag1-uuid", "tag2-uuid"],
  "excludeTagIds": ["tag3-uuid"],
  "pipelineStageIds": ["stage1-uuid"],
  "applyTagIds": ["tag-promo-enviada-uuid"],
  "messageDelaySeconds": 30,
  "startTime": "2026-02-16T08:00:00Z",
  "endTime": "2026-02-16T18:00:00Z"
}
```

✅ **Resultado**: Campanha criada com status `READY` e recipients gerados.

> **O que acontece internamente**:
> 1. Sistema resolve destinatários usando os filtros (UNION de customerIds + includeTagIds + pipelineStageIds - excludeTagIds)
> 2. Para cada destinatário, cria um `MassBroadcastRecipient` com status `PENDING`
> 3. Sorteia aleatoriamente uma mensagem do array para cada recipient
> 4. Atualiza `totalRecipients` no broadcast
> 5. Marca campanha como `READY`

---

### 2️⃣ Visualizar Detalhes da Campanha

Consulte os detalhes e o resumo de destinatários:

```bash
GET /mass-broadcast/{id}
```

✅ **Resultado**: Campanha com resumo de quantos recipients estão em cada status.

---

### 3️⃣ Iniciar Campanha

Quando estiver pronto, inicie o envio:

```bash
POST /mass-broadcast/{id}/start
```

✅ **Resultado**: Campanha muda para status `SENDING` e o processamento começa.

> **O que acontece internamente**:
> 1. Status da campanha muda para `SENDING`
> 2. Registra `startedAt` (se primeira vez)
> 3. O Scheduler CRON (`MassBroadcastSchedulerService`) detecta a campanha ativa
> 4. Para cada recipient PENDING, cria `MassBroadcastQueuedMessage` na fila exclusiva
> 5. Recipient passa para status `QUEUED`
> 6. BullMQ adiciona job na fila `mass-broadcast-rate-limiter`
> 7. `MassBroadcastRateLimiterProcessor` consome o job respeitando rate limiting (Redis lock por broadcast)
> 8. Mensagem é enviada via `SendMessageService` usando conexão WhatsApp do `pipelineId`
> 9. `Message` é criada no banco
> 10. Recipient passa para status `SENT` e `messageId` é atualizado
> 11. Se `applyTagIds` foi configurado, tags são aplicadas ao chat
> 12. Recipient marca `tagsApplied = true`

---

### 4️⃣ Monitorar Progresso

Acompanhe o andamento da campanha:

```bash
# Ver resumo geral
GET /mass-broadcast/{id}

# Ver lista detalhada de recipients
GET /mass-broadcast/{id}/recipients?status=SENT&page=1&limit=50
```

✅ **Resultado**: Visibilidade completa do progresso (pendentes, enviados, falhados).

---

### 5️⃣ Gerenciar Campanha (Opcional)

#### Pausar Temporariamente

```bash
POST /mass-broadcast/{id}/pause
```

✅ **Resultado**: Envios param, status muda para `PAUSED`.

> **Comportamento**:
> - Mensagens PENDING na fila são canceladas
> - Recipients QUEUED voltam para PENDING
> - Pode ser retomada posteriormente com `/start`

#### Retomar Envio

```bash
POST /mass-broadcast/{id}/start
```

✅ **Resultado**: Envios retomam de onde pararam.

#### Cancelar Definitivamente

```bash
POST /mass-broadcast/{id}/cancel
```

✅ **Resultado**: Campanha cancelada permanentemente, status muda para `CANCELLED`.

> **Comportamento**:
> - Mensagens PENDING na fila são canceladas
> - Recipients PENDING e QUEUED são marcados como CANCELLED
> - NÃO pode ser retomada

---

### 6️⃣ Retentar Falhas (Se Necessário)

Se alguns envios falharam, você pode retentá-los:

```bash
POST /mass-broadcast/{id}/retry-failed
```

✅ **Resultado**: Recipients com status `FAILED` voltam para `PENDING` e são reprocessados.

---

### 7️⃣ Finalização Automática

Quando todos os recipients forem processados (SENT, FAILED ou CANCELLED), o sistema automaticamente:

1. Atualiza status da campanha para `COMPLETED`
2. Registra `completedAt`
3. Para o processamento

---

## 🏗️ Arquitetura do Sistema

### Filas Isoladas

```
┌────────────────────────────────────────────────────────────────┐
│       FILA DE RE-ENGAGEMENT (existente - NÃO MODIFICADA)        │
├────────────────────────────────────────────────────────────────┤
│  ReengagementAttempt → QueuedMessage → MessageQueue (Pipeline)  │
│         ↓                                                        │
│  GlobalRateLimiterProcessor (Redis lock per pipeline)            │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│         FILA DE DISPARO EM MASSA (NOVA - EXCLUSIVA)             │
├────────────────────────────────────────────────────────────────┤
│  MassBroadcastRecipient → MassBroadcastQueuedMessage            │
│         ↓                                                        │
│  MassBroadcastRateLimiterProcessor (Redis lock per broadcast)   │
│         ↓                                                        │
│  SendMessageService (mesma conexão WhatsApp via pipelineId)      │
└────────────────────────────────────────────────────────────────┘
```

### Ciclo de Vida de uma Campanha

```
DRAFT      → Rascunho inicial (não usado atualmente, vai direto para READY)
PROCESSING → Resolvendo destinatários e criando recipients
READY      → Pronta para iniciar
SENDING    → Enviando mensagens
PAUSED     → Pausada temporariamente
COMPLETED  → Finalizada (todos processados)
CANCELLED  → Cancelada manualmente
FAILED     → Erro crítico no processamento
```

### Ciclo de Vida de um Recipient

```
PENDING   → Aguardando processamento
QUEUED    → Na fila de envio (MassBroadcastQueuedMessage criada)
SENT      → Enviado com sucesso
FAILED    → Falha no envio
CANCELLED → Cancelado (campanha pausada/cancelada)
SKIPPED   → Pulado (ex: sem telefone, sem chat)
```

---

## 🎯 Resolução de Destinatários

A lógica de seleção é **combinativa (UNION)** entre os filtros, com exclusão posterior:

```
destinatários_finais = (
    customers_selecionados_diretamente
    ∪ customers_com_chat_que_tem_include_tags
    ∪ customers_com_deal_nas_stages_selecionadas
) - customers_com_chat_que_tem_exclude_tags
```

### Detalhamento

1. **Customers Diretos** (`customerIds`): IDs fornecidos diretamente
2. **Include Tags** (`includeTagIds`): Customers cujo `Chat` tenha pelo menos 1 `ChatTag` com `tagId` presente no array
3. **Pipeline Stages** (`pipelineStageIds`): Customers que tenham pelo menos 1 `Deal` com `currentStageId` presente no array
   - ⚠️ **IMPORTANTE**: Stages podem ser de **qualquer pipeline do workspace** (ou da empresa se admin)
   - O `pipelineId` da campanha serve **apenas** para definir qual conexão WhatsApp usar
4. **Exclude Tags** (`excludeTagIds`): Remove da lista final qualquer customer cujo `Chat` tenha pelo menos 1 `ChatTag` com `tagId` presente no array

---

## ⚙️ Rate Limiting e Controle

### Rate Limiting por Broadcast

- Cada campanha tem seu próprio rate limiting configurável (`messageDelaySeconds`)
- Padrão: 30 segundos entre mensagens
- Mínimo: 10 segundos
- Máximo: 300 segundos (5 minutos)

### Janela de Envio (Opcional)

Configure horários permitidos para envio:

- `startTime`: Envios só ocorrem após este horário
- `endTime`: Envios param antes deste horário

Útil para respeitar horário comercial e evitar envios noturnos.

---

## 🔒 Isolamento Total

O sistema de disparo em massa é **completamente isolado** do re-engagement:

- **Entidades separadas**: `MassBroadcastQueuedMessage` ≠ `QueuedMessage`
- **Processadores separados**: `MassBroadcastRateLimiterProcessor` ≠ `GlobalRateLimiterProcessor`
- **Filas BullMQ separadas**: `mass-broadcast-rate-limiter` ≠ `message-rate-limiter`
- **Redis locks separados**: Por broadcast ID vs por pipeline ID

✅ **Garantia**: Problemas em mass broadcast NÃO impactam re-engagement e vice-versa.

---

## 📊 Status de Campanha

### READY
- Campanha criada com sucesso
- Recipients gerados
- Pronta para iniciar

### SENDING
- Envio em andamento
- Scheduler processando recipients PENDING
- Pode ser pausada ou cancelada

### PAUSED
- Envio pausado temporariamente
- Pode ser retomado com `/start`
- Recipients PENDING aguardam retomada

### COMPLETED
- Todos recipients processados
- Não há mais PENDING nem QUEUED
- Campanha finalizada

### CANCELLED
- Cancelada manualmente
- Recipients não enviados foram marcados como CANCELLED
- NÃO pode ser retomada

### FAILED
- Erro crítico no processamento
- Requer análise manual

---

## 🎲 Sorteio de Mensagens

Para evitar detecção de spam pelo WhatsApp, o sistema sorteia aleatoriamente uma mensagem do array `messages` para cada recipient:

```typescript
messages: [
  "Olá {nome}! Mensagem 1",
  "Oi {nome}! Mensagem 2",
  "E aí {nome}! Mensagem 3"
]
```

- Recipient A recebe: "Oi {nome}! Mensagem 2"
- Recipient B recebe: "E aí {nome}! Mensagem 3"
- Recipient C recebe: "Olá {nome}! Mensagem 1"

> **Recomendação**: Forneça pelo menos 3-5 variações de mensagem.

---

## 🏷️ Aplicação de Tags

Configure `applyTagIds` para aplicar tags automaticamente ao chat do customer após envio bem-sucedido:

```typescript
{
  "applyTagIds": ["tag-promo-enviada-uuid", "tag-black-friday-uuid"]
}
```

✅ **Benefício**: Marcar clientes que receberam a campanha para segmentação futura.

---

## 🛡️ Validações e Regras

### Ao Criar Campanha

- ✅ Pipeline deve existir e pertencer à empresa
- ✅ Pipeline deve ter integração WhatsApp ativa
- ✅ Pelo menos um critério de seleção (customerIds, includeTagIds, ou pipelineStageIds)
- ✅ Mensagens não podem ser vazias
- ✅ Deve haver pelo menos 1 recipient após resolução

### Ao Iniciar Campanha

- ✅ Status deve ser DRAFT, READY ou PAUSED
- ✅ Pipeline deve ter integração WhatsApp ativa
- ✅ Deve existir pelo menos 1 recipient PENDING

### Ao Pausar Campanha

- ✅ Status deve ser SENDING

### Ao Cancelar Campanha

- ✅ Status NÃO pode ser COMPLETED ou CANCELLED

### Ao Deletar Campanha

- ✅ Status NÃO pode ser SENDING

---

## 🚨 Tratamento de Erros

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Pipeline not found` | Pipeline ID inválido ou não pertence à empresa | Verificar UUID do pipeline |
| `Pipeline has no WhatsApp integration` | Pipeline sem integração ativa | Configurar integração WhatsApp |
| `No recipients found` | Filtros não retornaram nenhum customer | Revisar critérios de seleção |
| `Broadcast is not in X status` | Operação inválida para status atual | Verificar fluxo de estados |
| `No failed recipients to retry` | Tentou retentar mas não há falhas | Verificar status dos recipients |

---

## 📈 Boas Práticas

### 1. Configure janelas de envio
```typescript
{
  "startTime": "2026-02-16T08:00:00Z",  // 08:00 AM
  "endTime": "2026-02-16T18:00:00Z"     // 06:00 PM
}
```

### 2. Use múltiplas variações de mensagem
```typescript
{
  "messages": [
    "Olá {nome}! Variação 1",
    "Oi {nome}! Variação 2",
    "E aí {nome}! Variação 3",
    "Tudo bem {nome}? Variação 4"
  ]
}
```

### 3. Configure rate limiting adequado
```typescript
{
  "messageDelaySeconds": 45  // 45 segundos é mais seguro que 10
}
```

### 4. Aplique tags para rastreamento
```typescript
{
  "applyTagIds": ["tag-campanha-2026-uuid"]
}
```

### 5. Monitore o progresso regularmente
```bash
GET /mass-broadcast/{id}  # Verificar resumo a cada 5-10 minutos
```

### 6. Use excludeTagIds para evitar duplicatas
```typescript
{
  "includeTagIds": ["tag-clientes-ativos"],
  "excludeTagIds": ["tag-promo-ja-recebida"]  // Não enviar para quem já recebeu
}
```

---

## 🔍 Diferenças entre pipelineId e pipelineStageIds

### `pipelineId` (campo obrigatório)
- Define **qual conexão WhatsApp** será usada para enviar as mensagens
- Deve ter `CompanyWhatsappIntegration` configurada
- É um **único UUID**

### `pipelineStageIds` (campo opcional, filtro de seleção)
- Define **quais customers** serão incluídos com base em suas deals
- Pode conter stages de **qualquer pipeline do workspace/empresa**
- É um **array de UUIDs**
- **NÃO** precisa ser do mesmo pipeline do `pipelineId`

### Exemplo Prático

```typescript
{
  "pipelineId": "pipeline-vendas-uuid",           // Envia via WhatsApp de Vendas
  "pipelineStageIds": [
    "stage-negociacao-vendas-uuid",               // Stage do pipeline de Vendas
    "stage-qualificado-marketing-uuid"            // Stage do pipeline de Marketing
  ]
}
```

✅ **Válido**: As stages podem ser de pipelines diferentes. O `pipelineId` só define a conexão WhatsApp.

---

## 📚 Exemplos de Uso

### Exemplo 1: Campanha Simples por Tags

```bash
POST /mass-broadcast
{
  "name": "Promoção Fim de Semana",
  "messages": [
    "Oi {nome}! Promoção especial para você! 🎉"
  ],
  "pipelineId": "pipeline-uuid",
  "workspaceId": "workspace-uuid",
  "includeTagIds": ["tag-clientes-ativos-uuid"],
  "messageDelaySeconds": 30
}
```

### Exemplo 2: Campanha com Múltiplos Filtros e Exclusão

```bash
POST /mass-broadcast
{
  "name": "Black Friday VIP",
  "messages": [
    "Olá {nome}! Oferta exclusiva Black Friday! 🔥",
    "Oi {nome}! Não perca essa promoção! 💰",
    "E aí {nome}! Desconto especial para você! 🎁"
  ],
  "pipelineId": "pipeline-uuid",
  "workspaceId": "workspace-uuid",
  "includeTagIds": ["tag-vip-uuid", "tag-comprou-ultimo-mes-uuid"],
  "excludeTagIds": ["tag-black-friday-2025-uuid"],
  "pipelineStageIds": ["stage-cliente-ativo-uuid"],
  "applyTagIds": ["tag-black-friday-2026-uuid"],
  "messageDelaySeconds": 45,
  "startTime": "2026-11-25T08:00:00Z",
  "endTime": "2026-11-25T20:00:00Z"
}
```

### Exemplo 3: Campanha para Customers Específicos

```bash
POST /mass-broadcast
{
  "name": "Follow-up Manual",
  "messages": [
    "Olá {nome}! Estamos entrando em contato conforme combinado."
  ],
  "pipelineId": "pipeline-uuid",
  "workspaceId": "workspace-uuid",
  "customerIds": [
    "customer1-uuid",
    "customer2-uuid",
    "customer3-uuid"
  ],
  "messageDelaySeconds": 60
}
```

---

## 🎓 Conclusão

A API de Disparo em Massa oferece um sistema robusto e isolado para campanhas de WhatsApp em larga escala. Siga o fluxo documentado e as boas práticas para garantir entregas bem-sucedidas e evitar bloqueios por spam.

**Fluxo Resumido**:
1. Criar → 2. Verificar → 3. Iniciar → 4. Monitorar → 5. (Opcional) Pausar/Retentar → 6. Finalizado

Para dúvidas ou problemas, consulte os logs da aplicação e os status retornados pelas APIs.
