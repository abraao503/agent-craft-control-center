# API de Fila de Mensagens

Este documento especifica as rotas da API backend para gerenciar filas de mensagens (Message Queues) associadas a pipelines. As filas de mensagens controlam o envio agendado e processamento de mensagens para clientes.

## Índice

- [Visão Geral](#visão-geral)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Rotas Disponíveis](#rotas-disponíveis)
  - [1. Buscar Fila de Pipeline](#1-buscar-fila-de-pipeline)
  - [2. Buscar Mensagens da Fila (Paginado)](#2-buscar-mensagens-da-fila-paginado)
  - [3. Atualizar Configurações da Fila](#3-atualizar-configurações-da-fila)
  - [4. Pausar Fila](#4-pausar-fila)
  - [5. Retomar Fila](#5-retomar-fila)
- [Modelos de Dados](#modelos-de-dados)
- [Códigos de Status HTTP](#códigos-de-status-http)
- [Tratamento de Erros](#tratamento-de-erros)

## Visão Geral

As filas de mensagens permitem o processamento controlado e agendado de mensagens enviadas através de pipelines. Cada pipeline possui uma fila de mensagens associada que pode ser configurada com diferentes parâmetros de temporização e controle de ativação.

### Recursos Principais

- **Visualização de Fila**: Obter informações sobre a fila de um pipeline
- **Listagem Paginada**: Listar mensagens pendentes na fila com paginação
- **Configuração**: Ajustar delay entre mensagens e status de ativação
- **Controle de Ativação**: Pausar e retomar processamento da fila

## Autenticação e Autorização

Todas as rotas requerem autenticação via token JWT e validação de permissões.

### Headers Obrigatórios

```
Authorization: Bearer <JWT_TOKEN>
```

### Permissões Necessárias

| Rota | Permissão Requerida |
|------|-------------------|
| GET /pipeline/:pipelineId/message-queue | `view:pipeline` |
| GET /pipeline/message-queues/:messageQueueId/messages | `view:pipeline` |
| PATCH /pipeline/:pipelineId/message-queue | `update:pipeline` |
| POST /pipeline/:pipelineId/message-queue/pause | `update:pipeline` |
| POST /pipeline/:pipelineId/message-queue/resume | `update:pipeline` |

### Validação de Empresa

Todas as operações validam que o recurso pertence à empresa (`companyId`) do usuário autenticado. Tentativas de acessar recursos de outras empresas retornam erro `401 Unauthorized`.

## Rotas Disponíveis

### 1. Buscar Fila de Pipeline

Retorna informações sobre a fila de mensagens de um pipeline específico.

#### Endpoint

```
GET /pipeline/:pipelineId/message-queue
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `pipelineId` | string (UUID) | Sim | ID do pipeline |

#### Validação de Entrada

- `pipelineId`: Deve ser um UUID válido

#### Resposta de Sucesso (200 OK)

```json
{
  "queue": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Fila Pipeline Vendas",
    "delaySeconds": 60,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  },
  "pipeline": {
    "name": "Pipeline de Vendas"
  },
  "totalMessages": 45
}
```

#### Campos de Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `queue.id` | string | ID único da fila |
| `queue.name` | string | Nome da fila de mensagens |
| `queue.delaySeconds` | number | Tempo de espera entre mensagens (em segundos) |
| `queue.isActive` | boolean | Se a fila está ativa (processando mensagens) |
| `queue.createdAt` | string (ISO 8601) | Data de criação da fila |
| `queue.updatedAt` | string (ISO 8601) | Data da última atualização |
| `pipeline.name` | string | Nome do pipeline associado |
| `totalMessages` | number | Total de mensagens pendentes na fila |

#### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | `pipelineId` inválido (não é UUID) |
| 401 | Unauthorized | Token inválido ou ausente |
| 403 | Forbidden | Usuário sem permissão `view:pipeline` |
| 404 | Not Found | Pipeline ou MessageQueue não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

---

### 2. Buscar Mensagens da Fila (Paginado)

Retorna lista paginada de mensagens em uma fila específica, incluindo mensagens pendentes, agendadas, em envio, enviadas e com falha.

**Ordenação:** Por `createdAt` descendente (mais recentes primeiro).

#### Endpoint

```
GET /pipeline/message-queues/:messageQueueId/messages
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `messageQueueId` | string (UUID) | Sim | ID da fila de mensagens |

#### Parâmetros de Query String

| Parâmetro | Tipo | Obrigatório | Padrão | Validação | Descrição |
|-----------|------|-------------|--------|-----------|-----------|
| `page` | number | Não | 1 | min: 1 | Número da página |
| `limit` | number | Não | 10 | min: 1, max: 100 | Quantidade de itens por página |

#### Validação de Entrada

- `messageQueueId`: Deve ser um UUID válido
- `page`: Número inteiro >= 1 (convertido automaticamente de string)
- `limit`: Número inteiro entre 1 e 100 (convertido automaticamente de string)

#### Exemplo de Requisição

```
GET /pipeline/message-queues/123e4567-e89b-12d3-a456-426614174000/messages?page=1&limit=20
```

#### Resposta de Sucesso (200 OK)

```json
{
  "items": [
    {
      "id": "msg-123e4567-e89b-12d3-a456-426614174001",
      "content": "Olá! Temos uma proposta especial para você.",
      "customer": {
        "name": "João Silva",
        "phone": "5511999999999"
      },
      "status": "PENDING",
      "sendAt": "2024-01-15T15:30:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "deal": {
        "title": "Venda Produto X"
      },
      "attemptNumber": 1
    },
    {
      "id": "msg-223e4567-e89b-12d3-a456-426614174002",
      "content": "Lembrando sobre nossa conversa anterior.",
      "customer": {
        "name": null,
        "phone": "5511988888888"
      },
      "status": "PENDING",
      "sendAt": null,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "deal": null,
      "attemptNumber": 2
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 45,
  "totalPages": 3
}
```

#### Campos de Resposta

##### Objeto de Paginação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `items` | array | Lista de mensagens na página atual |
| `page` | number | Número da página atual |
| `limit` | number | Quantidade de itens por página |
| `total` | number | Total de mensagens na fila |
| `totalPages` | number | Total de páginas disponíveis |

##### Objeto de Mensagem (item)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único da mensagem |
| `content` | string | Conteúdo/texto da mensagem |
| `customer.name` | string \| null | Nome do cliente destinatário |
| `customer.phone` | string | Telefone do cliente (formato: DDI+DDD+número) |
| `status` | string | Status da mensagem em lowercase (ex: pending, sent, failed, scheduled) |
| `sendAt` | string (ISO 8601) \| null | Data agendada para envio (null se não agendado) |
| `createdAt` | string (ISO 8601) | Data de criação da mensagem |
| `deal` | object \| null | Informações do deal associado (null se não houver) |
| `deal.title` | string | Título do deal |
| `attemptNumber` | number \| undefined | Número da tentativa de envio (opcional) |

#### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | `messageQueueId` inválido ou parâmetros de paginação inválidos |
| 401 | Unauthorized | Token inválido ou fila pertence a outra empresa |
| 403 | Forbidden | Usuário sem permissão `view:pipeline` |
| 404 | Not Found | MessageQueue não encontrada |
| 500 | Internal Server Error | Erro interno do servidor |

---

### 3. Atualizar Configurações da Fila

Atualiza configurações da fila de mensagens de um pipeline.

#### Endpoint

```
PATCH /pipeline/:pipelineId/message-queue
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `pipelineId` | string (UUID) | Sim | ID do pipeline |

#### Corpo da Requisição (JSON)

| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|-------------|-----------|-----------|
| `delaySeconds` | number | Não* | int, min: 10, max: 3600 | Delay entre mensagens em segundos |
| `isActive` | boolean | Não* | - | Se a fila está ativa |

**\*Nota**: Pelo menos um dos campos deve ser fornecido.

#### Validação de Entrada

- `pipelineId`: Deve ser um UUID válido
- `delaySeconds`: Número inteiro entre 10 e 3600 (10 segundos a 1 hora)
- `isActive`: Booleano (true ou false)
- Pelo menos um campo (`delaySeconds` ou `isActive`) deve estar presente

#### Exemplo de Requisição

```json
{
  "delaySeconds": 120,
  "isActive": true
}
```

Ou apenas um campo:

```json
{
  "delaySeconds": 60
}
```

#### Resposta de Sucesso (200 OK)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Fila Pipeline Vendas",
  "delaySeconds": 120,
  "isActive": true,
  "pipelineId": "pipeline-123e4567-e89b-12d3-a456-426614174000",
  "updatedAt": "2024-01-15T15:45:00.000Z"
}
```

#### Campos de Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único da fila |
| `name` | string | Nome da fila de mensagens |
| `delaySeconds` | number | Novo delay entre mensagens (em segundos) |
| `isActive` | boolean | Novo status de ativação da fila |
| `pipelineId` | string | ID do pipeline associado |
| `updatedAt` | string (ISO 8601) | Data e hora da atualização |

#### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | Parâmetros inválidos (ex: delay fora do intervalo 10-3600, nenhum campo fornecido) |
| 401 | Unauthorized | Token inválido ou pipeline pertence a outra empresa |
| 403 | Forbidden | Usuário sem permissão `update:pipeline` |
| 404 | Not Found | Pipeline ou MessageQueue não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

---

### 4. Pausar Fila

Pausa o processamento de uma fila de mensagens (define `isActive` como `false`).

#### Endpoint

```
POST /pipeline/:pipelineId/message-queue/pause
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `pipelineId` | string (UUID) | Sim | ID do pipeline |

#### Validação de Entrada

- `pipelineId`: Deve ser um UUID válido

#### Corpo da Requisição

Nenhum corpo necessário.

#### Resposta de Sucesso (200 OK)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Fila Pipeline Vendas",
  "delaySeconds": 60,
  "isActive": false,
  "pipelineId": "pipeline-123e4567-e89b-12d3-a456-426614174000",
  "updatedAt": "2024-01-15T16:00:00.000Z"
}
```

#### Campos de Resposta

Mesma estrutura da rota de atualização, com `isActive` sempre `false`.

#### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | `pipelineId` inválido (não é UUID) |
| 401 | Unauthorized | Token inválido ou pipeline pertence a outra empresa |
| 403 | Forbidden | Usuário sem permissão `update:pipeline` |
| 404 | Not Found | Pipeline ou MessageQueue não encontrado |
| 500 | Internal Server Error | Erro ao pausar fila |

---

### 5. Retomar Fila

Retoma o processamento de uma fila de mensagens pausada (define `isActive` como `true`).

#### Endpoint

```
POST /pipeline/:pipelineId/message-queue/resume
```

#### Parâmetros de Rota

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `pipelineId` | string (UUID) | Sim | ID do pipeline |

#### Validação de Entrada

- `pipelineId`: Deve ser um UUID válido

#### Corpo da Requisição

Nenhum corpo necessário.

#### Resposta de Sucesso (200 OK)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Fila Pipeline Vendas",
  "delaySeconds": 60,
  "isActive": true,
  "pipelineId": "pipeline-123e4567-e89b-12d3-a456-426614174000",
  "updatedAt": "2024-01-15T16:05:00.000Z"
}
```

#### Campos de Resposta

Mesma estrutura da rota de atualização, com `isActive` sempre `true`.

#### Erros Possíveis

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | Bad Request | `pipelineId` inválido (não é UUID) |
| 401 | Unauthorized | Token inválido ou pipeline pertence a outra empresa |
| 403 | Forbidden | Usuário sem permissão `update:pipeline` |
| 404 | Not Found | Pipeline ou MessageQueue não encontrado |
| 500 | Internal Server Error | Erro ao retomar fila |

---

## Modelos de Dados

### MessageQueue (Fila de Mensagens)

Modelo principal que representa uma fila de mensagens.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string (UUID) | Identificador único da fila |
| `name` | string | Nome descritivo da fila |
| `delaySeconds` | number | Intervalo em segundos entre o envio de mensagens |
| `isActive` | boolean | Indica se a fila está processando mensagens |
| `pipelineId` | string (UUID) | ID do pipeline ao qual a fila pertence |
| `createdAt` | Date | Data de criação da fila |
| `updatedAt` | Date | Data da última atualização |

### QueuedMessage (Mensagem Enfileirada)

Representa uma mensagem pendente na fila.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | Identificador único da mensagem |
| `content` | string | Conteúdo textual da mensagem |
| `status` | string | Status atual (PENDING, SENT, FAILED, etc.) |
| `sendAt` | Date \| null | Data/hora agendada para envio (null = enviar assim que possível) |
| `attemptNumber` | number | Número da tentativa de envio |
| `messageQueueId` | string (UUID) | ID da fila à qual pertence |
| `customerId` | string (UUID) | ID do cliente destinatário |
| `dealId` | string (UUID) \| null | ID do deal associado (opcional) |
| `createdAt` | Date | Data de criação da mensagem |

### Pagination<T> (Interface de Paginação)

Interface genérica para respostas paginadas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `items` | T[] | Array de itens da página atual |
| `page` | number | Número da página atual |
| `limit` | number | Quantidade de itens por página |
| `total` | number | Total de itens disponíveis |
| `totalPages` | number | Total de páginas (calculado: ceil(total / limit)) |

---

## Códigos de Status HTTP

### Sucesso

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 OK | Requisição bem-sucedida | Retorno de dados, atualizações |

### Erros do Cliente

| Código | Significado | Uso |
|--------|-------------|-----|
| 400 Bad Request | Parâmetros inválidos | Validação falhou (UUID inválido, valores fora do intervalo) |
| 401 Unauthorized | Não autorizado | Token ausente, inválido ou recurso de outra empresa |
| 403 Forbidden | Acesso negado | Usuário sem permissões necessárias |
| 404 Not Found | Recurso não encontrado | Pipeline ou MessageQueue não existe |

### Erros do Servidor

| Código | Significado | Uso |
|--------|-------------|-----|
| 500 Internal Server Error | Erro interno | Falha inesperada no servidor |

---

## Tratamento de Erros

Todas as rotas seguem o mesmo padrão de tratamento de erros.

### Formato de Resposta de Erro

Erros retornam status HTTP apropriado e uma mensagem descritiva:

```json
{
  "statusCode": 404,
  "message": "Pipeline not found",
  "error": "Not Found"
}
```

### Erros Comuns

#### 1. Token Ausente ou Inválido

**Status**: 401 Unauthorized

**Causa**: Header `Authorization` ausente ou token JWT inválido/expirado.

**Ação**: Verificar se o token está sendo enviado corretamente e se não expirou.

---

#### 2. Permissões Insuficientes

**Status**: 403 Forbidden

**Causa**: Usuário não possui a permissão necessária (`view:pipeline` ou `update:pipeline`).

**Ação**: Verificar as permissões do usuário no sistema de roles/permissões.

---

#### 3. Recurso de Outra Empresa

**Status**: 401 Unauthorized

**Causa**: Tentativa de acessar recurso que pertence a outra empresa.

**Ação**: Validar que o ID do recurso pertence à empresa do usuário autenticado.

---

#### 4. UUID Inválido

**Status**: 400 Bad Request

**Mensagem**: "Invalid message queue ID format" ou "Pipeline ID deve ser um UUID válido"

**Causa**: Parâmetro de rota não é um UUID válido.

**Ação**: Validar formato UUID antes de enviar requisição.

---

#### 5. Parâmetros de Paginação Inválidos

**Status**: 400 Bad Request

**Causa**: `page` < 1 ou `limit` < 1 ou `limit` > 100.

**Ação**: Ajustar parâmetros para valores válidos.

---

#### 6. Delay Fora do Intervalo

**Status**: 400 Bad Request

**Mensagem**: "Delay mínimo é 10 segundos" ou "Delay máximo é 3600 segundos (1 hora)"

**Causa**: `delaySeconds` < 10 ou > 3600.

**Ação**: Ajustar valor de `delaySeconds` para intervalo válido (10-3600).

---

#### 7. Nenhum Campo Fornecido para Atualização

**Status**: 400 Bad Request

**Mensagem**: "Pelo menos um campo (delaySeconds ou isActive) deve ser fornecido"

**Causa**: Requisição PATCH sem `delaySeconds` nem `isActive`.

**Ação**: Fornecer pelo menos um dos campos para atualização.

---

#### 8. Pipeline ou MessageQueue Não Encontrado

**Status**: 404 Not Found

**Mensagem**: "Pipeline not found" ou "MessageQueue not found"

**Causa**: ID fornecido não existe no banco de dados.

**Ação**: Verificar se o ID está correto e se o recurso existe.

---

## Notas Técnicas

### 1. Conversão Automática de Query Parameters

Os parâmetros `page` e `limit` são automaticamente convertidos de string para number pelo Zod com `z.coerce.number()`.

### 2. Valores Padrão

- `page`: Padrão 1 se não fornecido
- `limit`: Padrão 10 se não fornecido (máximo 100)

### 3. Validação de Empresa (companyId)

Todas as operações validam internamente que o recurso pertence ao `companyId` extraído do token JWT. Não é necessário enviar `companyId` nas requisições.

### 4. Status de Mensagens

Os status possíveis para mensagens incluem (mas não se limitam a):
- `pending`: Aguardando envio
- `sent`: Enviada com sucesso
- `failed`: Falha no envio
- `scheduled`: Agendada para envio futuro

**Nota:** Os valores de status são retornados em **lowercase** pela API.

### 5. Ordenação de Mensagens

A listagem de mensagens retorna todas as mensagens (independente do status) ordenadas por `createdAt` em ordem **descendente** (mais recentes primeiro). Isso permite visualizar o histórico completo de mensagens da fila.

### 6. Delay da Fila

O `delaySeconds` controla o intervalo mínimo entre o envio de mensagens consecutivas. Isso evita sobrecarga e melhora a taxa de entrega.

### 7. Fila Pausada

Quando `isActive` é `false`, nenhuma mensagem é processada até que a fila seja retomada. Mensagens continuam pendentes na fila.

### 8. Formato de Telefone

Telefones são armazenados no formato internacional completo: DDI + DDD + número (ex: "5511999999999").

---

## Arquitetura de Implementação

### Localização dos Arquivos

```
/apps/api/src/app/modules/pipeline/
├── contracts/
│   ├── get-pipeline-queue.contract.ts
│   ├── get-queue-messages.contract.ts
│   └── update-pipeline-queue.contract.ts
├── controllers/
│   ├── get-pipeline-queue.controller.ts
│   ├── get-queue-messages.controller.ts
│   ├── update-pipeline-queue.controller.ts
│   ├── pause-pipeline-queue.controller.ts
│   └── resume-pipeline-queue.controller.ts
├── dtos/
│   ├── get-pipeline-queue.dto.ts
│   ├── get-queue-messages.dto.ts
│   └── update-pipeline-queue.dto.ts
└── services/
    ├── get-pipeline-queue.service.ts
    ├── get-queue-messages.service.ts
    └── update-pipeline-queue.service.ts
```

### Repositórios Utilizados

Os services utilizam os seguintes repositories de `@agent/repositories`:

- `PrismaPipelineRepository`: Operações relacionadas a pipelines
- `PrismaMessageQueueRepository`: Operações de filas de mensagens e mensagens enfileiradas

### Padrão de Arquitetura

Todas as rotas seguem o padrão descrito em `ARQUITETURA_API.md`:

1. **Controller**: Recebe requisição HTTP, valida entrada, chama service
2. **DTO**: Define e valida estrutura de entrada com Zod
3. **Service**: Implementa lógica de negócio, chama repositories
4. **Contract**: Define tipos de entrada/saída do service
5. **Repository**: Acessa banco de dados via Prisma

---

## Changelog

### Versão 1.0 (2024-01-15)

- Documentação inicial das rotas de Message Queue
- Especificação completa de parâmetros, validações e respostas
- Inclusão de tratamento de erros e códigos HTTP
- Documentação de permissões e autenticação
