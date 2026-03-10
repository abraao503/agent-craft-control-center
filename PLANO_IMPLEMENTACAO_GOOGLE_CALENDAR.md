# 📋 Plano de Implementação: Integração com Google Calendar

## 🎯 Objetivo

Implementar integração com o Google Calendar que permita ao usuário vincular sua conta Google a um workspace e agendar eventos no calendário. O agendamento poderá ser feito de duas formas:

- ✅ **Via rotas REST** — endpoints dedicados para CRUD de eventos
- ✅ **Via Tool Call do Assistente** — o assistente de IA pode agendar eventos durante uma conversa
- ✅ **Vinculação por Workspace** — um workspace pode ter uma conta Google vinculada
- ✅ **OAuth2** — fluxo seguro de autenticação via Google OAuth2
- ✅ **Refresh automático de tokens** — tokens expirados são renovados automaticamente
- ✅ **Persistência de eventos** — eventos criados ficam registrados no banco para auditoria

---

## 🏗️ Arquitetura

### Fluxo de Autenticação OAuth2

```
Usuário clica em "Vincular Google Calendar" no frontend
        ↓
Frontend redireciona para GET /google-calendar/auth-url?workspaceId=xxx
        ↓
API gera URL de autorização Google com state={workspaceId}
        ↓
Usuário autoriza no Google → Google redireciona para callback URL
        ↓
GET /google-calendar/callback?code=xxx&state=xxx
        ↓
API troca o code por access_token + refresh_token
        ↓
Tokens são salvos na tabela GoogleCalendarIntegration (criptografados)
        ↓
Integração ativa! Workspace pode criar eventos.
```

### Fluxo de Criação de Evento (via API)

```
POST /google-calendar/events
  { title, description, startDateTime, endDateTime, dealId?, customerId?, attendees? }
        ↓
Service valida dados e verifica integração ativa no workspace
        ↓
GoogleCalendarAdapter cria evento na API do Google Calendar
        ↓
Evento é salvo na tabela GoogleCalendarEvent (com googleEventId)
        ↓
Retorna dados do evento criado
```

### Fluxo de Criação de Evento (via Tool Call do Assistente)

```
Assistente recebe pedido do cliente para agendar
        ↓
IA decide chamar tool "createCalendarEvent"
        ↓
HandleToolCallRequestService → handleCreateCalendarEvent
        ↓
CreateCalendarEventByAssistantService valida + cria evento
        ↓
Resultado retornado ao assistente → assistente confirma ao cliente
```

### Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                               │
├──────────────────────────────────────────────────────────────┤
│  Botão "Vincular Google"  →  Página de configuração           │
│  Lista de eventos  →  Modal para criar evento                 │
└──────────────────────────────────────────────────────────────┘
                              ↕ HTTP
┌──────────────────────────────────────────────────────────────┐
│                     API (NestJS)                               │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  GoogleCalendarModule                                          │
│    ├── Controllers                                             │
│    │     ├── GoogleCalendarAuthController (auth-url, callback) │
│    │     └── GoogleCalendarEventController (CRUD de eventos)   │
│    ├── Services                                                │
│    │     ├── GetGoogleAuthUrlService                           │
│    │     ├── HandleGoogleCallbackService                       │
│    │     ├── CreateCalendarEventService                        │
│    │     ├── ListCalendarEventsService                         │
│    │     ├── DeleteCalendarEventService                        │
│    │     └── CreateCalendarEventByAssistantService             │
│    └── Adapter                                                 │
│          └── GoogleCalendarAdapter (SDK do Google)             │
│                                                                │
│  AssistantModule (alteração)                                   │
│    └── ToolCallType.CreateCalendarEvent                       │
│                                                                │
└──────────────────────────────────────────────────────────────┘
                              ↕ Prisma
┌──────────────────────────────────────────────────────────────┐
│                     DATABASE                                   │
├──────────────────────────────────────────────────────────────┤
│  GoogleCalendarIntegration (tokens, calendarId, workspaceId)  │
│  GoogleCalendarEvent (eventos criados, relação com deal)      │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Modelagem de Dados

### Novos Modelos

#### GoogleCalendarIntegration (Vinculação Google por Workspace)

