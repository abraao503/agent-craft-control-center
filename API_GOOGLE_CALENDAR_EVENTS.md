# API — Google Calendar Events

Documentação das rotas para gerenciamento de eventos no Google Calendar.

Todas as rotas requerem autenticação JWT. O `companyId` é extraído automaticamente do token do usuário.

**Base path:** `/google-calendar/events`

---

## Índice

- [Criar Evento](#1-criar-evento)
- [Atualizar Evento](#2-atualizar-evento)
- [Deletar Evento](#3-deletar-evento)

---

## 1. Criar Evento

Cria um novo evento no Google Calendar utilizando uma integração identificada pelo seu ID.

### Requisição

```
POST /google-calendar/events
```

**Headers**

| Header          | Valor                  | Obrigatório |
|-----------------|------------------------|-------------|
| `Authorization` | `Bearer <token>`       | ✅ Sim      |
| `Content-Type`  | `application/json`     | ✅ Sim      |

**Body (JSON)**

| Campo            | Tipo             | Obrigatório | Descrição                                                    |
|------------------|------------------|-------------|--------------------------------------------------------------|
| `integrationId`  | `string (UUID)`  | ✅ Sim      | ID da integração Google Calendar a ser utilizada             |
| `title`          | `string`         | ✅ Sim      | Título do evento                                             |
| `startDateTime`  | `string (ISO 8601)` | ✅ Sim   | Data/hora de início do evento (ex: `2026-03-10T10:00:00Z`)   |
| `endDateTime`    | `string (ISO 8601)` | ✅ Sim   | Data/hora de término do evento (ex: `2026-03-10T11:00:00Z`)  |
| `description`    | `string`         | ❌ Não      | Descrição do evento                                          |
| `timeZone`       | `string`         | ❌ Não      | Fuso horário (padrão: `America/Sao_Paulo`)                   |
| `location`       | `string`         | ❌ Não      | Local do evento                                              |
| `attendees`      | `string[]`       | ❌ Não      | Lista de e-mails dos participantes                           |
| `dealId`         | `string (UUID)`  | ❌ Não      | ID do deal associado ao evento                               |
| `customerId`     | `string (UUID)`  | ❌ Não      | ID do cliente associado ao evento                            |

**Exemplo de Body**

```json
{
  "integrationId": "b2e4a123-0000-4000-a000-000000000001",
  "title": "Reunião de Onboarding",
  "description": "Apresentação inicial ao produto",
  "startDateTime": "2026-03-10T14:00:00Z",
  "endDateTime": "2026-03-10T15:00:00Z",
  "timeZone": "America/Sao_Paulo",
  "location": "Google Meet",
  "attendees": ["cliente@exemplo.com"],
  "dealId": "a1b2c3d4-0000-4000-a000-000000000010"
}
```

### Resposta de Sucesso

**Status:** `201 Created`

```json
{
  "event": {
    "id": "evt-uuid",
    "googleEventId": "google_event_id",
    "title": "Reunião de Onboarding",
    "description": "Apresentação inicial ao produto",
    "startDateTime": "2026-03-10T14:00:00.000Z",
    "endDateTime": "2026-03-10T15:00:00.000Z",
    "location": "Google Meet",
    "attendees": ["cliente@exemplo.com"],
    "googleCalendarIntegrationId": "b2e4a123-0000-4000-a000-000000000001",
    "dealId": "a1b2c3d4-0000-4000-a000-000000000010",
    "customerId": null,
    "companyId": "company-uuid",
    "workspaceId": "workspace-uuid",
    "createdAt": "2026-03-09T10:00:00.000Z",
    "updatedAt": "2026-03-09T10:00:00.000Z",
    "deletedAt": null
  }
}
```

### Respostas de Erro

| Status | Erro                              | Causa                                                                 |
|--------|-----------------------------------|-----------------------------------------------------------------------|
| `400`  | `Start date must be before end date` | `startDateTime` é posterior ou igual a `endDateTime`               |
| `400`  | `Integration is not active`       | A integração existe mas está desativada                               |
| `404`  | `Integration not found`           | Nenhuma integração encontrada com o `integrationId` informado         |
| `404`  | `Deal not found`                  | O `dealId` informado não existe nessa empresa                         |
| `404`  | `Customer not found`              | O `customerId` informado não existe nessa empresa                     |
| `500`  | `Failed to create calendar event` | Erro interno (ex: falha na API do Google)                             |

---

## 2. Atualizar Evento

Atualiza parcialmente um evento existente no Google Calendar e no banco de dados. Todos os campos do body são opcionais — apenas os campos enviados serão atualizados.

### Requisição

```
PATCH /google-calendar/events/:id
```

**Headers**

| Header          | Valor                  | Obrigatório |
|-----------------|------------------------|-------------|
| `Authorization` | `Bearer <token>`       | ✅ Sim      |
| `Content-Type`  | `application/json`     | ✅ Sim      |

**Path Params**

| Parâmetro | Tipo            | Descrição            |
|-----------|-----------------|----------------------|
| `id`      | `string (UUID)` | ID do evento interno |

**Body (JSON)** — todos os campos são opcionais

| Campo           | Tipo              | Descrição                                                       |
|-----------------|-------------------|-----------------------------------------------------------------|
| `title`         | `string`          | Novo título do evento                                           |
| `description`   | `string`          | Nova descrição do evento                                        |
| `startDateTime` | `string (ISO 8601)` | Nova data/hora de início                                      |
| `endDateTime`   | `string (ISO 8601)` | Nova data/hora de término                                     |
| `timeZone`      | `string`          | Fuso horário para os campos de data (padrão: `America/Sao_Paulo`) |
| `location`      | `string`          | Novo local do evento                                            |
| `attendees`     | `string[]`        | Nova lista de e-mails dos participantes (substitui a lista existente) |

**Exemplo de Body**

```json
{
  "title": "Reunião de Onboarding — Atualizada",
  "startDateTime": "2026-03-10T15:00:00Z",
  "endDateTime": "2026-03-10T16:00:00Z",
  "attendees": ["cliente@exemplo.com", "suporte@empresa.com"]
}
```

### Resposta de Sucesso

**Status:** `200 OK`

```json
{
  "event": {
    "id": "evt-uuid",
    "googleEventId": "google_event_id",
    "title": "Reunião de Onboarding — Atualizada",
    "description": "Apresentação inicial ao produto",
    "startDateTime": "2026-03-10T15:00:00.000Z",
    "endDateTime": "2026-03-10T16:00:00.000Z",
    "location": "Google Meet",
    "attendees": ["cliente@exemplo.com", "suporte@empresa.com"],
    "googleCalendarIntegrationId": "b2e4a123-0000-4000-a000-000000000001",
    "companyId": "company-uuid",
    "workspaceId": "workspace-uuid",
    "createdAt": "2026-03-09T10:00:00.000Z",
    "updatedAt": "2026-03-09T12:00:00.000Z",
    "deletedAt": null
  }
}
```

### Respostas de Erro

| Status | Erro                              | Causa                                                                 |
|--------|-----------------------------------|-----------------------------------------------------------------------|
| `400`  | `Start date must be before end date` | `startDateTime` é posterior ou igual a `endDateTime`               |
| `400`  | `Integration is not active`       | A integração do evento está desativada                                |
| `404`  | `Event not found`                 | Nenhum evento encontrado com o `id` informado para esta empresa       |
| `404`  | `Integration not found`           | A integração associada ao evento não existe mais                      |
| `500`  | `Failed to update calendar event` | Erro interno (ex: falha na API do Google)                             |

---

## 3. Deletar Evento

Remove permanentemente um evento do Google Calendar e realiza um soft delete no banco de dados (define `deletedAt`).

### Requisição

```
DELETE /google-calendar/events/:id
```

**Headers**

| Header          | Valor            | Obrigatório |
|-----------------|------------------|-------------|
| `Authorization` | `Bearer <token>` | ✅ Sim      |

**Path Params**

| Parâmetro | Tipo            | Descrição            |
|-----------|-----------------|----------------------|
| `id`      | `string (UUID)` | ID do evento interno |

**Exemplo de Requisição**

```
DELETE /google-calendar/events/evt-uuid
Authorization: Bearer <token>
```

### Resposta de Sucesso

**Status:** `200 OK`

```json
null
```

### Respostas de Erro

| Status | Erro                              | Causa                                                                 |
|--------|-----------------------------------|-----------------------------------------------------------------------|
| `400`  | `Integration is not active`       | A integração associada ao evento está desativada                      |
| `404`  | `Event not found`                 | Nenhum evento encontrado com o `id` informado para esta empresa       |
| `404`  | `Integration not found`           | A integração associada ao evento não existe mais                      |
| `500`  | `Failed to delete calendar event` | Erro interno (ex: falha na API do Google)                             |

---

## Notas Gerais

- **Autenticação**: Todas as rotas requerem um token JWT válido. O `companyId` é extraído automaticamente do token.
- **`integrationId` no criar**: A integração é buscada diretamente por ID, sem necessidade de informar `workspaceId`. O `workspaceId` do evento é herdado da integração.
- **Atualização parcial**: O `PATCH /events/:id` atualiza apenas os campos enviados. Campos ausentes no body não são modificados.
- **Soft delete**: O `DELETE /events/:id` não exclui fisicamente o registro — ele define o campo `deletedAt` no banco. O evento também é removido do Google Calendar.
- **Refresh automático de token**: Todas as operações verificam e renovam o token de acesso OAuth2 automaticamente quando necessário.
