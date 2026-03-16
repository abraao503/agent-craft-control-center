# Dashboard V2 — Documentação de API para o Frontend

## Índice
- [Dashboard V2 — Documentação de API para o Frontend](#dashboard-v2--documentação-de-api-para-o-frontend)
  - [Índice](#índice)
  - [Visão Geral](#visão-geral)
  - [Base URL](#base-url)
  - [Autenticação](#autenticação)
  - [Endpoints](#endpoints)
    - [GET /dashboard/v2/catalog](#get-dashboardv2catalog)
    - [GET /dashboard/v2/config](#get-dashboardv2config)
    - [PUT /dashboard/v2/config](#put-dashboardv2config)
    - [DELETE /dashboard/v2/config](#delete-dashboardv2config)
    - [GET /dashboard/v2/indicators](#get-dashboardv2indicators)
  - [Tipos de Widget](#tipos-de-widget)
  - [Formatos de Resposta por Tipo de Widget](#formatos-de-resposta-por-tipo-de-widget)
    - [`kpi_card` / `progress_bar`](#kpi_card--progress_bar)
    - [`chart_bar` / `chart_donut`](#chart_bar--chart_donut)
    - [`chart_line`](#chart_line)
    - [`funnel`](#funnel)
    - [`table`](#table)
  - [Catálogo de Indicadores](#catálogo-de-indicadores)
    - [Vendas (Deals) — 16 indicadores](#vendas-deals--16-indicadores)
    - [Conversas \& Mensagens — 11 indicadores](#conversas--mensagens--11-indicadores)
    - [Assistentes IA — 4 indicadores](#assistentes-ia--4-indicadores)
    - [Follow-Up — 6 indicadores](#follow-up--6-indicadores)
    - [Reengajamento — 4 indicadores](#reengajamento--4-indicadores)
    - [Disparo em Massa — 5 indicadores](#disparo-em-massa--5-indicadores)
    - [Clientes (Customers) — 4 indicadores](#clientes-customers--4-indicadores)
    - [Equipe \& Usuários — 5 indicadores](#equipe--usuários--5-indicadores)
    - [Webhooks — 4 indicadores](#webhooks--4-indicadores)
    - [Google Calendar — 4 indicadores](#google-calendar--4-indicadores)
    - [Plataforma (Admin) — 8 indicadores](#plataforma-admin--8-indicadores)
    - [Financeiro / Plano — 8 indicadores](#financeiro--plano--8-indicadores)
  - [Filtros Globais](#filtros-globais)
    - [Seletor de Workspace](#seletor-de-workspace)
  - [Períodos Pré-definidos](#períodos-pré-definidos)
  - [Permissões e Escopo de Dados por Role](#permissões-e-escopo-de-dados-por-role)
    - [Categorias visíveis por role](#categorias-visíveis-por-role)
    - [Escopo de dados](#escopo-de-dados)
  - [Layout Padrão por Role](#layout-padrão-por-role)
    - [SALES\_REP](#sales_rep)
    - [WORKSPACE\_MANAGER](#workspace_manager)
    - [COMPANY\_OWNER](#company_owner)
  - [Fluxo de Personalização](#fluxo-de-personalização)
  - [Notas de Integração](#notas-de-integração)
  - [Veja também](#veja-também)

---

## Visão Geral

A Dashboard V2 é uma dashboard customizável por usuário, com indicadores extraídos de todas as entidades de negócio do sistema. O frontend consome 5 endpoints REST para: consultar o catálogo de indicadores disponíveis, gerenciar a configuração do layout do usuário, e buscar os dados dos indicadores.

---

## Base URL

```
/dashboard/v2
```

---

## Autenticação

Todos os endpoints requerem autenticação via token JWT no header `Authorization: Bearer <token>`. O backend extrai `userId` e `companyId` do token.

---

## Endpoints

---

### GET /dashboard/v2/catalog

Retorna o catálogo de indicadores **disponíveis para o usuário autenticado**, já filtrado pelas permissões.

**Query Parameters:**

| Param | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `workspaceId` | `string (UUID)` | Não | Se informado, filtra indicadores de escopo workspace |

**Response 200:**

```json
{
  "categories": [
    {
      "id": "deals",
      "name": "Vendas (Deals)",
      "indicators": [
        {
          "id": "deals.total",
          "name": "Total de Deals",
          "description": "Contagem total de deals ativos (não arquivados/deletados)",
          "widgetType": "kpi_card",
          "priority": "primary",
          "supportsPeriod": true,
          "scope": "workspace"
        },
        {
          "id": "deals.pipeline_funnel",
          "name": "Funil do Pipeline",
          "description": "Quantidade de deals por stage de um pipeline selecionado",
          "widgetType": "funnel",
          "priority": "primary",
          "supportsPeriod": false,
          "scope": "workspace"
        }
      ]
    },
    {
      "id": "chat",
      "name": "Conversas & Mensagens",
      "indicators": [...]
    }
  ]
}
```

> **Nota:** Categorias e indicadores que o usuário não tem permissão de ver são automaticamente omitidos da resposta.

**Possíveis erros:**

| Status | Erro | Descrição |
|--------|------|-----------|
| 500 | `Failed to fetch catalog` | Erro interno ao buscar catálogo |

---

### GET /dashboard/v2/config

Retorna a configuração de layout da dashboard do usuário. Se não existir configuração salva, retorna `null` (o frontend deve usar o layout padrão baseado no role).

**Query Parameters:**

| Param | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `workspaceId` | `string (UUID)` | Não | Config específica para um workspace |

**Response 200 — Com configuração salva:**

```json
{
  "config": {
    "id": "uuid-da-config",
    "layout": {
      "widgets": [
        {
          "indicatorId": "deals.total",
          "x": 0,
          "y": 0,
          "w": 3,
          "h": 1,
          "visible": true,
          "config": {
            "period": "month"
          }
        },
        {
          "indicatorId": "deals.pipeline_funnel",
          "x": 0,
          "y": 1,
          "w": 6,
          "h": 3,
          "visible": true,
          "config": {
            "pipelineId": "uuid-do-pipeline"
          }
        },
        {
          "indicatorId": "chat.assistant_vs_human",
          "x": 6,
          "y": 1,
          "w": 6,
          "h": 3,
          "visible": true
        }
      ]
    }
  }
}
```

**Response 200 — Sem configuração salva:**

```json
{
  "config": null
}
```

**Possíveis erros:**

| Status | Erro | Descrição |
|--------|------|-----------|
| 500 | `Failed to fetch config` | Erro interno ao buscar configuração |

---

### PUT /dashboard/v2/config

Salva (cria ou atualiza) a configuração de layout da dashboard do usuário.

**Request Body:**

```json
{
  "workspaceId": "uuid-do-workspace",
  "layout": {
    "widgets": [
      {
        "indicatorId": "deals.total",
        "x": 0,
        "y": 0,
        "w": 3,
        "h": 1,
        "visible": true,
        "config": {
          "period": "month"
        }
      },
      {
        "indicatorId": "deals.won",
        "x": 3,
        "y": 0,
        "w": 3,
        "h": 1,
        "visible": true
      }
    ]
  }
}
```

**Validação do body (Zod):**

| Campo | Tipo | Obrigatório | Regras |
|-------|------|:-----------:|--------|
| `workspaceId` | `string (UUID)` | Não | — |
| `layout.widgets` | `array` | Sim | Mínimo 1 widget |
| `layout.widgets[].indicatorId` | `string` | Sim | Deve existir no catálogo |
| `layout.widgets[].x` | `number` | Sim | 0–11 (inteiro) |
| `layout.widgets[].y` | `number` | Sim | ≥ 0 (inteiro) |
| `layout.widgets[].w` | `number` | Sim | 1–12 (inteiro) |
| `layout.widgets[].h` | `number` | Sim | ≥ 1 (inteiro) |
| `layout.widgets[].visible` | `boolean` | Sim | — |
| `layout.widgets[].config` | `object` | Não | Configurações opcionais |
| `layout.widgets[].config.pipelineId` | `string (UUID)` | Não | Para indicadores filtráveis por pipeline |
| `layout.widgets[].config.period` | `string` | Não | `"day"` \| `"week"` \| `"month"` \| `"quarter"` |
| `layout.widgets[].config.chartType` | `string` | Não | Variação de visualização |

**Response 200:**

```json
{
  "id": "uuid-da-config-salva"
}
```

**Possíveis erros:**

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | `Invalid indicator IDs` | Um ou mais `indicatorId` não existem no catálogo |
| 400 | `Duplicate indicator IDs` | `indicatorId` repetidos no array de widgets |
| 403 | `Unauthorized indicators for user permissions` | Usuário tentou incluir indicador sem permissão |
| 500 | `Failed to update config` | Erro interno ao salvar |

---

### DELETE /dashboard/v2/config

Reseta a configuração do usuário (soft-delete). Após deletar, o frontend deve voltar ao layout padrão baseado no role.

**Query Parameters:**

| Param | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `workspaceId` | `string (UUID)` | Não | Deletar config específica de um workspace |

**Response 200:**

```json
null
```

**Possíveis erros:**

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | `Config not found` | Não existe configuração para deletar |
| 500 | `Failed to delete config` | Erro interno ao deletar |

---

### GET /dashboard/v2/indicators

Endpoint principal. Retorna os **dados** dos indicadores solicitados, já filtrados por permissões e escopo do usuário.

**Query Parameters:**

| Param | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `workspaceId` | `string (UUID)` | Sim | Workspace dos dados |
| `indicators` | `string` | Sim | IDs dos indicadores separados por vírgula. Ex: `"deals.total,deals.won,chat.new_today"` |
| `timezone` | `string` | Não | Default: `"America/Sao_Paulo"` |
| `startDate` | `string (ISO 8601)` | Não | Início do período. Ex: `"2026-02-01T00:00:00.000Z"` |
| `endDate` | `string (ISO 8601)` | Não | Fim do período. Ex: `"2026-03-01T00:00:00.000Z"` |
| `pipelineId` | `string (UUID)` | Não | Filtrar indicadores de pipeline específico |

**Response 200:**

```json
{
  "indicators": {
    "deals.total": {
      "value": 142
    },
    "deals.won": {
      "value": 38
    },
    "deals.won_value": {
      "value": 245000.50,
      "formatted": "R$ 245.000,50"
    },
    "deals.win_rate": {
      "value": 62.3,
      "formatted": "62.3%"
    },
    "deals.pipeline_funnel": {
      "stages": [
        { "name": "Qualificação", "count": 45, "value": 120000 },
        { "name": "Proposta", "count": 30, "value": 95000 },
        { "name": "Negociação", "count": 18, "value": 72000 },
        { "name": "Fechamento", "count": 8, "value": 38000 }
      ]
    },
    "deals.trend": {
      "labels": ["2026-02-10", "2026-02-11", "2026-02-12", "..."],
      "datasets": [
        { "data": [5, 8, 3, "..."] }
      ]
    },
    "chat.assistant_vs_human": {
      "items": [
        { "label": "Assistente IA", "value": 340 },
        { "label": "Humano", "value": 125 }
      ]
    },
    "chat.new_today": {
      "value": 12
    },
    "billing.messages_usage": {
      "value": 73.5,
      "formatted": "73.5%"
    },
    "team.deals_ranking": {
      "items": [
        { "name": "João Silva", "deals_won": 12, "value": 85000 },
        { "name": "Maria Santos", "deals_won": 10, "value": 72000 },
        { "name": "Pedro Costa", "deals_won": 8, "value": 61000 }
      ]
    },
    "broadcast.recent": {
      "items": [
        { "name": "Campanha Black Friday", "status": "COMPLETED", "sentCount": 1250, "createdAt": "2026-03-10T14:00:00Z" },
        { "name": "Newsletter Março", "status": "SENDING", "sentCount": 430, "createdAt": "2026-03-12T09:00:00Z" }
      ]
    }
  },
  "meta": {
    "cachedAt": "2026-03-12T15:30:00.000Z",
    "period": {
      "start": "2026-02-01T00:00:00.000Z",
      "end": "2026-03-01T00:00:00.000Z"
    }
  }
}
```

**Possíveis erros:**

| Status | Erro | Descrição |
|--------|------|-----------|
| 400 | `Workspace not found` | Workspace não existe ou não pertence ao usuário |
| 400 | `Invalid indicator IDs` | Um ou mais IDs de indicador não existem |
| 403 | `Unauthorized indicators for user permissions` | Usuário sem permissão para os indicadores solicitados |
| 500 | `Failed to fetch indicators` | Erro interno ao buscar dados |

---

## Tipos de Widget

Cada indicador tem um tipo de widget associado que determina o formato da resposta:

| Tipo | Descrição | Uso |
|------|-----------|-----|
| `kpi_card` | Número único com valor e formatação opcional | Contadores, valores monetários, percentuais |
| `chart_bar` | Gráfico de barras | Distribuições, comparações |
| `chart_line` | Gráfico de linhas | Tendências temporais |
| `chart_donut` | Gráfico de donut/rosca | Proporções (IA vs Humano, status) |
| `funnel` | Gráfico de funil | Pipeline de vendas |
| `table` | Tabela de dados | Rankings, listas recentes |
| `progress_bar` | Barra de progresso | Uso vs. limites (billing) |

---

## Formatos de Resposta por Tipo de Widget

### `kpi_card` / `progress_bar`

```typescript
{
  value: number;
  formatted?: string;  // ex: "R$ 245.000,50", "62.3%", "Plano Pro"
}
```

### `chart_bar` / `chart_donut`

```typescript
{
  items: Array<{
    label: string;
    value: number;
  }>;
}
```

### `chart_line`

```typescript
{
  labels: string[];              // ex: ["2026-02-10", "2026-02-11", ...]
  datasets: Array<{
    data: number[];              // mesma length que labels
  }>;
}
```

### `funnel`

```typescript
{
  stages: Array<{
    name: string;
    count: number;
    value: number;
  }>;
}
```

### `table`

```typescript
{
  items: Array<Record<string, unknown>>;
  // Os campos variam por indicador. Exemplos:
  // team.deals_ranking → { name, deals_won, value }
  // broadcast.recent → { name, status, sentCount, createdAt }
  // calendar.upcoming → { title, startDateTime, dealName }
  // customers.imports → { fileName, status, totalRows, successCount, errorCount, createdAt }
}
```

---

## Catálogo de Indicadores

Lista completa de todos os IDs de indicadores, organizados por categoria:

### Vendas (Deals) — 16 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `deals.total` | `kpi_card` | ✅ |
| `deals.total_value` | `kpi_card` | ✅ |
| `deals.won` | `kpi_card` | ✅ |
| `deals.won_value` | `kpi_card` | ✅ |
| `deals.lost` | `kpi_card` | ✅ |
| `deals.lost_value` | `kpi_card` | ✅ |
| `deals.win_rate` | `kpi_card` | ✅ |
| `deals.avg_value` | `kpi_card` | ✅ |
| `deals.new_today` | `kpi_card` | ❌ |
| `deals.pipeline_funnel` | `funnel` | ❌ |
| `deals.by_stage` | `chart_bar` | ✅ |
| `deals.trend` | `chart_line` | ✅ |
| `deals.avg_time_to_close` | `kpi_card` | ✅ |
| `deals.by_user` | `chart_bar` | ✅ |
| `deals.unassigned` | `kpi_card` | ❌ |
| `deals.expected_revenue` | `kpi_card` | ❌ |

### Conversas & Mensagens — 11 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `chat.total` | `kpi_card` | ✅ |
| `chat.new_today` | `kpi_card` | ❌ |
| `chat.handled_by_assistant` | `kpi_card` | ✅ |
| `chat.handled_by_human` | `kpi_card` | ✅ |
| `chat.assistant_vs_human` | `chart_donut` | ✅ |
| `chat.unread_total` | `kpi_card` | ❌ |
| `messages.total` | `kpi_card` | ✅ |
| `messages.new_today` | `kpi_card` | ❌ |
| `messages.by_sender` | `chart_donut` | ✅ |
| `messages.trend` | `chart_line` | ✅ |
| `messages.avg_response_time` | `kpi_card` | ✅ |

### Assistentes IA — 4 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `assistants.total` | `kpi_card` | ❌ |
| `assistants.active` | `kpi_card` | ❌ |
| `assistants.conversations_by_assistant` | `chart_bar` | ✅ |
| `assistants.stage_transitions` | `chart_bar` | ✅ |

### Follow-Up — 6 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `followup.total` | `kpi_card` | ✅ |
| `followup.active` | `kpi_card` | ❌ |
| `followup.sent_week` | `kpi_card` | ❌ |
| `followup.by_status` | `chart_donut` | ✅ |
| `followup.response_rate` | `kpi_card` | ✅ |
| `followup.trend` | `chart_line` | ✅ |

### Reengajamento — 4 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `reengagement.total_attempts` | `kpi_card` | ✅ |
| `reengagement.by_status` | `chart_donut` | ✅ |
| `reengagement.response_rate` | `kpi_card` | ✅ |
| `reengagement.active_configs` | `kpi_card` | ❌ |

### Disparo em Massa — 5 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `broadcast.total` | `kpi_card` | ✅ |
| `broadcast.by_status` | `chart_donut` | ✅ |
| `broadcast.total_sent` | `kpi_card` | ✅ |
| `broadcast.success_rate` | `kpi_card` | ✅ |
| `broadcast.recent` | `table` | ❌ |

### Clientes (Customers) — 4 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `customers.total` | `kpi_card` | ✅ |
| `customers.new_today` | `kpi_card` | ❌ |
| `customers.trend` | `chart_line` | ✅ |
| `customers.imports` | `table` | ❌ |

### Equipe & Usuários — 5 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `team.total_users` | `kpi_card` | ❌ |
| `team.by_role` | `chart_donut` | ❌ |
| `team.deals_ranking` | `table` | ✅ |
| `team.deals_per_user` | `chart_bar` | ❌ |
| `team.conversion_by_user` | `chart_bar` | ✅ |

### Webhooks — 4 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `webhooks.total` | `kpi_card` | ❌ |
| `webhooks.executions` | `kpi_card` | ✅ |
| `webhooks.success_rate` | `kpi_card` | ✅ |
| `webhooks.recent_executions` | `table` | ❌ |

### Google Calendar — 4 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `calendar.total_events` | `kpi_card` | ✅ |
| `calendar.upcoming` | `table` | ❌ |
| `calendar.events_today` | `kpi_card` | ❌ |
| `calendar.created_by_assistant` | `kpi_card` | ✅ |

### Plataforma (Admin) — 8 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `platform.total_companies` | `kpi_card` | ❌ |
| `platform.total_workspaces` | `kpi_card` | ❌ |
| `platform.total_users` | `kpi_card` | ❌ |
| `platform.total_deals` | `kpi_card` | ✅ |
| `platform.total_messages` | `kpi_card` | ✅ |
| `platform.companies_by_plan` | `chart_donut` | ❌ |
| `platform.mrr` | `kpi_card` | ❌ |
| `platform.subscriptions_by_status` | `chart_donut` | ❌ |

### Financeiro / Plano — 8 indicadores

| ID | Widget Type | Suporta Período |
|----|-------------|:---------------:|
| `billing.plan_name` | `kpi_card` | ❌ |
| `billing.messages_usage` | `progress_bar` | ❌ |
| `billing.deals_usage` | `progress_bar` | ❌ |
| `billing.storage_usage` | `progress_bar` | ❌ |
| `billing.workspaces_usage` | `progress_bar` | ❌ |
| `billing.users_usage` | `progress_bar` | ❌ |
| `billing.next_invoice` | `kpi_card` | ❌ |
| `billing.overage_charges` | `kpi_card` | ❌ |

---

## Filtros Globais

Filtros que o frontend deve enviar como query params no endpoint `/indicators`:

| Filtro | Query Param | Tipo | Obrigatório | Default |
|--------|-------------|------|:-----------:|---------|
| Workspace | `workspaceId` | UUID | Sim | — |
| Início do período | `startDate` | ISO 8601 datetime | Não | 30 dias atrás |
| Fim do período | `endDate` | ISO 8601 datetime | Não | Agora |
| Pipeline | `pipelineId` | UUID | Não | Todos |
| Timezone | `timezone` | IANA timezone | Não | `America/Sao_Paulo` |

### Seletor de Workspace

| Role | Comportamento |
|------|--------------|
| PLATFORM_ADMIN | Pode selecionar qualquer company/workspace |
| COMPANY_OWNER / COMPANY_ADMIN | Pode selecionar qualquer workspace da empresa |
| WORKSPACE_OWNER / WORKSPACE_ADMIN / WORKSPACE_MANAGER / SALES_REP | Workspace fixo (o seu) |

---

## Períodos Pré-definidos

O frontend pode oferecer shortcuts de período que se traduzem em `startDate` e `endDate`:

| Label | startDate | endDate |
|-------|-----------|---------|
| Hoje | Início do dia (timezone) | Agora |
| Ontem | Início do dia anterior | Fim do dia anterior |
| Últimos 7 dias | 7 dias atrás | Agora |
| Últimos 30 dias | 30 dias atrás | Agora |
| Este mês | Dia 1 do mês atual | Agora |
| Mês passado | Dia 1 do mês anterior | Último dia do mês anterior |
| Este trimestre | Dia 1 do trimestre | Agora |
| Período customizado | Date picker | Date picker |

> **Nota:** Indicadores com `supportsPeriod: false` ignoram `startDate`/`endDate`.

---

## Permissões e Escopo de Dados por Role

### Categorias visíveis por role

| Categoria | PLATFORM_ADMIN | COMPANY_OWNER | COMPANY_ADMIN | WORKSPACE_OWNER | WORKSPACE_ADMIN | WORKSPACE_MANAGER | SALES_REP |
|-----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Vendas (Deals) | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all | ✅ own only |
| Conversas & Mensagens | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assistentes IA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Follow-Up | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reengajamento | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Disparo em Massa | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Clientes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Equipe & Usuários | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Webhooks | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Google Calendar | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Plataforma | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Financeiro / Plano | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> O endpoint `/catalog` já retorna apenas os indicadores que o usuário tem permissão de ver. Use o catálogo como fonte de verdade para saber quais indicadores exibir.

### Escopo de dados

| Role | Comportamento dos dados |
|------|------------------------|
| **SALES_REP** | Indicadores de Deals mostram apenas deals atribuídos a ele. `deals.by_user` e `deals.unassigned` não aparecem no catálogo. |
| **WORKSPACE_MANAGER** e acima | Veem dados de todo o workspace |
| **COMPANY_OWNER / COMPANY_ADMIN** | Podem selecionar workspace; dados do workspace selecionado |
| **PLATFORM_ADMIN** | Pode selecionar qualquer company/workspace ou ver dados globais |

---

## Layout Padrão por Role

Quando `GET /config` retorna `null`, o frontend deve montar um layout padrão baseado no role do usuário:

### SALES_REP
| Indicadores sugeridos |
|-----------------------|
| `deals.total`, `deals.won`, `deals.won_value`, `chat.new_today` |
| `chat.assistant_vs_human`, `assistants.active` |
| `chat.total`, `chat.unread_total` |

### WORKSPACE_MANAGER
| Indicadores sugeridos |
|-----------------------|
| `deals.total`, `deals.won_value`, `deals.win_rate`, `deals.avg_value` |
| `deals.pipeline_funnel`, `team.deals_ranking` |
| `deals.by_user`, `chat.assistant_vs_human` |
| `followup.active`, `followup.response_rate`, `reengagement.response_rate`, `customers.new_today` |

### COMPANY_OWNER
| Indicadores sugeridos |
|-----------------------|
| `billing.plan_name`, `billing.messages_usage`, `billing.deals_usage`, `deals.win_rate` |
| `deals.won_value`, `deals.expected_revenue` |
| `deals.pipeline_funnel`, `team.deals_ranking` |
| `deals.trend`, `messages.trend` |
| `broadcast.total_sent`, `followup.active`, `reengagement.response_rate`, `calendar.events_today` |

> Estes layouts são sugestões. O frontend define a posição (x, y, w, h) localmente. Os indicadores sugeridos devem ser validados contra o catálogo retornado pelo `/catalog` (caso algum não esteja disponível por permissão, ignorar).

---

## Fluxo de Personalização

```
1. Usuário abre Dashboard
2. Frontend chama GET /dashboard/v2/config
3. Se config === null → Montar layout padrão baseado no role
4. Se config !== null → Usar layout salvo
5. Frontend chama GET /dashboard/v2/indicators com os indicatorIds visíveis
6. Renderizar widgets com os dados retornados

--- Personalização ---
7. Usuário clica "Personalizar"
8. Frontend chama GET /dashboard/v2/catalog → lista indicadores disponíveis
9. Usuário arrasta/adiciona/remove widgets
10. Ao salvar → PUT /dashboard/v2/config com o novo layout
11. Ao resetar → DELETE /dashboard/v2/config (volta ao layout padrão)
```

---

## Notas de Integração

- **Cache:** Os dados podem estar cacheados por 2-30 minutos no backend (ver `meta.cachedAt`). Não é necessário implementar cache no frontend.
- **Rate Limiting:** O backend limita a 1 refresh a cada 30 segundos por usuário. Evite polling agressivo.
- **Batch:** Sempre envie todos os `indicatorId`s visíveis numa única chamada ao `/indicators` em vez de fazer múltiplas chamadas. O backend otimiza queries em batch.
- **Indicadores sem período:** Se um indicador tem `supportsPeriod: false`, os filtros `startDate`/`endDate` são ignorados pelo backend para aquele indicador.

---

## Veja também

- [PLANO_DASHBOARD_V2_BACKEND.md](./PLANO_DASHBOARD_V2_BACKEND.md) — Plano de implementação backend