```prisma
model GoogleCalendarIntegration {
  id              String    @id @default(uuid())
  workspaceId     String    @unique
  companyId       String
  googleEmail     String    // Email da conta Google vinculada
  accessToken     String    // Access token (criptografado)
  refreshToken    String    // Refresh token (criptografado)
  tokenExpiresAt  DateTime  // Quando o access token expira
  calendarId      String    @default("primary") // ID do calendário (default: "primary")
  isActive        Boolean   @default(true)
  connectedByUserId String  // Usuário que fez a vinculação
  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  company         Company   @relation(fields: [companyId], references: [id])
  connectedByUser User      @relation(fields: [connectedByUserId], references: [id])
  events          GoogleCalendarEvent[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([companyId])
  @@index([workspaceId])
}
```

#### GoogleCalendarEvent (Eventos criados)

```prisma
model GoogleCalendarEvent {
  id                          String                    @id @default(uuid())
  googleEventId               String                    // ID do evento no Google Calendar
  title                       String
  description                 String?
  startDateTime               DateTime
  endDateTime                 DateTime
  location                    String?
  attendees                   String[]                  @default([]) // Emails dos participantes
  googleCalendarIntegrationId String
  dealId                      String?                   // Opcional: evento vinculado a um deal
  customerId                  String?                   // Opcional: evento vinculado a um customer
  createdByUserId             String?                   // Null se criado pelo assistente
  createdByAssistantId        String?                   // Null se criado por um usuário
  companyId                   String
  workspaceId                 String
  googleCalendarIntegration   GoogleCalendarIntegration @relation(fields: [googleCalendarIntegrationId], references: [id], onDelete: Cascade)
  deal                        Deal?                     @relation(fields: [dealId], references: [id], onDelete: SetNull)
  customer                    Customer?                 @relation(fields: [customerId], references: [id], onDelete: SetNull)
  createdByUser               User?                     @relation("GoogleCalendarEventCreator", fields: [createdByUserId], references: [id])
  createdByAssistant          Assistant?                @relation(fields: [createdByAssistantId], references: [id])
  company                     Company                   @relation(fields: [companyId], references: [id])
  workspace                   Workspace                 @relation(fields: [workspaceId], references: [id])
  createdAt                   DateTime                  @default(now())
  updatedAt                   DateTime                  @updatedAt
  deletedAt                   DateTime?

  @@unique([googleEventId, googleCalendarIntegrationId])
  @@index([googleCalendarIntegrationId])
  @@index([dealId])
  @@index([customerId])
  @@index([companyId])
  @@index([workspaceId])
  @@index([startDateTime])
}
```

### Alterações em Modelos Existentes

#### Workspace

```prisma
model Workspace {
  // ... campos existentes
  googleCalendarIntegration GoogleCalendarIntegration?
  googleCalendarEvents      GoogleCalendarEvent[]
}
```

#### Company

```prisma
model Company {
  // ... campos existentes
  googleCalendarIntegrations GoogleCalendarIntegration[]
  googleCalendarEvents       GoogleCalendarEvent[]
}
```

#### User

```prisma
model User {
  // ... campos existentes
  googleCalendarIntegrations GoogleCalendarIntegration[] // Integrações criadas por este usuário
  googleCalendarEvents       GoogleCalendarEvent[]       @relation("GoogleCalendarEventCreator")
}
```

#### Deal

```prisma
model Deal {
  // ... campos existentes
  googleCalendarEvents GoogleCalendarEvent[]
}
```

#### Customer

```prisma
model Customer {
  // ... campos existentes
  googleCalendarEvents GoogleCalendarEvent[]
}
```

#### Assistant

```prisma
model Assistant {
  // ... campos existentes
  googleCalendarEvents GoogleCalendarEvent[]
}
```

---

## 🔐 Variáveis de Ambiente

Novas variáveis necessárias no `.env`:

```env
# Google OAuth2
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=https://seu-dominio.com/google-calendar/callback

# Criptografia de tokens (chave AES-256 para encriptar tokens no banco)
GOOGLE_TOKEN_ENCRYPTION_KEY=chave_de_32_bytes_hex
```

> **Nota**: É necessário criar um projeto no Google Cloud Console, habilitar a Google Calendar API e configurar as credenciais OAuth2 com os escopos: `https://www.googleapis.com/auth/calendar` e `https://www.googleapis.com/auth/calendar.events`.

---

## 🚀 Fases de Implementação

---

## **FASE 1: Migration do Schema**

### Objetivos
- Criar modelos `GoogleCalendarIntegration` e `GoogleCalendarEvent`
- Adicionar relações nos modelos existentes
- Criar índices para performance

