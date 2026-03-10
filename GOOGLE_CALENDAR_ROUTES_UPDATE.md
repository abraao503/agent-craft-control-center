# Atualização de Rotas - Google Calendar (Multi-Contas)

Com a nova atualização para suportar múltiplas integrações de calendário por workspace, algumas rotas sofreram alterações em seus contratos ou comportamentos. Este documento serve como guia para a equipe de frontend se atualizar.

---

## 🟢 Rotas Adicionadas

### 1. Listar Integrações do Workspace

Esta rota substitui a antiga rota de status, retornando todas as contas do Google vinculadas ao workspace.

- **Método:** `GET`
- **Rota:** `/google-calendar/integrations`
- **Permissão Necessária:** `view:integrations`
- **Query Params:**
  - `workspaceId` (obrigatório, UUID)
- **Exemplo de Resposta de Sucesso (200 OK):**
  A rota retorna a raiz do banco dentro do objeto `data` da service, portanto o front-end consome diretamente:

  ```json
  {
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "workspaceId": "987fcdeb-51a2-43d7-9012-3456789abcde",
        "companyId": "cbd21fqa-12df-1123-bbbb-426614174000",
        "googleEmail": "usuario@exemplo.com",
        "calendarId": "primary",
        "isActive": true,
        "createdAt": "2024-03-20T10:00:00.000Z",
        "updatedAt": "2024-03-20T10:00:00.000Z"
      }
    ]
  }
  ```

- **Possíveis Respostas de Erro:**
  - `500 Internal Server Error`: Caso ocorra alguma falha na leitura dos dados. A resposta terá a interface global de erros (retornada pelo NestJS).

---

## 🟡 Rotas Modificadas

### 1. Desconectar Integração

Como agora existem múltiplas integrações, a deleção deve mirar um ID específico (o `integrationId`) em vez de um `workspaceId` genérico.

- **Método:** `DELETE`
- **Rota:** `/google-calendar/disconnect`
- **Permissão Necessária:** `manage:integrations`
- **⚠️ Alteração nos Query Params:**
  - ANTES: `workspaceId`
  - **AGORA:** `integrationId` (obrigatório, UUID)
- **Exemplo de Resposta de Sucesso (200 OK):**

  ```json
  null
  ```

- **Possíveis Respostas de Erro:**
  - `404 Not Found`: `{ "message": "Integration not found", "error": "Not Found", "statusCode": 404 }` (Se a integração pertencer a outra empresa ou não existir)
  - `500 Internal Server Error`: `{ "message": "Failed to disconnect Google Calendar", "error": "Internal Server Error", "statusCode": 500 }`

### 2. Gerar URL de Autenticação (`/google-calendar/auth-url`)

O contrato **não mudou** (ainda requer `workspaceId`), mas o comportamento sim. Anteriormente, a API bloqueava a geração de URL se já existisse uma integração. Agora, ela permite gerar a URL livremente para adicionar **novas contas** adicionais ao mesmo workspace.

- **Possíveis Respostas de Erro:**
  - `500 Internal Server Error`: `{ "message": "Failed to generate auth URL", "error": "Internal Server Error", "statusCode": 500 }`

### 3. Handle Callback (`/google-calendar/callback`)

O contrato principal não mudou, porém internamente trata a integração múltipla de contas por workspace e a nova sessão de OAuth do Node.

- **Possíveis Respostas de Erro:**
  - `400 Bad Request` (Sessão Expirada): `{ "message": "OAuth session not found or expired", "error": "Bad Request", "statusCode": 400 }`
  - `400 Bad Request` (Código Inválido / grant error): `{ "message": "Invalid authorization code", "error": "Bad Request", "statusCode": 400 }`
  - `500 Internal Server Error`: `{ "message": "Failed to handle Google callback", "error": "Internal Server Error", "statusCode": 500 }`

### 4. Criar Evento (`POST /google-calendar/events`)

Foi removido o vínculo por usuário que criou, no backend.

- **Possíveis Respostas de Erro:**
  - `404 Not Found`: `{ "message": "Integration not found", "error": "Not Found", "statusCode": 404 }`
  - `404 Not Found`: `{ "message": "Deal not found", "error": "Not Found", "statusCode": 404 }`
  - `404 Not Found`: `{ "message": "Customer not found", "error": "Not Found", "statusCode": 404 }`
  - `400 Bad Request`: `{ "message": "Integration is not active", "error": "Bad Request", "statusCode": 400 }`
  - `400 Bad Request`: `{ "message": "Start date must be before end date", "error": "Bad Request", "statusCode": 400 }`
  - `500 Internal Server Error`: `{ "message": "Failed to create calendar event", "error": "Internal Server Error", "statusCode": 500 }`

### 5. Excluir Evento (`DELETE /google-calendar/events/:id`)

- **Possíveis Respostas de Erro:**
  - `404 Not Found`: `{ "message": "Event not found", "error": "Not Found", "statusCode": 404 }`
  - `404 Not Found`: `{ "message": "Integration not found", "error": "Not Found", "statusCode": 404 }`
  - `400 Bad Request`: `{ "message": "Integration is not active", "error": "Bad Request", "statusCode": 400 }`
  - `500 Internal Server Error`: `{ "message": "Failed to delete Google Calendar event", "error": "Internal Server Error", "statusCode": 500 }`

### 6. Listar Eventos (`GET /google-calendar/events`)

- **Possíveis Respostas de Erro:**
  - `500 Internal Server Error`: `{ "message": "Failed to list calendar events", "error": "Internal Server Error", "statusCode": 500 }`

---

## 🔴 Rotas Depreciadas

### 1. Obter Status da Integração

Esta rota lidava com a verificação de "conectado / não conectado" assumindo escopo único (uma conta por workspace). Como um workspace agora pode ter 0, 1 ou N contas, esta representação não é mais precisa nem adequada para o frontend.

- **Método:** `GET`
- **Rota:** `/google-calendar/status`
- **Ação Recomendada:** Remover o uso desta rota no frontend. Para checar se o workspace tem contas ativas, chame a nova rota `GET /google-calendar/integrations` e verifique se o array `items` possui tamanho maior que `0` ou exiba-os em lista para o usuário.
