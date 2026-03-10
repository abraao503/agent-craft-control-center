# Google Calendar + Assistente — Alterações na API

Rotas modificadas para suportar a vinculação de uma integração Google Calendar a um Assistente.

---

## Rotas Modificadas

### POST /assistant

**Campo adicionado no body:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `googleCalendarIntegrationId` | string (UUID) | Não | ID de uma integração Google Calendar ativa para vincular ao assistente |

**Erros adicionados:**

| Status | Mensagem | Descrição |
|--------|----------|-----------|
| 404 | `Google Calendar integration not found` | Integração não encontrada ou não pertence à empresa |
| 422 | `Google Calendar integration is not active` | Integração existe mas está inativa |

**Exemplo de request:**

```json
{
  "name": "Assistente de Vendas",
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Assistente focado em agendamentos",
  "avatarFileId": null,
  "timeZone": "America/Sao_Paulo",
  "language": "pt-BR",
  "iaModelId": "...",
  "iaProviderApiKey": "...",
  "prompt": {
    "function": "...",
    "style": "...",
    "instructions": "...",
    "blacklist": null,
    "links": null
  },
  "contentsIds": [],
  "customFields": [],
  "googleCalendarIntegrationId": "660e8400-e29b-41d4-a716-446655440001"
}
```

---

### PUT /assistant/:id

**Query params:** `workspaceId` (UUID, obrigatório)

**Campo adicionado no body:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `googleCalendarIntegrationId` | string (UUID) \| null | Não | UUID para vincular, `null` para desvincular, omitir para não alterar |

**Erros adicionados:**

| Status | Mensagem | Descrição |
|--------|----------|-----------|
| 404 | `Google Calendar integration not found` | Integração não encontrada ou não pertence à empresa |
| 422 | `Google Calendar integration is not active` | Integração existe mas está inativa |

**Exemplos de body:**

Vincular:

```json
{
  "googleCalendarIntegrationId": "660e8400-e29b-41d4-a716-446655440001"
}
```

Desvincular:

```json
{
  "googleCalendarIntegrationId": null
}
```

---

### GET /assistant/:id

**Query params:** `workspaceId` (UUID, obrigatório)

**Campo adicionado na resposta:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `googleCalendarIntegrationId` | string (UUID) \| null | ID da integração vinculada, ou `null` |

**Exemplo de resposta:**

```json
{
  "id": "...",
  "name": "Assistente de Vendas",
  "description": "...",
  "timeZone": "America/Sao_Paulo",
  "language": "pt-BR",
  "workspaceId": "...",
  "isActive": true,
  "iaProviderApiKey": "...",
  "googleCalendarIntegrationId": "660e8400-e29b-41d4-a716-446655440001",
  "iaModel": { "id": "...", "name": "gpt-4o" },
  "prompt": {
    "function": "...",
    "style": "...",
    "instructions": "...",
    "blacklist": null,
    "links": []
  },
  "contents": [],
  "customFields": [],
  "skipMessages": [],
  "entryTags": [],
  "avatar": null,
  "createdAt": "2026-03-07T10:00:00.000Z",
  "updatedAt": "2026-03-07T10:00:00.000Z"
}
```

---

### GET /assistant/list

**Query params:** `workspaceId` (UUID, obrigatório)

**Campo adicionado em cada item da resposta:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `googleCalendarIntegrationId` | string (UUID) \| null | ID da integração vinculada, ou `null` |

---

## Fluxo de Vinculação (Frontend)

1. Listar integrações disponíveis: `GET /google-calendar/integrations?workspaceId=<uuid>`
2. Exibir as integrações ao usuário (usar o campo `googleEmail` como label)
3. Ao criar/editar o assistente, enviar o `googleCalendarIntegrationId` selecionado
4. Para desvincular, enviar `googleCalendarIntegrationId: null` no PUT