### Arquivos
- `packages/prisma/prisma/schema.prisma`
- `packages/prisma/prisma/migrations/YYYYMMDDHHMMSS_create_google_calendar_integration/migration.sql`

### Tarefas

#### 1.1. Atualizar Schema Prisma

**Arquivo:** `packages/prisma/prisma/schema.prisma`

Adicionar:
- [ ] Model `GoogleCalendarIntegration`
- [ ] Model `GoogleCalendarEvent`
- [ ] Relação `googleCalendarIntegration` em `Workspace` (1:1 opcional)
- [ ] Relação `googleCalendarIntegrations` em `Company`
- [ ] Relação `googleCalendarIntegrations` em `User`
- [ ] Relação `googleCalendarEvents` em `User` (com nome de relação `"GoogleCalendarEventCreator"`)
- [ ] Relação `googleCalendarEvents` em `Deal`
- [ ] Relação `googleCalendarEvents` em `Customer`
- [ ] Relação `googleCalendarEvents` em `Assistant`
- [ ] Relação `googleCalendarEvents` em `Workspace`
- [ ] Relação `googleCalendarEvents` em `Company`

#### 1.2. Criar Migration

```bash
npm run prisma:migrate:dev -- --name create_google_calendar_integration
```

#### 1.3. Gerar Cliente Prisma

```bash
npm run prisma:generate
```

### Critérios de Aceitação
- ✅ Migration executada sem erros
- ✅ Índices criados corretamente
- ✅ 2 novos modelos no schema
- ✅ Relações configuradas nos modelos existentes
- ✅ Cliente Prisma regenerado

---

## **FASE 2: Types e Contracts no Domain**

### Objetivos
- Criar types para `GoogleCalendarIntegration` e `GoogleCalendarEvent`
- Criar contracts para os repositories
- Exportar no `index.ts` do domain

### Arquivos
- `packages/domain/src/types/google-calendar.type.ts`
- `packages/domain/src/repositories/google-calendar-integration/google-calendar-integration.contract.ts`
- `packages/domain/src/repositories/google-calendar-event/google-calendar-event.contract.ts`
- `packages/domain/src/index.ts`

### Tarefas

#### 2.1. Criar Types

**Arquivo:** `packages/domain/src/types/google-calendar.type.ts`

```typescript
export type GoogleCalendarIntegration = {
  id: string;
  workspaceId: string;
  companyId: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  calendarId: string;
  isActive: boolean;
  connectedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GoogleCalendarEvent = {
  id: string;
  googleEventId: string;
  title: string;
  description: string | null;
  startDateTime: Date;
  endDateTime: Date;
  location: string | null;
  attendees: string[];
  googleCalendarIntegrationId: string;
  dealId: string | null;
  customerId: string | null;
  createdByUserId: string | null;
  createdByAssistantId: string | null;
  companyId: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
```

#### 2.2. Criar Contract do GoogleCalendarIntegration Repository

**Arquivo:** `packages/domain/src/repositories/google-calendar-integration/google-calendar-integration.contract.ts`

```typescript
import { GoogleCalendarIntegration } from '../../types/google-calendar.type';

export type CreateGoogleCalendarIntegrationParams = {
  workspaceId: string;
  companyId: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  calendarId?: string;
  connectedByUserId: string;
};

export type UpdateGoogleCalendarIntegrationParams = {
  id: string;
  data: Partial<Pick<
    GoogleCalendarIntegration,
    'accessToken' | 'refreshToken' | 'tokenExpiresAt' | 'calendarId' | 'isActive' | 'googleEmail'
  >>;
};

export type GetByWorkspaceIdParams = {
  workspaceId: string;
  companyId: string;
};

export interface IGoogleCalendarIntegrationRepository {
  create(params: CreateGoogleCalendarIntegrationParams): Promise<GoogleCalendarIntegration>;
  update(params: UpdateGoogleCalendarIntegrationParams): Promise<GoogleCalendarIntegration>;
  getByWorkspaceId(params: GetByWorkspaceIdParams): Promise<GoogleCalendarIntegration | null>;
  getById(params: { id: string }): Promise<GoogleCalendarIntegration | null>;
  delete(params: { id: string }): Promise<void>;
}
```

#### 2.3. Criar Contract do GoogleCalendarEvent Repository

**Arquivo:** `packages/domain/src/repositories/google-calendar-event/google-calendar-event.contract.ts`

