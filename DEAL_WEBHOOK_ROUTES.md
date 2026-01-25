# Deal Webhook Routes - Frontend Documentation

Este documento descreve todas as rotas de Deal Webhook disponíveis na API. As rotas CRUD requerem autenticação e permissões específicas, enquanto a rota de trigger é pública.

---

## Índice

1. [Criar Webhook](#criar-webhook)
2. [Listar Webhooks](#listar-webhooks)
3. [Obter Webhook](#obter-webhook)
4. [Atualizar Webhook](#atualizar-webhook)
5. [Deletar Webhook](#deletar-webhook)
6. [Disparar Webhook](#disparar-webhook)
7. [Listar Execuções de Webhook](#listar-execuções-de-webhook)

---

## Criar Webhook

Cria um novo webhook de deal para uma pipeline específica.

### Requisição

- **Método**: `POST`
- **URL**: `/deal-webhooks`
- **Autenticação**: Requerida (Bearer Token)
- **Permissão**: `create:pipeline`

### Body

```json
{
  "name": "string",
  "pipelineId": "uuid",
  "workspaceId": "uuid",
  "automation": {
    "sendWelcomeMessage": "boolean",
    "welcomeMessage": "string (opcional, obrigatório se sendWelcomeMessage for true)"
  }
}
```

#### Campos Obrigatórios

- `name`: Nome único do webhook (1-100 caracteres)
- `pipelineId`: ID da pipeline (formato UUID)
- `workspaceId`: ID do workspace (formato UUID)

#### Campos Opcionais

- `automation`: Configuração de automação
  - `sendWelcomeMessage`: Booleano para enviar mensagem de boas-vindas
  - `welcomeMessage`: Mensagem de boas-vindas (obrigatória se `sendWelcomeMessage` for `true`)

### Resposta

**Status 201 (Created)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "token": "string (token único para disparar o webhook)",
    "webhookUrl": "string"
  }
}
```

### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | Dados de entrada inválidos |
| 401 | Unauthorized | Token não fornecido ou inválido |
| 403 | Forbidden | Usuário sem permissão `create:pipeline` |
| 404 | Not Found | Pipeline ou workspace não encontrado |
| 409 | Conflict | Nome do webhook já existe para esta empresa |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Listar Webhooks

Lista todos os webhooks da empresa com paginação, opcionalmente filtrados por pipeline e workspace.

### Requisição

- **Método**: `GET`
- **URL**: `/deal-webhooks`
- **Autenticação**: Requerida (Bearer Token)
- **Permissão**: `view:pipeline`

### Query Parameters

```
GET /deal-webhooks?workspaceId=uuid&pipelineId=uuid&page=1&limit=10
```

#### Campos Opcionais

- `workspaceId`: Filtrar por workspace (formato UUID)
- `pipelineId`: Filtrar por pipeline (formato UUID)
- `page`: Número da página (padrão: 1, mínimo: 1)
- `limit`: Quantidade de itens por página (padrão: 10, mínimo: 1, máximo: 100)

### Resposta

**Status 200 (OK)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "token": "string",
        "pipelineId": "uuid",
        "workspaceId": "uuid",
        "status": "ACTIVE | INACTIVE",
        "webhookUrl": "string",
        "automation": {
          "sendWelcomeMessage": "boolean"
        },
        "createdAt": "ISO 8601 timestamp",
        "updatedAt": "ISO 8601 timestamp"
      }
    ],
    "total": "number (total de registros)",
    "page": "number (página atual)",
    "limit": "number (itens por página)",
    "totalPages": "number (total de páginas)"
  }
}
```

### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | IDs de workspace ou pipeline inválidos |
| 401 | Unauthorized | Token não fornecido ou inválido |
| 403 | Forbidden | Usuário sem permissão `view:pipeline` |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Obter Webhook

Obtém os detalhes de um webhook específico.

### Requisição

- **Método**: `GET`
- **URL**: `/deal-webhooks/{id}`
- **Autenticação**: Requerida (Bearer Token)
- **Permissão**: `view:pipeline`

#### Path Parameters

- `id`: ID do webhook (formato UUID)

### Resposta

**Status 200 (OK)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "token": "string",
    "pipelineId": "uuid",
    "workspaceId": "uuid",
    "companyId": "uuid",
    "status": "ACTIVE | INACTIVE",
    "webhookUrl": "string",
    "automation": {
      "sendWelcomeMessage": "boolean",
      "welcomeMessage": "string"
    },
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | ID do webhook inválido |
| 401 | Unauthorized | Token não fornecido ou inválido |
| 403 | Forbidden | Usuário sem permissão `view:pipeline` |
| 404 | Not Found | Webhook não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Atualizar Webhook

Atualiza as informações de um webhook existente.

### Requisição

- **Método**: `PATCH`
- **URL**: `/deal-webhooks/{id}`
- **Autenticação**: Requerida (Bearer Token)
- **Permissão**: `update:pipeline`

#### Path Parameters

- `id`: ID do webhook (formato UUID)

### Body

```json
{
  "name": "string (opcional)",
  "status": "ACTIVE | INACTIVE (opcional)",
  "automation": {
    "sendWelcomeMessage": "boolean",
    "welcomeMessage": "string (opcional, obrigatório se sendWelcomeMessage for true)"
  }
}
```

#### Campos Opcionais

- `name`: Novo nome do webhook (1-100 caracteres)
- `status`: Novo status do webhook
- `automation`: Nova configuração de automação

### Resposta

**Status 200 (OK)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "status": "ACTIVE | INACTIVE",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | ID do webhook ou dados inválidos |
| 401 | Unauthorized | Token não fornecido ou inválido |
| 403 | Forbidden | Usuário sem permissão `update:pipeline` |
| 404 | Not Found | Webhook não encontrado |
| 409 | Conflict | Novo nome já existe para outro webhook |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Deletar Webhook

Deleta um webhook existente.

### Requisição

- **Método**: `DELETE`
- **URL**: `/deal-webhooks/{id}`
- **Autenticação**: Requerida (Bearer Token)
- **Permissão**: `delete:pipeline`

#### Path Parameters

- `id`: ID do webhook (formato UUID)

### Resposta

**Status 204 (No Content)**

Sem corpo de resposta.

### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | ID do webhook inválido |
| 401 | Unauthorized | Token não fornecido ou inválido |
| 403 | Forbidden | Usuário sem permissão `delete:pipeline` |
| 404 | Not Found | Webhook não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Disparar Webhook

Dispara um webhook de deal de forma pública (sem autenticação). Esta rota cria um novo deal e enfileira o processamento.

### Requisição

- **Método**: `POST`
- **URL**: `/webhooks/deals/{token}`
- **Autenticação**: Não requerida (Pública)
- **Token**: Token único do webhook (obtido ao criar o webhook)

#### Path Parameters

- `token`: Token único do webhook (string, mínimo 1 caractere)

### Body

```json
{
  "pipelineId": "uuid",
  "currentStageId": "uuid",
  "title": "string",
  "description": "string (opcional)",
  "value": "number (opcional, mínimo 0)",
  "customerName": "string (opcional)",
  "customerPhone": "string (11 dígitos, formato XX9NNNNNNNN)",
  "customerEmail": "string (opcional, formato de email válido)"
}
```

#### Campos Obrigatórios

- `pipelineId`: ID da pipeline (formato UUID)
- `currentStageId`: ID do estágio atual (formato UUID)
- `title`: Título do deal (mínimo 1 caractere)
- `customerPhone`: Telefone do cliente (11 dígitos, formato: XX9NNNNNNNN)

#### Campos Opcionais

- `description`: Descrição do deal
- `value`: Valor do deal (número não-negativo)
- `customerName`: Nome do cliente
- `customerEmail`: Email do cliente (deve ser um email válido)

### Resposta

**Status 202 (Accepted)**

```json
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "message": "Webhook received and queued for processing"
  }
}
```

### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | Dados de entrada inválidos (telefone inválido, email inválido, etc) |
| 403 | Forbidden | Webhook inativo (status = INACTIVE) |
| 404 | Not Found | Webhook não encontrado com o token fornecido |
| 409 | Conflict | Pipeline do webhook não corresponde à pipeline enviada no payload |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Paginação

A rota de listagem (`GET /deal-webhooks`) utiliza paginação para melhorar a performance quando há muitos webhooks cadastrados.

### Parâmetros de Paginação

- `page`: Número da página (começa em 1)
  - Padrão: 1
  - Mínimo: 1
  - Tipo: number

- `limit`: Quantidade de itens por página
  - Padrão: 10
  - Mínimo: 1
  - Máximo: 100
  - Tipo: number

### Estrutura da Resposta Paginada

```json
{
  "success": true,
  "data": {
    "items": [/* array de webhooks */],
    "total": 45,           // Total de registros no banco
    "page": 2,             // Página atual
    "limit": 10,           // Itens por página
    "totalPages": 5        // Total de páginas disponíveis
  }
}
```

### Exemplos de Uso

**Primeira página (10 itens):**
```
GET /deal-webhooks?page=1&limit=10
```

**Segunda página (20 itens por página):**
```
GET /deal-webhooks?page=2&limit=20
```

**Filtrar por pipeline com paginação:**
```
GET /deal-webhooks?pipelineId=abc-123&page=1&limit=15
```

### Cálculo de Páginas

Para calcular o número total de páginas no frontend:

```
totalPages = Math.ceil(total / limit)
```

Essa informação já vem calculada no campo `totalPages` da resposta.

---

## Estrutura de Resposta Padrão

Todas as respostas da API seguem este padrão:

### Sucesso

```json
{
  "success": true,
  "data": {
    // Dados específicos da operação
  }
}
```

### Erro

```json
{
  "success": false,
  "error": "string com descrição do erro"
}
```

---

## Valores de Enumeração

### DealWebhookStatus

- `ACTIVE`: Webhook ativo e pronto para receber requisições
- `INACTIVE`: Webhook desativado (rejeita requisições de disparo)

---

## Notas Importantes

1. **Token do Webhook**: Cada webhook gerado possui um token único que é usado para disparar o webhook publicamente. Este token não pode ser alterado após a criação.

2. **Permissões**: As permissões utilizam o padrão de pipeline (`create:pipeline`, `view:pipeline`, `update:pipeline`, `delete:pipeline`), não há permissões específicas para deal-webhooks.

3. **Empresa**: O campo `companyId` é extraído automaticamente do token de autenticação. Cada webhook pertence à empresa do usuário autenticado.

4. **Soft Delete**: Webhooks deletados são marcados com `deletedAt` e não aparecem em listagens, mas não são removidos do banco de dados.

5. **Webhook URL**: A URL pública para disparar o webhook é constructa automaticamente e retornada nas respostas (`${apiUrl}/webhooks/deals/${token}`).

6. **Automação**: A configuração de automação permite enviar uma mensagem de boas-vindas automaticamente quando um deal é criado através do webhook.

7. **Fila de Processamento**: Quando um webhook é disparado, o deal é enfileirado para processamento assíncrono usando BullMQ.

---

## Exemplos de Fluxo

### Criar e Disparar um Webhook

1. **POST `/deal-webhooks`** - Criar webhook
   - Retorna: `webhookUrl` e `token`

2. **POST `/webhooks/deals/{token}`** - Disparar webhook
   - Usa a URL retornada na etapa 1
   - Deal é criado e enfileirado para processamento

### Listar e Atualizar Webhooks

1. **GET `/deal-webhooks?pipelineId=xyz`** - Listar webhooks de uma pipeline

2. **PATCH `/deal-webhooks/{id}`** - Atualizar configurações do webhook

3. **GET `/deal-webhooks/{id}`** - Obter detalhes do webhook atualizado

---

## Listar Execuções de Webhook

Lista todas as execuções de um webhook específico com paginação e filtros.

### Requisição

- **Método**: `GET`
- **URL**: `/deal-webhooks/{webhookId}/executions`
- **Autenticação**: Requerida (Bearer Token)
- **Permissão**: `view:pipeline`

#### Path Parameters

- `webhookId`: ID do webhook (formato UUID)

### Query Parameters

```
GET /deal-webhooks/{webhookId}/executions?page=1&limit=10&status=success
```

#### Campos Opcionais

- `page`: Número da página (padrão: 1, mínimo: 1)
- `limit`: Quantidade de itens por página (padrão: 10, mínimo: 1, máximo: 100)
- `status`: Filtrar por status da execução (valores válidos abaixo)

#### Valores Válidos para Status

- `pending`: Execução aguardando processamento
- `processing`: Execução em processamento
- `success`: Execução concluída com sucesso
- `success_with_warnings`: Deal criado com sucesso, mas automações falharam
- `failed`: Execução falhou

### Resposta

**Status 200 (OK)**

```json
{
  "items": [
    {
      "id": "uuid",
      "dealWebhookId": "uuid",
      "dealId": "uuid | null",
      "status": "pending | processing | success | success_with_warnings | failed",
      "payload": {
        "pipelineId": "uuid",
        "currentStageId": "uuid",
        "title": "string",
        "description": "string",
        "value": "number",
        "customerName": "string",
        "customerPhone": "string",
        "customerEmail": "string"
      },
      "errorMessage": "string | null",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Campos da Resposta

#### Campos de Cada Execução

- `id`: ID único da execução
- `dealWebhookId`: ID do webhook que recebeu a requisição
- `dealId`: ID do deal criado (null se a criação falhou)
- `status`: Status atual da execução
- `payload`: Dados enviados na requisição que disparou o webhook
- `errorMessage`: Mensagem de erro (null se não houve erro)
- `createdAt`: Data/hora em que a execução foi criada
- `updatedAt`: Data/hora da última atualização

#### Campos de Paginação

- `total`: Total de execuções encontradas
- `page`: Página atual
- `limit`: Quantidade de itens por página
- `totalPages`: Total de páginas disponíveis

### Status das Execuções

#### `pending` (Pendente)
- Webhook recebido, aguardando início do processamento
- Deal ainda não foi criado

#### `processing` (Processando)
- Execução em andamento
- Deal pode estar sendo criado ou automações sendo executadas

#### `success` (Sucesso)
- Deal criado com sucesso
- Todas as automações executadas com sucesso (se configuradas)

#### `success_with_warnings` (Sucesso com Avisos)
- Deal criado com sucesso
- Uma ou mais automações falharam
- O `errorMessage` contém detalhes sobre as automações que falharam
- **Importante**: Não é um erro crítico, o deal foi criado

#### `failed` (Falhou)
- Deal não foi criado
- Erro crítico no processamento
- O `errorMessage` contém detalhes do erro

### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | ID do webhook ou parâmetros de query inválidos |
| 401 | Unauthorized | Token não fornecido ou inválido |
| 403 | Forbidden | Usuário sem permissão `view:pipeline` |
| 404 | Not Found | Webhook não encontrado |
| 500 | Internal Server Error | Erro ao listar execuções |

### Exemplos de Uso

**Listar todas as execuções (primeira página):**
```
GET /deal-webhooks/abc-123-def/executions?page=1&limit=10
```

**Listar apenas execuções com sucesso:**
```
GET /deal-webhooks/abc-123-def/executions?status=success
```

**Listar execuções que falharam:**
```
GET /deal-webhooks/abc-123-def/executions?status=failed
```

**Listar execuções com avisos (deal criado mas automações falharam):**
```
GET /deal-webhooks/abc-123-def/executions?status=success_with_warnings
```

**Listar 20 execuções por página:**
```
GET /deal-webhooks/abc-123-def/executions?page=1&limit=20
```

### Ordenação

As execuções são sempre retornadas ordenadas da **mais recente para a mais antiga** (por `createdAt DESC`).

### Tratamento de Erros Tipados

O campo `errorMessage` contém um objeto JSON serializado com informações estruturadas sobre o erro:

```json
{
  "code": "DEAL_ALREADY_EXISTS",
  "message": "Deal already exists for this customer in this pipeline",
  "metadata": {
    "customerId": "uuid",
    "pipelineId": "uuid"
  },
  "isRecoverable": false
}
```

#### Códigos de Erro Comuns

**Erros de Processamento de Deal:**
- `DEAL_ALREADY_EXISTS`: Cliente já possui deal na pipeline
- `PIPELINE_NOT_FOUND`: Pipeline não encontrada
- `PIPELINE_STAGE_NOT_FOUND`: Estágio da pipeline não encontrado
- `PIPELINE_STAGE_MISMATCH`: Estágio não pertence à pipeline
- `CUSTOMER_CREATION_FAILED`: Erro ao criar/buscar cliente
- `DEAL_CREATION_FAILED`: Erro ao criar deal
- `INTERNAL_ERROR`: Erro interno não categorizado

**Erros de Automação (resultam em `success_with_warnings`):**
- `DEAL_NOT_FOUND`: Deal não encontrado para enviar automação
- `WHATSAPP_INTEGRATION_NOT_CONFIGURED`: Integração WhatsApp não configurada
- `CHAT_CREATION_FAILED`: Erro ao criar chat
- `MESSAGE_SEND_FAILED`: Erro ao enviar mensagem
- `MESSAGE_RECORD_FAILED`: Erro ao registrar mensagem no banco

### Diferença entre `success_with_warnings` e `failed`

É importante entender a diferença entre estes dois status:

**`success_with_warnings`:**
- ✅ Deal foi criado com sucesso
- ❌ Automações (mensagem de boas-vindas) falharam
- 💡 O objetivo principal (criar deal) foi alcançado
- 🔧 Usuário pode disparar automações manualmente depois

**`failed`:**
- ❌ Deal não foi criado
- ❌ Erro crítico no processamento
- 💡 Nenhum recurso foi criado
- 🔧 Usuário precisa corrigir dados e disparar webhook novamente

### Casos de Uso no Frontend

#### Monitoramento de Webhooks
Liste todas as execuções para ver o histórico de disparos do webhook:
```typescript
const { items, total } = await api.get(`/deal-webhooks/${webhookId}/executions`);
```

#### Debug de Falhas
Filtre por `failed` para investigar o que deu errado:
```typescript
const failures = await api.get(`/deal-webhooks/${webhookId}/executions?status=failed`);
// Examinar errorMessage de cada execução
```

#### Monitorar Automações Problemáticas
Filtre por `success_with_warnings` para ver deals criados mas com automações com problemas:
```typescript
const warnings = await api.get(`/deal-webhooks/${webhookId}/executions?status=success_with_warnings`);
// Verificar quais automações estão falhando
```

#### Dashboard de Métricas
Combine diferentes filtros para criar dashboards:
```typescript
const [success, warnings, failed] = await Promise.all([
  api.get(`/deal-webhooks/${webhookId}/executions?status=success`),
  api.get(`/deal-webhooks/${webhookId}/executions?status=success_with_warnings`),
  api.get(`/deal-webhooks/${webhookId}/executions?status=failed`)
]);

const metrics = {
  totalSuccess: success.total,
  totalWarnings: warnings.total,
  totalFailed: failed.total,
  successRate: (success.total / (success.total + failed.total)) * 100
};
```

---

## Tratamento de Erros no Frontend

Recomenda-se implementar tratamento robusto de erros baseado nos status HTTP e mensagens de erro retornadas:

- **400**: Validar dados de entrada antes de enviar
- **401**: Renovar token de autenticação
- **403**: Informar ao usuário que não tem permissão
- **404**: Webhook pode ter sido deletado, recarregar lista
- **409**: Nome já existe ou pipeline não corresponde, informar ao usuário
- **500**: Exibir mensagem genérica e alertar suporte
