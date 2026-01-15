# Implementação de Filas de Mensagem

## 📋 Visão Geral

Sistema completo para visualização e gerenciamento de filas de mensagens de reengajamento e follow-up por pipeline.

## 🗂️ Estrutura de Arquivos

### Types (`src/types/`)
- **`message-queue.ts`**: Definições TypeScript para filas de mensagem
  - `MessageQueue`: Modelo da fila
  - `MessageQueueWithPipeline`: Fila com dados do pipeline
  - `QueuedMessage`: Mensagem enfileirada
  - `QueuedMessageStatus`: Enum de status (PENDING, SENT, FAILED, SCHEDULED)
  - Interfaces para parâmetros e respostas

### Services (`src/services/message-queue/`)
- **`getPipelineQueue.ts`**: Busca dados da fila de um pipeline
- **`getQueueMessages.ts`**: Lista mensagens da fila (paginado)
- **`updatePipelineQueue.ts`**: Atualiza configurações da fila
- **`pausePipelineQueue.ts`**: Pausa processamento da fila
- **`resumePipelineQueue.ts`**: Retoma processamento da fila

### Componentes (`src/components/message-queue/`)
- **`QueueHeader.tsx`**: Cabeçalho com info e controles da fila
- **`QueueSettingsDialog.tsx`**: Dialog para configurar fila
- **`index.ts`**: Exports dos componentes

### Páginas (`src/pages/`)
- **`MessageQueuePage.tsx`**: Página principal de visualização da fila

## 🔌 Rotas da API

Conforme especificado em `API_FILA_MENSAGENS.md`:

- `GET /api/pipelines/:pipelineId/message-queue` - Buscar fila do pipeline
- `GET /api/message-queues/:messageQueueId/messages` - Listar mensagens (paginado)
- `PATCH /api/pipelines/:pipelineId/message-queue` - Atualizar configurações
- `POST /api/pipelines/:pipelineId/message-queue/pause` - Pausar fila
- `POST /api/pipelines/:pipelineId/message-queue/resume` - Retomar fila

## 🎨 Componentes UI

### QueueHeader
Exibe informações da fila e controles de ação.

**Props:**
- `queue`: Dados da fila com pipeline
- `pipelineId`: ID do pipeline
- `onOpenSettings`: Callback para abrir configurações
- `canUpdate`: Permissão para atualizar

**Features:**
- Badge de status (Ativa/Pausada)
- Exibição de delay formatado (segundos, minutos, horas)
- Contador de mensagens pendentes
- Botões Pausar/Retomar
- Botão de configurações

### QueueSettingsDialog
Dialog para configurar parâmetros da fila.

**Props:**
- `queue`: Dados da fila
- `pipelineId`: ID do pipeline
- `open`: Estado do dialog
- `onOpenChange`: Callback de mudança de estado

**Features:**
- Input de delay (10-3600 segundos)
- Switch de ativação
- Validação de valores
- Loading state durante update

## 🧭 Navegação

### Rota Principal
```
/deals/pipeline/:pipelineId/queue
```

### Integração
- Botão "Fila de Mensagens" adicionado em `PipelineDetailPage`
- Navegação com breadcrumb (voltar para Pipeline)

## 🔐 Permissões

### Visualização
- `view:pipeline` - Ver fila e mensagens

### Gerenciamento
- `update:pipeline` - Configurar, pausar, retomar fila

## 📊 Paginação

Utiliza o componente `SmartPagination` com:
- 10 itens por página
- Label customizado: "mensagens"
- Contador de itens visível
- Persistência de dados entre páginas

## 🎯 Funcionalidades Principais

### 1. Visualização da Fila
- Informações do pipeline associado
- Status ativo/pausado
- Delay entre mensagens
- Total de mensagens pendentes

### 2. Listagem de Mensagens
- **Tabela responsiva** com colunas organizadas
- **Todas as mensagens** exibidas (pendentes, enviadas, falhadas, agendadas)
- **Ordenação:** Mais recentes primeiro (`createdAt` DESC)
- Status visual com badges coloridos
- **Datas objetivas** no formato `dd/MM/yyyy às HH:mm`
- Informações do cliente (nome e telefone)
- Preview da mensagem (2 linhas)
- Negócio associado
- Data de envio agendado (quando aplicável)
- Número de tentativas
- Paginação inteligente

### 3. Configuração
- Ajuste de delay (10s a 1h)
- Ativação/desativação da fila
- Validação de valores
- Feedback de sucesso/erro

### 4. Controle de Processamento
- Pausar fila (desativa processamento)
- Retomar fila (ativa processamento)
- Confirmação visual imediata

## 🔄 Gestão de Estado

### React Query
```typescript
// Cache da fila
["pipelineQueue", pipelineId]

// Cache de mensagens (por página)
["queueMessages", messageQueueId, currentPage]
```

### Invalidação
- Após atualizar configurações
- Após pausar/retomar
- Mantém dados anteriores durante navegação (placeholderData)

## 📱 Responsividade

- Tabela responsiva com scroll horizontal em telas pequenas
- Layout adaptável em todas as telas
- Paginação otimizada para mobile

## 🎨 Estados Visuais

### Loading States
- Spinner centralizado no carregamento inicial
- Loading inline nos botões durante mutations

### Empty States
- Mensagem quando não há mensagens pendentes
- Alert informativo

### Error States
- Alert destrutivo para erros de permissão
- Alert destrutivo para erros de carregamento
- Toasts para erros em mutations

## 🧪 Validações

### Delay (delaySeconds)
- Mínimo: 10 segundos
- Máximo: 3600 segundos (1 hora)
- Validação no frontend e backend

### Permissões
- Verificação antes de renderizar controles
- Mensagens claras quando sem permissão

## 📈 Melhorias Futuras Possíveis

1. **Filtros**
   - Por status de mensagem
   - Por data de envio
   - Por cliente/negócio

2. **Ações em Massa**
   - Cancelar mensagens
   - Reagendar mensagens

3. **Detalhes da Mensagem**
   - Modal com mais informações
   - Histórico de tentativas
   - Logs de erro

4. **Estatísticas**
   - Taxa de envio bem-sucedido
   - Tempo médio na fila
   - Gráficos de performance

5. **WebSocket**
   - Atualização em tempo real
   - Notificações de novos envios

## 🔗 Relacionamentos

```
Pipeline
  ↓
MessageQueue (1:1)
  ↓
QueuedMessage[] (1:N)
  ↓
Customer (N:1)
  ↓
Deal (N:1, opcional)
```

## 📚 Documentação Relacionada

- `API_FILA_MENSAGENS.md` - Especificação completa da API
- `.github/instructions/project.instructions.md` - Padrões do projeto
- `docs/api/SISTEMA_ROLES_PERMISSOES.md` - Sistema de permissões

## ✅ Checklist de Implementação

- [x] Types criados
- [x] Services de API implementados
- [x] Componentes UI desenvolvidos
- [x] Página principal criada
- [x] Rota configurada no App.tsx
- [x] Integração com PipelineDetailPage
- [x] Permissões verificadas
- [x] Paginação implementada
- [x] Loading/Error states
- [x] Responsividade
- [x] Validações
- [x] Documentação

---

**Implementado por:** GitHub Copilot  
**Data:** Janeiro 2026  
**Versão:** 1.0