```typescript
import { GoogleCalendarEvent } from '../../types/google-calendar.type';

export type CreateGoogleCalendarEventParams = {
  googleEventId: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  attendees?: string[];
  googleCalendarIntegrationId: string;
  dealId?: string;
  customerId?: string;
  createdByUserId?: string;
  createdByAssistantId?: string;
  companyId: string;
  workspaceId: string;
};

export type ListGoogleCalendarEventsParams = {
  companyId: string;
  workspaceId: string;
  dealId?: string;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
};

export interface IGoogleCalendarEventRepository {
  create(params: CreateGoogleCalendarEventParams): Promise<GoogleCalendarEvent>;
  getById(params: { id: string; companyId: string }): Promise<GoogleCalendarEvent | null>;
  list(params: ListGoogleCalendarEventsParams): Promise<{
    items: GoogleCalendarEvent[];
    total: number;
  }>;
  softDelete(params: { id: string }): Promise<void>;
  getByGoogleEventId(params: {
    googleEventId: string;
    googleCalendarIntegrationId: string;
  }): Promise<GoogleCalendarEvent | null>;
}
```

#### 2.4. Exportar no Index

**Arquivo:** `packages/domain/src/index.ts`

Adicionar:
```typescript
export * from './types/google-calendar.type';
export * from './repositories/google-calendar-integration/google-calendar-integration.contract';
export * from './repositories/google-calendar-event/google-calendar-event.contract';
```

### Critérios de Aceitação
- ✅ Types definidos seguindo padrão do projeto
- ✅ Contracts definidos para os 2 repositories
- ✅ Exports configurados no index.ts
- ✅ Build do package domain sem erros (`npm run build:packages`)

---

## **FASE 3: Implementação dos Repositories**

### Objetivos
- Implementar `PrismaGoogleCalendarIntegrationRepository`
- Implementar `PrismaGoogleCalendarEventRepository`
- Exportar no `index.ts` do packages/repositories

### Arquivos
- `packages/repositories/src/google-calendar-integration/google-calendar-integration.repository.ts`
- `packages/repositories/src/google-calendar-event/google-calendar-event.repository.ts`
- `packages/repositories/src/index.ts`

### Tarefas

#### 3.1. Implementar GoogleCalendarIntegration Repository

**Arquivo:** `packages/repositories/src/google-calendar-integration/google-calendar-integration.repository.ts`

Métodos:
- `create` — Cria nova integração
- `update` — Atualiza tokens e configuração
- `getByWorkspaceId` — Busca integração ativa por workspace
- `getById` — Busca por ID
- `delete` — Remove integração (hard delete, pois os tokens não devem permanecer)

#### 3.2. Implementar GoogleCalendarEvent Repository

**Arquivo:** `packages/repositories/src/google-calendar-event/google-calendar-event.repository.ts`

Métodos:
- `create` — Cria registro de evento
- `getById` — Busca evento por ID
- `list` — Lista eventos com filtros (workspace, deal, customer, período)
- `softDelete` — Marca como deletado
- `getByGoogleEventId` — Busca por ID do evento no Google

#### 3.3. Exportar no Index

**Arquivo:** `packages/repositories/src/index.ts`

```typescript
export { PrismaGoogleCalendarIntegrationRepository as GoogleCalendarIntegrationRepository } from './google-calendar-integration/google-calendar-integration.repository';
export { PrismaGoogleCalendarEventRepository as GoogleCalendarEventRepository } from './google-calendar-event/google-calendar-event.repository';
```

### Critérios de Aceitação
- ✅ Repositories implementam os contracts definidos
- ✅ Exportados no index.ts
- ✅ Build sem erros (`npm run build:packages`)

---

## **FASE 4: Google Calendar Adapter**

### Objetivos
- Criar adapter para encapsular a comunicação com a API do Google Calendar
- Implementar refresh automático de tokens
- Criptografia/decriptação de tokens

### Arquivos
- `apps/api/src/app/common/adapters/google-calendar/google-calendar.adapter.ts`
- `apps/api/src/app/common/adapters/google-calendar/google-calendar.types.ts`

### Dependência NPM

```bash
npm install googleapis
```

### Tarefas

#### 4.1. Criar Types do Adapter

**Arquivo:** `apps/api/src/app/common/adapters/google-calendar/google-calendar.types.ts`

