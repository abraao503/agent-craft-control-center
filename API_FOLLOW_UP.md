# API - Módulo de Follow-up

## Visão Geral

O módulo de Follow-up permite agendar e gerenciar follow-ups automáticos para deals. Os follow-ups são mensagens programadas que serão enviadas via WhatsApp para os clientes em horários específicos.

---

## Rotas Disponíveis

### 1. Criar Follow-up

Cria um novo follow-up agendado para um deal específico.

**Endpoint:** `POST /deal/:dealId/follow-up`

**Autenticação:** Requerida (Bearer Token)

#### Parâmetros de Rota

| Parâmetro | Tipo   | Obrigatório | Descrição             |
|-----------|--------|-------------|-----------------------|
| `dealId`  | string | Sim         | ID do deal (formato UUID) |

#### Body da Requisição

| Campo         | Tipo   | Obrigatório | Descrição                          | Validação                    |
|---------------|--------|-------------|------------------------------------|------------------------------|
| `title`       | string | Sim         | Título do follow-up                | Min: 1 caractere, Max: 255   |
| `message`     | string | Sim         | Mensagem a ser enviada             | Min: 1 caractere             |
| `scheduledAt` | string | Sim         | Data/hora agendada (ISO 8601)      | Deve ser uma data futura     |

#### Exemplo de Requisição

```json
POST /deal/550e8400-e29b-41d4-a716-446655440000/follow-up
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Follow-up de Proposta",
  "message": "Olá! Gostaria de saber se você teve a oportunidade de avaliar nossa proposta.",
  "scheduledAt": "2026-01-15T14:30:00Z"
}
```

#### Resposta de Sucesso (200)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Erros Possíveis

| Status | Erro                                                | Descrição                                    |
|--------|-----------------------------------------------------|----------------------------------------------|
| 400    | `Scheduled time must be in the future`              | Data agendada está no passado                |
| 400    | `Follow-up already scheduled for this time`         | Já existe follow-up para este horário        |
| 404    | `Deal not found`                                    | Deal não encontrado                          |
| 500    | `WhatsApp integration not configured for this pipeline` | Pipeline sem integração WhatsApp configurada |
| 500    | `Customer does not have a phone number`             | Cliente sem número de telefone               |
| 500    | `Failed to create follow-up`                        | Erro ao criar follow-up                      |

---

### 2. Listar Follow-ups

Lista todos os follow-ups de um deal específico com paginação.

**Endpoint:** `GET /deal/:dealId/follow-up`

**Autenticação:** Requerida (Bearer Token)

#### Parâmetros de Rota

| Parâmetro | Tipo   | Obrigatório | Descrição             |
|-----------|--------|-------------|-----------------------|
| `dealId`  | string | Sim         | ID do deal (formato UUID) |

#### Query Parameters

| Parâmetro | Tipo   | Obrigatório | Padrão | Descrição                    | Validação      |
|-----------|--------|-------------|--------|------------------------------|----------------|
| `page`    | number | Não         | 1      | Número da página             | Min: 1         |
| `limit`   | number | Não         | 10     | Itens por página             | Min: 1, Max: 100 |

#### Exemplo de Requisição

```
GET /deal/550e8400-e29b-41d4-a716-446655440000/follow-up?page=1&limit=10
Authorization: Bearer {token}
```

#### Resposta de Sucesso (200)

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Follow-up de Proposta",
      "message": "Olá! Gostaria de saber se você teve a oportunidade de avaliar nossa proposta.",
      "scheduledAt": "2026-01-15T14:30:00Z",
      "dealId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "PENDING",
      "attempts": 0,
      "maxAttempts": 3,
      "lastAttemptAt": null,
      "error": null,
      "jobId": "job_123456",
      "deal": {
        // Objeto Deal completo
      },
      "createdAt": "2026-01-08T10:00:00Z",
      "updatedAt": "2026-01-08T10:00:00Z",
      "deletedAt": null
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

#### Estrutura do Follow-up

