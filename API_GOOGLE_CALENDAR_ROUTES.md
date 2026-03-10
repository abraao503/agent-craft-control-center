# API — Rotas da Página de Calendários

Documentação das rotas HTTP utilizadas diretamente pela página de calendários.

---

## GET /google-calendar/auth-url

Gera a URL de autorização OAuth do Google para iniciar o fluxo de conexão.

**Permissão:** `manage:integrations`

**Query params:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `workspaceId` | string (UUID) | Sim |

**Resposta (200):**

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/auth?..."
}
```

**Erros:**

| Status | Mensagem |
|--------|----------|
| 500 | `Workspace not found` |
| 500 | `Integration already active` |
| 500 | `Failed to generate auth URL` |

---

## GET /google-calendar/callback

Rota de callback do OAuth do Google. Recebe o `code` e o `state` após a autorização. **Rota pública** (não requer autenticação). Ao concluir, redireciona o browser para `/settings/integrations?google_calendar=connected`.

**Query params:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `code` | string | Sim |
| `state` | string | Sim |

**Resposta (302):** Redirect para o frontend.

**Erros:**

| Status | Mensagem |
|--------|----------|
| 400 | `OAuth session not found or expired` |
| 400 | `Invalid authorization code` |
| 500 | Internal server error |

---

## GET /google-calendar/status

Retorna o status da integração Google Calendar do workspace.

**Query params:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `workspaceId` | string (UUID) | Sim |

**Resposta (200):**

```json
{
  "isConnected": true,
  "googleEmail": "usuario@gmail.com",
  "calendarId": "usuario@gmail.com"
}
```

**Erros:**

| Status | Mensagem |
|--------|----------|
| 500 | `Failed to get Google Calendar status` |

---

## GET /google-calendar/integrations

Lista todas as integrações Google Calendar do workspace.

**Permissão:** `view:integrations`

**Query params:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `workspaceId` | string (UUID) | Sim |

**Resposta (200):**

```json
{
  "items": [
    {
      "id": "a1b2c3d4-...",
      "workspaceId": "550e8400-...",
      "companyId": "660e8400-...",
      "googleEmail": "usuario@gmail.com",
      "calendarId": "usuario@gmail.com",
      "isActive": true,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

**Erros:**

| Status | Mensagem |
|--------|----------|
| 500 | `Failed to list Google Calendar integrations` |

---

## DELETE /google-calendar/disconnect

Desconecta (desativa) uma integração Google Calendar.

**Permissão:** `manage:integrations`

**Query params:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `integrationId` | string (UUID) | Sim |

**Resposta (200):** `null`

**Erros:**

| Status | Mensagem |
|--------|----------|
| 404 | `Integration not found` |
| 500 | `Failed to disconnect Google Calendar` |

---

## GET /google-calendar/:integrationId/events

Lista eventos do calendário de uma integração específica.

**Path params:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `integrationId` | string (UUID) | Sim |

**Query params:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `page` | number | Não | Default: `1` |
| `limit` | number (1–100) | Não | Default: `10` |
| `dealId` | string (UUID) | Não | Filtra por deal |
| `customerId` | string (UUID) | Não | Filtra por cliente |
| `startDate` | string (ISO 8601) | Não | Data de início do filtro |
| `endDate` | string (ISO 8601) | Não | Data de fim do filtro |

**Resposta (200):**

```json
{
  "items": [
    {
      "id": "abc123-...",
      "googleEventId": "google_event_id_string",
      "title": "Reunião de vendas",
      "description": "Descrição do evento",
      "startDateTime": "2026-03-10T14:00:00.000Z",
      "endDateTime": "2026-03-10T15:00:00.000Z",
      "location": "Sala 1",
      "attendees": ["cliente@email.com"],
      "htmlLink": "https://calendar.google.com/event?eid=...",
      "dealId": "deal-uuid-...",
      "customerId": "customer-uuid-...",
      "source": "db"
    }
  ],
  "total": 42
}
```

> `id` pode ser `null` para eventos que existem no Google Calendar mas ainda não foram salvos localmente (`source: "google"`).
> `source`: `"db"` — evento salvo localmente; `"google"` — buscado diretamente da API do Google.

**Erros:**

| Status | Mensagem |
|--------|----------|
| 404 | `Integration not found` |
| 422 | `Integration is not active` |
| 500 | `Failed to list calendar events` |

---

## POST /google-calendar/events

Cria um evento no Google Calendar.

**Body (JSON):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `workspaceId` | string (UUID) | Sim | |
| `title` | string | Sim | Título do evento |
| `description` | string | Não | Descrição do evento |
| `startDateTime` | string (ISO 8601) | Sim | Início do evento |
| `endDateTime` | string (ISO 8601) | Sim | Fim do evento |
| `timeZone` | string | Não | Ex: `America/Sao_Paulo` |
| `location` | string | Não | Local do evento |
| `attendees` | string[] (emails) | Não | Lista de convidados |
| `dealId` | string (UUID) | Não | Vincula ao deal |
| `customerId` | string (UUID) | Não | Vincula ao cliente |

**Resposta (201):**

```json
{
  "event": {
    "id": "abc123-...",
    "googleEventId": "google_event_id_string",
    "title": "Reunião de vendas",
    "description": "Descrição do evento",
    "startDateTime": "2026-03-10T14:00:00.000Z",
    "endDateTime": "2026-03-10T15:00:00.000Z",
    "location": "Sala 1",
    "attendees": ["cliente@email.com"],
    "googleCalendarIntegrationId": "integration-uuid-...",
    "dealId": "deal-uuid-...",
    "customerId": "customer-uuid-...",
    "createdByUserId": "user-uuid-...",
    "createdByAssistantId": null,
    "companyId": "company-uuid-...",
    "workspaceId": "workspace-uuid-...",
    "createdAt": "2026-03-07T10:00:00.000Z",
    "updatedAt": "2026-03-07T10:00:00.000Z",
    "deletedAt": null
  }
}
```

**Erros:**

| Status | Mensagem |
|--------|----------|
| 400 | `Integration is not active` |
| 400 | `Start date must be before end date` |
| 404 | `Integration not found` |
| 404 | `Deal not found` |
| 404 | `Customer not found` |
| 500 | `Failed to create calendar event` |

---

## DELETE /google-calendar/events/:id

Exclui um evento do Google Calendar e do banco de dados local.

**Path params:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `id` | string (UUID) | Sim |

**Query params:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `workspaceId` | string (UUID) | Sim |

**Resposta (200):** `null`

**Erros:**

| Status | Mensagem |
|--------|----------|
| 400 | `Integration is not active` |
| 404 | `Event not found` |
| 404 | `Integration not found` |
| 500 | `Failed to delete calendar event` |