```typescript
export type GoogleCalendarCreateEventParams = {
  calendarId: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  timeZone: string;
  location?: string;
  attendees?: string[];
};

export type GoogleCalendarCreateEventResponse = {
  googleEventId: string;
  htmlLink: string;
};

export type GoogleCalendarDeleteEventParams = {
  calendarId: string;
  googleEventId: string;
};

export type GoogleCalendarListEventsParams = {
  calendarId: string;
  timeMin?: Date;
  timeMax?: Date;
  maxResults?: number;
};
```

#### 4.2. Implementar Adapter

**Arquivo:** `apps/api/src/app/common/adapters/google-calendar/google-calendar.adapter.ts`

Responsabilidades:
- Inicializar OAuth2Client com credenciais
- **`getAuthUrl(workspaceId)`** — Gera URL de autorização OAuth2
- **`getTokensFromCode(code)`** — Troca authorization code por tokens
- **`createEvent(tokens, params)`** — Cria evento no Google Calendar
- **`deleteEvent(tokens, params)`** — Remove evento do Google Calendar
- **`listEvents(tokens, params)`** — Lista eventos
- **`refreshTokenIfNeeded(integration)`** — Verifica expiração e atualiza token
- **`encryptToken(token)`** / **`decryptToken(encryptedToken)`** — Criptografia AES-256

> **Importante**: O adapter NÃO acessa repositórios diretamente. Ele recebe tokens já decriptados e retorna dados puros. A lógica de persistência fica nos services.

### Critérios de Aceitação
- ✅ Adapter encapsula toda comunicação com Google API
- ✅ Tokens são criptografados antes de salvar e decriptados ao usar
- ✅ Refresh automático de tokens expirados
- ✅ Erros da API do Google são tratados e logados

---

## **FASE 5: Services do Módulo Google Calendar**

### Objetivos
- Implementar services para autenticação OAuth2
- Implementar services para CRUD de eventos
- Implementar service para criação de evento pelo assistente (tool call)

### Arquivos
- `apps/api/src/app/modules/google-calendar/services/get-google-auth-url.service.ts`
- `apps/api/src/app/modules/google-calendar/services/handle-google-callback.service.ts`
- `apps/api/src/app/modules/google-calendar/services/disconnect-google-calendar.service.ts`
- `apps/api/src/app/modules/google-calendar/services/get-google-calendar-status.service.ts`
- `apps/api/src/app/modules/google-calendar/services/create-calendar-event.service.ts`
- `apps/api/src/app/modules/google-calendar/services/list-calendar-events.service.ts`
- `apps/api/src/app/modules/google-calendar/services/delete-calendar-event.service.ts`
- `apps/api/src/app/modules/google-calendar/services/create-calendar-event-by-assistant.service.ts`

### Tarefas

#### 5.1. GetGoogleAuthUrlService

Gera a URL de autorização OAuth2 para o usuário vincular sua conta Google.

**Parâmetros de entrada:** `{ workspaceId, companyId }`
**Retorno:** `{ success: true, data: { authUrl: string } }`

Validações:
- Verificar se o workspace existe e pertence à company
- Verificar se já não existe integração ativa (se sim, retornar erro ou permitir reconexão)

#### 5.2. HandleGoogleCallbackService

Recebe o callback do Google após autorização e salva os tokens.

**Parâmetros de entrada:** `{ code, state (workspaceId), userId, companyId }`
**Retorno:** `{ success: true, data: { integration } }`

Lógica:
- Trocar authorization code por tokens via adapter
- Obter email do Google (via tokens)
- Criptografar tokens
- Criar ou atualizar `GoogleCalendarIntegration`

#### 5.3. DisconnectGoogleCalendarService

Remove a vinculação Google de um workspace.

**Parâmetros de entrada:** `{ workspaceId, companyId }`
**Retorno:** `{ success: true }`

#### 5.4. GetGoogleCalendarStatusService

Retorna o status da integração (ativa, email vinculado, etc.).

**Parâmetros de entrada:** `{ workspaceId, companyId }`
**Retorno:** `{ success: true, data: { isConnected, googleEmail, calendarId } }`

#### 5.5. CreateCalendarEventService

Cria um evento no Google Calendar e registra no banco.

**Parâmetros de entrada:**
```typescript
{
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  attendees?: string[];
  dealId?: string;
  customerId?: string;
  workspaceId: string;
  companyId: string;
  userId: string;
}
```

**Retorno:** `{ success: true, data: { event } }`

Validações:
- Verificar integração ativa no workspace
- Verificar datas válidas (startDateTime < endDateTime)
- Se dealId informado, verificar se deal existe e pertence à company
- Se customerId informado, verificar se customer existe