| Campo          | Tipo   | Descrição                                         |
|----------------|--------|---------------------------------------------------|
| `id`           | string | ID único do follow-up                             |
| `title`        | string | Título do follow-up                               |
| `message`      | string | Mensagem a ser enviada                            |
| `scheduledAt`  | string | Data/hora agendada (ISO 8601)                     |
| `dealId`       | string | ID do deal associado                              |
| `status`       | string | Status: PENDING, SENT, FAILED, CANCELLED          |
| `attempts`     | number | Número de tentativas de envio                     |
| `maxAttempts`  | number | Número máximo de tentativas                       |
| `lastAttemptAt`| string\|null | Data/hora da última tentativa                |
| `error`        | string\|null | Mensagem de erro (se houver)                 |
| `jobId`        | string\|null | ID do job no sistema de filas                |
| `deal`         | object | Objeto Deal completo                              |
| `createdAt`    | string | Data de criação                                   |
| `updatedAt`    | string | Data de última atualização                        |
| `deletedAt`    | string\|null | Data de exclusão (soft delete)               |

#### Erros Possíveis

| Status | Erro                        | Descrição                  |
|--------|-----------------------------|----------------------------|
| 404    | `Deal not found`            | Deal não encontrado        |
| 500    | `Failed to list follow-ups` | Erro ao listar follow-ups  |

---

### 3. Deletar Follow-up

Exclui (soft delete) um follow-up agendado.

**Endpoint:** `DELETE /follow-up/:followUpId`

**Autenticação:** Requerida (Bearer Token)

#### Parâmetros de Rota

| Parâmetro     | Tipo   | Obrigatório | Descrição                  |
|---------------|--------|-------------|----------------------------|
| `followUpId`  | string | Sim         | ID do follow-up (formato UUID) |

#### Exemplo de Requisição

```
DELETE /follow-up/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {token}
```

#### Resposta de Sucesso (200)

```json
null
```

#### Erros Possíveis

| Status | Erro                          | Descrição                    |
|--------|-------------------------------|------------------------------|
| 404    | `Follow-up not found`         | Follow-up não encontrado     |
| 500    | `Failed to delete follow-up`  | Erro ao deletar follow-up    |

---

## Status do Follow-up

Os follow-ups podem ter os seguintes status:

| Status      | Descrição                                          |
|-------------|----------------------------------------------------|
| `PENDING`   | Follow-up agendado, aguardando envio               |
| `SENT`      | Follow-up enviado com sucesso                      |
| `FAILED`    | Falha no envio após todas as tentativas            |
| `CANCELLED` | Follow-up cancelado (deletado)                     |

---

## Regras de Negócio

### Criação de Follow-up

1. **Data/Hora Futura**: A data agendada (`scheduledAt`) deve ser sempre uma data futura. Não é permitido agendar follow-ups no passado.

2. **Unicidade de Horário**: Não é possível criar dois follow-ups para o mesmo deal no mesmo horário exato.

3. **Integração WhatsApp**: O pipeline do deal deve ter uma integração WhatsApp configurada. Caso contrário, a criação do follow-up falhará.

4. **Número de Telefone**: O cliente (customer) associado ao deal deve ter um número de telefone válido cadastrado.

5. **Tentativas**: O sistema fará até 3 tentativas (`maxAttempts`) de envio em caso de falha.

### Listagem de Follow-ups

1. **Paginação**: A listagem é paginada, com limite máximo de 100 itens por página.

2. **Escopo da Empresa**: Apenas follow-ups da empresa do usuário autenticado são retornados.

3. **Soft Delete**: Follow-ups deletados não aparecem na listagem.

### Exclusão de Follow-up

1. **Soft Delete**: A exclusão é lógica (soft delete), o registro permanece no banco com `deletedAt` preenchido.

2. **Cancelamento de Job**: Ao deletar um follow-up, o job agendado no sistema de filas também é cancelado.

---

## Notas Importantes

- Todos os endpoints requerem autenticação via Bearer Token
- As datas devem estar no formato ISO 8601 (ex: `2026-01-15T14:30:00Z`)
- IDs devem estar no formato UUID v4
- O `companyId` é extraído automaticamente do token de autenticação
- Follow-ups deletados têm seu status automaticamente alterado para `CANCELLED`

---

## Integração com WhatsApp

O envio dos follow-ups é realizado através da integração WhatsApp configurada no pipeline do deal. O sistema utiliza:

- **Sistema de Filas**: Follow-ups são enqueueados e processados em background
- **Retry Logic**: Até 3 tentativas de envio em caso de falha
- **Scheduler**: Bull queue para agendamento preciso das mensagens


