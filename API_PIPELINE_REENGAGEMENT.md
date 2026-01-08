# API Pipeline - ReengagementConfig

Documentação completa para integração do front-end com o sistema de reengajamento de pipelines.

## Índice
- [Visão Geral](#visão-geral)
- [Criar Pipeline](#criar-pipeline)
- [Atualizar Pipeline](#atualizar-pipeline)
- [Listar Stages do Pipeline](#listar-stages-do-pipeline)
- [Tipos TypeScript](#tipos-typescript)
- [Exemplos](#exemplos)

---

## Visão Geral

O sistema de reengajamento permite configurar mensagens automáticas para deals inativos em cada stage do pipeline. A configuração é feita por stage e inclui:

- **Filtros de Tags**: Controle quais deals devem ser incluídos ou excluídos
- **Tempo de Inatividade**: Define quanto tempo um chat precisa estar inativo
- **Limite de Mensagens**: Quantidade máxima de tentativas de reengajamento
- **Intervalo**: Tempo entre cada mensagem de reengajamento
- **Mensagens**: Array de mensagens que serão enviadas em sequência

---

## Criar Pipeline

### Endpoint
```
POST /pipeline
```

### Headers
```
Authorization: Bearer {token}
```

### Body
```typescript
{
  workspaceId: string;
  name: string;
  description?: string;
  assistantId: string | null;
  stages: Array<{
    name: string;
    description?: string;
    order: number;
    color?: string;
    winProbability: number;
    assistantPipelineStage?: {
      canCreateFollowUp: boolean;
      assistantAllowedTargetStages: Array<{
        targetStageId: string;  // ID de outro stage no array
        targetStageName: string;
        moveCondition: string;
      }>;
    } | null;
    reengagementConfig?: {
      minInactiveChatTimeHours: number;      // Mínimo: 1
      maxMessages: number;                    // Mínimo: 1
      intervalBetweenMessagesHours: number;   // Mínimo: 1
      messages: string[];                     // Array com 1+ mensagens
      includeTags?: string[];                 // UUIDs das tags a incluir (vazio = todos)
      excludeTags?: string[];                 // UUIDs das tags a excluir
      isActive?: boolean;                     // Default: true
    } | null;
  }>;
}
```

### Validações

#### `reengagementConfig`
- **minInactiveChatTimeHours**: Inteiro >= 1
- **maxMessages**: Inteiro >= 1
- **intervalBetweenMessagesHours**: Inteiro >= 1
- **messages**: Array não vazio, cada mensagem deve ter no mínimo 1 caractere
- **includeTags**: Array opcional de UUIDs das tags
- **excludeTags**: Array opcional de UUIDs das tags
- **isActive**: Boolean opcional (default: true)

#### Lógica de Filtros de Tags
1. **includeTags** (filtro de inclusão):
   - Se vazio ou não informado: **todos os deals são considerados**
   - Se informado: **apenas deals com pelo menos uma das tags** serão processados

2. **excludeTags** (filtro de exclusão):
   - Se vazio ou não informado: **nenhum deal é excluído**
   - Se informado: **deals com qualquer uma dessas tags são excluídos**

3. **Ordem de aplicação**: Primeiro aplica `includeTags`, depois aplica `excludeTags`

### Response
```typescript
{
  id: string;
  name: string;
}
```

### Exemplo de Request
```json
{
  "workspaceId": "workspace-123",
  "name": "Pipeline de Vendas",
  "description": "Pipeline principal",
  "assistantId": "assistant-456",
  "stages": [
    {
      "name": "Lead Novo",
      "description": "Leads que acabaram de entrar",
      "order": 0,
      "color": "#3B82F6",
      "winProbability": 10,
      "reengagementConfig": {
        "minInactiveChatTimeHours": 24,
        "maxMessages": 3,
        "intervalBetweenMessagesHours": 48,
        "messages": [
          "Olá! Vi que você demonstrou interesse em nossos produtos. Posso ajudar?",
          "Oi! Ainda está interessado? Tenho algumas ofertas especiais para você.",
          "Última chance! Não perca essa oportunidade."
        ],
        "includeTags": ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
        "excludeTags": ["550e8400-e29b-41d4-a716-446655440003", "550e8400-e29b-41d4-a716-446655440004"],
        "isActive": true
      }
    },
    {
      "name": "Proposta Enviada",
      "order": 1,
      "color": "#10B981",
      "winProbability": 60,
      "reengagementConfig": {
        "minInactiveChatTimeHours": 72,
        "maxMessages": 2,
        "intervalBetweenMessagesHours": 96,
        "messages": [
          "Olá! Gostaria de tirar alguma dúvida sobre a proposta?",
          "Estamos à disposição para ajustar a proposta conforme sua necessidade."
        ],
        "excludeTags": ["550e8400-e29b-41d4-a716-446655440005"],
        "isActive": true
      }
    },
    {
      "name": "Negociação",
      "order": 2,
      "color": "#F59E0B",
      "winProbability": 80,
      "reengagementConfig": null
    }
  ]
}
```

---

## Atualizar Pipeline

### Endpoint
```
PATCH /pipeline/:pipelineId
```

### Headers
```
Authorization: Bearer {token}
```

### Query Parameters
```
workspaceId: string
```

### Body
```typescript
{
  name?: string;
  description?: string;
  assistantId?: string | null;
  stages?: Array<{
    id?: string;  // Se informado, atualiza stage existente. Se omitido, cria novo stage
    name: string;
    description?: string;
    order: number;
    color?: string;
    winProbability: number;
    assistantPipelineStage?: {
      canCreateFollowUp: boolean;
      assistantAllowedTargetStages: Array<{
        targetStageId: string;
        targetStageName: string;
        moveCondition: string;
      }>;
    } | null;
    reengagementConfig?: {
      minInactiveChatTimeHours: number;
      maxMessages: number;
      intervalBetweenMessagesHours: number;
      messages: string[];
      includeTags?: string[];
      excludeTags?: string[];
      isActive?: boolean;
    } | null;
  }>;
}
```

### Comportamento da Atualização

#### Stages
- **Stage com `id`**: Atualiza o stage existente
- **Stage sem `id`**: Cria um novo stage
- **Stages não incluídos no array**: São mantidos (não deletados)

#### ReengagementConfig
- **`reengagementConfig: null`**: Remove a configuração existente
- **`reengagementConfig: { ... }`**: Cria ou atualiza a configuração
- **`reengagementConfig` não informado**: Mantém configuração existente

### Response
```typescript
{
  id: string;
  name: string;
}
```

### Exemplo de Request - Atualizar Reengagement
```json
{
  "stages": [
    {
      "id": "stage-123",
      "name": "Lead Novo",
      "order": 0,
      "color": "#3B82F6",
      "winProbability": 10,
      "reengagementConfig": {
        "minInactiveChatTimeHours": 48,
        "maxMessages": 4,
        "intervalBetweenMessagesHours": 72,
        "messages": [
          "Nova mensagem 1",
          "Nova mensagem 2",
          "Nova mensagem 3",
          "Nova mensagem 4"
        ],
        "includeTags": ["550e8400-e29b-41d4-a716-446655440006"],
        "excludeTags": ["550e8400-e29b-41d4-a716-446655440007"],
        "isActive": true
      }
    }
  ]
}
```

### Exemplo de Request - Remover Reengagement
```json
{
  "stages": [
    {
      "id": "stage-123",
      "name": "Lead Novo",
      "order": 0,
      "color": "#3B82F6",
      "winProbability": 10,
      "reengagementConfig": null
    }
  ]
}
```

---

## Listar Stages do Pipeline

### Endpoint
```
GET /pipeline/:pipelineId/stages
```

### Headers
```
Authorization: Bearer {token}
```

### Query Parameters
```
workspaceId: string
```

### Response
```typescript
Array<{
  id: string;
  name: string;
  winProbability: number;
  order: number;
  color: string | null;
  assistantPipelineStage: {
    assistantId: string;
    canCreateFollowUp: boolean;
    assistantAllowedTargetStages: Array<{
      targetStageId: string;
      moveCondition: string;
    }>;
  } | null;
  reengagementConfig: {
    id: string;
    minInactiveChatTimeHours: number;
    maxMessages: number;
    messagingIntervalHours: number;
    messages: string[];
    includeTags: string[];
    excludeTags: string[];
    isActive: boolean;
  } | null;
}>
```

### Exemplo de Response
```json
[
  {
    "id": "stage-123",
    "name": "Lead Novo",
    "winProbability": 10,
    "order": 0,
    "color": "#3B82F6",
    "assistantPipelineStage": null,
    "reengagementConfig": {
      "id": "reengagement-456",
      "minInactiveChatTimeHours": 24,
      "maxMessages": 3,
      "messagingIntervalHours": 48,
      "messages": [
        "Olá! Vi que você demonstrou interesse em nossos produtos. Posso ajudar?",
        "Oi! Ainda está interessado? Tenho algumas ofertas especiais para você.",
        "Última chance! Não perca essa oportunidade."
      ],
      "includeTags": ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
      "excludeTags": ["550e8400-e29b-41d4-a716-446655440003"],
      "isActive": true
    }
  },
  {
    "id": "stage-124",
    "name": "Proposta Enviada",
    "winProbability": 60,
    "order": 1,
    "color": "#10B981",
    "assistantPipelineStage": {
      "assistantId": "assistant-789",
      "canCreateFollowUp": true,
      "assistantAllowedTargetStages": [
        {
          "targetStageId": "stage-125",
          "moveCondition": "won"
        }
      ]
    },
    "reengagementConfig": null
  }
]
```

---

## Tipos TypeScript

### Interfaces Completas

```typescript
// ============================================
// CREATE PIPELINE
// ============================================

interface CreatePipelineRequest {
  workspaceId: string;
  name: string;
  description?: string;
  assistantId: string | null;
  stages: CreatePipelineStage[];
}

interface CreatePipelineStage {
  name: string;
  description?: string;
  order: number;
  color?: string;
  winProbability: number;
  assistantPipelineStage?: AssistantPipelineStageConfig | null;
  reengagementConfig?: ReengagementConfigInput | null;
}

interface AssistantPipelineStageConfig {
  canCreateFollowUp: boolean;
  assistantAllowedTargetStages: Array<{
    targetStageId: string;
    targetStageName: string;
    moveCondition: string;
  }>;
}

interface ReengagementConfigInput {
  minInactiveChatTimeHours: number;      // >= 1
  maxMessages: number;                    // >= 1
  intervalBetweenMessagesHours: number;   // >= 1
  messages: string[];                     // min 1 item, cada item min 1 char
  includeTags?: string[];                 // opcional, array de UUIDs, default: []
  excludeTags?: string[];                 // opcional, array de UUIDs, default: []
  isActive?: boolean;                     // opcional, default: true
}

interface CreatePipelineResponse {
  id: string;
  name: string;
}

// ============================================
// UPDATE PIPELINE
// ============================================

interface UpdatePipelineRequest {
  name?: string;
  description?: string;
  assistantId?: string | null;
  stages?: UpdatePipelineStage[];
}

interface UpdatePipelineStage {
  id?: string;  // Se presente, atualiza. Se ausente, cria novo
  name: string;
  description?: string;
  order: number;
  color?: string;
  winProbability: number;
  assistantPipelineStage?: AssistantPipelineStageConfig | null;
  reengagementConfig?: ReengagementConfigInput | null;
}

interface UpdatePipelineResponse {
  id: string;
  name: string;
}

// ============================================
// GET PIPELINE STAGES
// ============================================

interface GetPipelineStagesResponse {
  id: string;
  name: string;
  winProbability: number;
  order: number;
  color: string | null;
  assistantPipelineStage: {
    assistantId: string;
    canCreateFollowUp: boolean;
    assistantAllowedTargetStages: Array<{
      targetStageId: string;
      moveCondition: string;
    }>;
  } | null;
  reengagementConfig: {
    id: string;
    minInactiveChatTimeHours: number;
    maxMessages: number;
    messagingIntervalHours: number;
    messages: string[];
    includeTags: string[];
    excludeTags: string[];
    isActive: boolean;
  } | null;
}
```

---

## Exemplos

### Exemplo 1: Pipeline com Reengagement Básico

```typescript
const createPipeline = async () => {
  const response = await fetch('/pipeline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      workspaceId: 'workspace-123',
      name: 'Pipeline de Vendas',
      assistantId: null,
      stages: [
        {
          name: 'Lead Novo',
          order: 0,
          color: '#3B82F6',
          winProbability: 10,
          reengagementConfig: {
            minInactiveChatTimeHours: 24,
            maxMessages: 2,
            intervalBetweenMessagesHours: 48,
            messages: [
              'Olá! Posso ajudar?',
              'Última chance!'
            ],
            isActive: true
          }
        }
      ]
    })
  });

  return await response.json();
};
```

### Exemplo 2: Atualizar apenas Reengagement Config

```typescript
const updateReengagement = async (pipelineId: string, stageId: string) => {
  const response = await fetch(
    `/pipeline/${pipelineId}?workspaceId=workspace-123`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        stages: [{
          id: stageId,
          name: 'Lead Novo',
          order: 0,
          color: '#3B82F6',
          winProbability: 10,
          reengagementConfig: {
            minInactiveChatTimeHours: 48,
            maxMessages: 3,
            intervalBetweenMessagesHours: 72,
            messages: ['Msg 1', 'Msg 2', 'Msg 3'],
            includeTags: ['550e8400-e29b-41d4-a716-446655440006'],
            excludeTags: ['550e8400-e29b-41d4-a716-446655440007'],
            isActive: true
          }
        }]
      })
    }
  );

  return await response.json();
};
```

### Exemplo 3: Listar Stages e verificar Reengagement

```typescript
const getStagesWithReengagement = async (pipelineId: string) => {
  const response = await fetch(
    `/pipeline/${pipelineId}/stages?workspaceId=workspace-123`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const stages = await response.json();

  // Filtrar apenas stages com reengagement ativo
  const stagesWithActiveReengagement = stages.filter(
    stage => stage.reengagementConfig?.isActive
  );

  return stagesWithActiveReengagement;
};
```

### Exemplo 4: Formulário de Reengagement Config

```typescript
interface ReengagementFormData {
  enabled: boolean;
  minInactiveChatTimeHours: number;
  maxMessages: number;
  intervalBetweenMessagesHours: number;
  messages: string[];
  includeTags: string[];
  excludeTags: string[];
}

const ReengagementForm: React.FC = () => {
  const [formData, setFormData] = useState<ReengagementFormData>({
    enabled: true,
    minInactiveChatTimeHours: 24,
    maxMessages: 3,
    intervalBetweenMessagesHours: 48,
    messages: [''],
    includeTags: [],
    excludeTags: []
  });

  const handleSubmit = async () => {
    const reengagementConfig = formData.enabled ? {
      minInactiveChatTimeHours: formData.minInactiveChatTimeHours,
      maxMessages: formData.maxMessages,
      intervalBetweenMessagesHours: formData.intervalBetweenMessagesHours,
      messages: formData.messages.filter(m => m.trim()),
      includeTags: formData.includeTags,
      excludeTags: formData.excludeTags,
      isActive: true
    } : null;

    // Enviar para API...
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        <input
          type="checkbox"
          checked={formData.enabled}
          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
        />
        Habilitar Reengajamento
      </label>

      {formData.enabled && (
        <>
          <input
            type="number"
            min="1"
            value={formData.minInactiveChatTimeHours}
            onChange={(e) => setFormData({
              ...formData,
              minInactiveChatTimeHours: Number(e.target.value)
            })}
            placeholder="Horas de inatividade"
          />

          <input
            type="number"
            min="1"
            value={formData.maxMessages}
            onChange={(e) => setFormData({
              ...formData,
              maxMessages: Number(e.target.value)
            })}
            placeholder="Máximo de mensagens"
          />

          <input
            type="number"
            min="1"
            value={formData.intervalBetweenMessagesHours}
            onChange={(e) => setFormData({
              ...formData,
              intervalBetweenMessagesHours: Number(e.target.value)
            })}
            placeholder="Intervalo entre mensagens (horas)"
          />

          {/* Tags de Inclusão */}
          <TagSelector
            label="Tags para Incluir (vazio = todos)"
            selectedTags={formData.includeTags}
            onChange={(tags) => setFormData({ ...formData, includeTags: tags })}
          />

          {/* Tags de Exclusão */}
          <TagSelector
            label="Tags para Excluir"
            selectedTags={formData.excludeTags}
            onChange={(tags) => setFormData({ ...formData, excludeTags: tags })}
          />

          {/* Mensagens */}
          {formData.messages.map((msg, idx) => (
            <textarea
              key={idx}
              value={msg}
              onChange={(e) => {
                const newMessages = [...formData.messages];
                newMessages[idx] = e.target.value;
                setFormData({ ...formData, messages: newMessages });
              }}
              placeholder={`Mensagem ${idx + 1}`}
            />
          ))}

          <button
            type="button"
            onClick={() => setFormData({
              ...formData,
              messages: [...formData.messages, '']
            })}
          >
            Adicionar Mensagem
          </button>
        </>
      )}

      <button type="submit">Salvar</button>
    </form>
  );
};
```

---

## Notas Importantes

### 🔄 Filtros de Tags - Fluxo de Processamento

1. **Sem filtros**: Todos os deals inativos são processados
2. **Apenas includeTags**: Processa apenas deals que têm pelo menos uma das tags
3. **Apenas excludeTags**: Processa todos, exceto os que têm alguma tag da lista
4. **Ambos**: Primeiro filtra por inclusão, depois aplica exclusão

### 📊 Cenários de Uso

#### Cenário 1: Incluir apenas leads quentes
```json
{
  "includeTags": ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
  "excludeTags": []
}
```
**Resultado**: Apenas deals com as tags especificadas (UUID1 OU UUID2) serão reengajados.

#### Cenário 2: Excluir clientes que não querem contato
```json
{
  "includeTags": [],
  "excludeTags": ["550e8400-e29b-41d4-a716-446655440003", "550e8400-e29b-41d4-a716-446655440004"]
}
```
**Resultado**: Todos os deals, EXCETO os que têm as tags especificadas (UUID3 OU UUID4).

#### Cenário 3: Incluir VIPs, excluir inadimplentes
```json
{
  "includeTags": ["550e8400-e29b-41d4-a716-446655440005", "550e8400-e29b-41d4-a716-446655440006"],
  "excludeTags": ["550e8400-e29b-41d4-a716-446655440007"]
}
```
**Resultado**: Apenas deals com tags VIP/Premium (UUID5 OU UUID6) que NÃO têm a tag inadimplente (UUID7).

### ⚡ Performance

- O sistema processa até 1000 deals por execução
- Filtros de tags são aplicados diretamente no banco (SQL)
- Configurações inativas (`isActive: false`) não são processadas

### 🔒 Segurança

- Todas as rotas requerem autenticação via Bearer token
- Validação de permissões (`view:pipeline`, etc.)
- Validação de workspaceId e companyId em todas as operações

---

## Suporte

Para dúvidas ou problemas, consulte:
- [PLANO_DESENVOLVIMENTO_REENGAGEMENT.md](./PLANO_DESENVOLVIMENTO_REENGAGEMENT.md)
- [ARQUITETURA_API.md](./ARQUITETURA_API.md)