Lógica:
- Refresh token se necessário
- Criar evento via adapter
- Salvar no banco (GoogleCalendarEvent)

#### 5.6. ListCalendarEventsService

Lista eventos do calendário registrados no banco.

**Parâmetros de entrada:** `{ workspaceId, companyId, dealId?, customerId?, startDate?, endDate?, page, limit }`
**Retorno:** `{ success: true, data: { items, total } }`

#### 5.7. DeleteCalendarEventService

Remove um evento do Google Calendar e faz soft delete no banco.

**Parâmetros de entrada:** `{ eventId, companyId, workspaceId }`

Lógica:
- Buscar evento no banco
- Deletar via adapter no Google Calendar
- Soft delete no banco

#### 5.8. CreateCalendarEventByAssistantService

Service específico para o assistente criar eventos via tool call.

**Parâmetros de entrada:**
```typescript
{
  title: string;
  description?: string;
  startDateTime: string;  // ISO string (assistente envia como string)
  endDateTime: string;
  location?: string;
  dealId: string;
  companyId: string;
}
```

Lógica:
- Buscar deal → obter workspaceId
- Verificar integração ativa no workspace
- Validar datas
- Criar evento via `CreateCalendarEventService` (reutilizar lógica)

### Critérios de Aceitação
- ✅ Todos os services seguem o padrão `{ success, data/error }`
- ✅ Validações de negócio antes de chamar repositories
- ✅ Logging com `Logger` do NestJS
- ✅ Refresh automático de token quando necessário

---

## **FASE 6: DTOs e Controllers**

### Objetivos
- Criar DTOs com validação Zod para todas as rotas
- Criar controllers para autenticação e CRUD de eventos
- Configurar permissões

### Arquivos
- `apps/api/src/app/modules/google-calendar/dtos/get-google-auth-url.dto.ts`
- `apps/api/src/app/modules/google-calendar/dtos/handle-google-callback.dto.ts`
- `apps/api/src/app/modules/google-calendar/dtos/create-calendar-event.dto.ts`
- `apps/api/src/app/modules/google-calendar/dtos/list-calendar-events.dto.ts`
- `apps/api/src/app/modules/google-calendar/dtos/delete-calendar-event.dto.ts`
- `apps/api/src/app/modules/google-calendar/controllers/get-google-auth-url.controller.ts`
- `apps/api/src/app/modules/google-calendar/controllers/handle-google-callback.controller.ts`
- `apps/api/src/app/modules/google-calendar/controllers/disconnect-google-calendar.controller.ts`
- `apps/api/src/app/modules/google-calendar/controllers/get-google-calendar-status.controller.ts`
- `apps/api/src/app/modules/google-calendar/controllers/create-calendar-event.controller.ts`
- `apps/api/src/app/modules/google-calendar/controllers/list-calendar-events.controller.ts`
- `apps/api/src/app/modules/google-calendar/controllers/delete-calendar-event.controller.ts`

### Rotas

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| `GET` | `/google-calendar/auth-url` | Obtém URL de autorização OAuth2 | `manage:workspace` |
| `GET` | `/google-calendar/callback` | Callback do OAuth2 (público — recebe redirect do Google) | `@Public()` |
| `GET` | `/google-calendar/status` | Status da integração no workspace | Autenticado |
| `DELETE` | `/google-calendar/disconnect` | Desconecta Google Calendar | `manage:workspace` |
| `POST` | `/google-calendar/events` | Cria evento | Autenticado |
| `GET` | `/google-calendar/events` | Lista eventos | Autenticado |
| `DELETE` | `/google-calendar/events/:id` | Remove evento | Autenticado |

### Critérios de Aceitação
- ✅ DTOs com Zod para todas as rotas
- ✅ Controllers seguem padrão de tratamento de erros com switch
- ✅ Permissões configuradas corretamente
- ✅ Callback é rota pública (recebe redirect do Google)

---

## **FASE 7: Tool Call do Assistente**

### Objetivos
- Adicionar `CreateCalendarEvent` ao enum `ToolCallType`
- Atualizar `GetAssistantToolCallDataService` para parsear dados
- Adicionar handler no `HandleToolCallRequestService`
- Registrar services no `AssistantModule`

### Arquivos
- `apps/api/src/app/contracts/repositories/assistant/assistant.type.ts`
- `apps/api/src/app/modules/assistant/services/get-assistant-tool-call-data.service.ts`
- `apps/api/src/app/modules/assistant/services/handle-tool-call-request.service.ts`
- `apps/api/src/app/modules/assistant/assistant.module.ts`

### Tarefas

#### 7.1. Adicionar ao Enum ToolCallType

```typescript
export enum ToolCallType {
  // ... existentes
  CreateCalendarEvent = 'createCalendarEvent',
}
```

#### 7.2. Atualizar GetAssistantToolCallDataService

Adicionar parsing para o novo tipo:
```typescript
if (toolCallType === ToolCallType.CreateCalendarEvent) {
  const title = toolCallRequest.arguments['title'] as string;
  const description = toolCallRequest.arguments['description'] as string | undefined;
  const startDateTime = toolCallRequest.arguments['startDateTime'] as string;
  const endDateTime = toolCallRequest.arguments['endDateTime'] as string;
  const location = toolCallRequest.arguments['location'] as string | undefined;
  const dealId = toolCallRequest.arguments['dealId'] as string;

  return {
    success: true,
    data: {
      type: ToolCallType.CreateCalendarEvent,
      data: { title, description, startDateTime, endDateTime, location, dealId },
    },
  };
}
```

#### 7.3. Adicionar Handler no HandleToolCallRequestService

```typescript
case ToolCallType.CreateCalendarEvent:
  toolCallOutputs.push(
    await this.handleCreateCalendarEvent(
      toolCallRequest.id,
      toolCallData.data as {
        title: string;
        description?: string;
        startDateTime: string;
        endDateTime: string;
        location?: string;
        dealId: string;
      },
      companyId,
    ),
  );
  break;
```

Handler privado:
```typescript
private async handleCreateCalendarEvent(
  toolCallId: string,
  data: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    dealId: string;
  },
  companyId: string,
): Promise<ToolCallOutput> {
  try {
    const result = await this.createCalendarEventByAssistantService.execute({
      ...data,
      companyId,
    });

    return result.success
      ? this.createSuccessOutput(toolCallId, 'Evento criado com sucesso no Google Calendar')
      : this.createFailureOutput(toolCallId, result.error);
  } catch (error) {
    this.logger.error('Error handling create calendar event:', error);
    return this.createFailureOutput(toolCallId, 'Failed to create calendar event');
  }
}
```

#### 7.4. Registrar no AssistantModule

Adicionar `CreateCalendarEventByAssistantService`, `GoogleCalendarIntegrationRepository`, `GoogleCalendarEventRepository` e `GoogleCalendarAdapter` como providers.

### Critérios de Aceitação
- ✅ Novo tipo registrado no enum `ToolCallType`
- ✅ Parsing dos dados funciona corretamente
- ✅ Handler no switch case do `HandleToolCallRequestService`
- ✅ Service registrado no módulo
- ✅ Erros tratados e retornados adequadamente

---

## **FASE 8: Módulo NestJS**

### Objetivos
- Criar e registrar o módulo `GoogleCalendarModule`
- Registrar no `AppModule`

### Arquivos
- `apps/api/src/app/modules/google-calendar/google-calendar.module.ts`
- `apps/api/src/app/app.module.ts`

### Tarefas

#### 8.1. Criar GoogleCalendarModule

```typescript
@Module({
  controllers: [
    GetGoogleAuthUrlController,
    HandleGoogleCallbackController,
    DisconnectGoogleCalendarController,
    GetGoogleCalendarStatusController,
    CreateCalendarEventController,
    ListCalendarEventsController,
    DeleteCalendarEventController,
  ],
  providers: [
    // Services
    GetGoogleAuthUrlService,
    HandleGoogleCallbackService,
    DisconnectGoogleCalendarService,
    GetGoogleCalendarStatusService,
    CreateCalendarEventService,
    ListCalendarEventsService,
    DeleteCalendarEventService,
    CreateCalendarEventByAssistantService,

    // Adapter
    GoogleCalendarAdapter,

    // Repositories
    GoogleCalendarIntegrationRepository,
    GoogleCalendarEventRepository,
    WorkspaceRepository,
    DealRepository,
    CustomerRepository,
  ],
  exports: [
    CreateCalendarEventByAssistantService,
    GoogleCalendarAdapter,
    GoogleCalendarIntegrationRepository,
    GoogleCalendarEventRepository,
  ],
})
export class GoogleCalendarModule {}
```

#### 8.2. Registrar no AppModule

Adicionar `GoogleCalendarModule` aos imports do `AppModule`.

### Critérios de Aceitação
- ✅ Módulo registrado no `AppModule`
- ✅ Todas as dependências injetadas corretamente
- ✅ Services exportados para uso pelo `AssistantModule`
- ✅ API inicia sem erros

---

## **FASE 9: Configuração no Google Cloud Console**

### Objetivos
- Documentar os passos para configurar as credenciais no Google Cloud Console

### Passos (manual)

1. Acessar [Google Cloud Console](https://console.cloud.google.com/)
2. Criar ou selecionar um projeto
3. Ativar a **Google Calendar API** em "APIs & Services > Library"
4. Configurar a **tela de consentimento OAuth** em "APIs & Services > OAuth consent screen"
   - Tipo: Externo
   - Escopos: `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/calendar.events`
5. Criar credenciais OAuth 2.0 em "APIs & Services > Credentials"
   - Tipo: Web Application
   - Authorized redirect URI: `https://seu-dominio.com/google-calendar/callback`
6. Copiar `Client ID` e `Client Secret` para o `.env`

---

## 📱 Frontend (Visão Geral)

> O foco deste plano é a API, mas segue um resumo do que o frontend precisará implementar.

### Página de Configuração do Workspace

- **Seção "Integrações"** na página de configurações do workspace
- Botão "Vincular Google Calendar" → redireciona para o fluxo OAuth
- Exibir status da integração (conectado/desconectado, email vinculado)
- Botão "Desconectar" para remover a vinculação

### Criação de Eventos

- Botão "Agendar no Calendário" em:
  - Detalhe do Deal (sidebar/aba)
  - Detalhe do Customer (sidebar/aba)
- Modal/formulário com campos:
  - Título (obrigatório)
  - Descrição
  - Data/hora de início (obrigatório)
  - Data/hora de fim (obrigatório)
  - Local
  - Participantes (emails)

### Lista de Eventos

- Listagem de eventos agendados dentro do Deal ou Customer
- Filtros por período
- Ação de deletar evento

---

## ✅ Verificação

### Testes Manuais

1. **Fluxo OAuth completo:**
   - Chamar `GET /google-calendar/auth-url` e verificar URL gerada
   - Seguir o fluxo no navegador e verificar callback
   - Verificar que `GoogleCalendarIntegration` foi criada no banco com tokens criptografados

2. **Criação de evento via API:**
   - `POST /google-calendar/events` com dados válidos
   - Verificar que o evento aparece no Google Calendar
   - Verificar que `GoogleCalendarEvent` foi criado no banco

3. **Criação de evento via Tool Call:**
   - Simular tool call `createCalendarEvent` com dados válidos
   - Verificar criação do evento no Google Calendar e no banco

4. **Desconexão:**
   - `DELETE /google-calendar/disconnect`
   - Verificar que a integração foi removida e que novas tentativas de criação de evento retornam erro

5. **Refresh de Token:**
   - Forçar token expirado no banco e tentar criar evento
   - Verificar que o token é renovado automaticamente

### Build

```bash
npm run build:packages
npm run build:api
```

---

## 📋 Resumo de Arquivos por Fase

| Fase | Quantidade de Arquivos | Pacote/App |
|------|----------------------|------------|
| 1. Migration | 1 (schema.prisma) | `packages/prisma` |
| 2. Types & Contracts | 4 | `packages/domain` |
| 3. Repositories | 3 | `packages/repositories` |
| 4. Adapter | 2 | `apps/api` (common/adapters) |
| 5. Services | 8 | `apps/api` (modules/google-calendar) |
| 6. DTOs + Controllers | ~12 | `apps/api` (modules/google-calendar) |
| 7. Tool Call | 4 (alterações) | `apps/api` (modules/assistant) |
| 8. Módulo | 2 (alterações) | `apps/api` |
| **Total** | **~36 arquivos** | |

---

## 🔒 Considerações de Segurança

1. **Tokens criptografados** — Access token e refresh token NUNCA ficam em texto puro no banco
2. **Rota de callback pública** — Apenas aceita códigos válidos do Google
3. **Validação de ownership** — Todos os services verificam que o recurso pertence à company/workspace do usuário
4. **Escopos mínimos** — Solicitar apenas escopos necessários (`calendar.events`)
5. **HTTPS obrigatório** — O redirect URI do Google exige HTTPS em produção
