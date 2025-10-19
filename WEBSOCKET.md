# WebSocket Documentation

Este documento descreve como conectar e interagir com o sistema de WebSocket para receber eventos em tempo real e executar ações.

## Índice

- [Conexão](#conexão)
- [Autenticação](#autenticação)
- [Entrar em um Workspace](#entrar-em-um-workspace)
- [Eventos Disponíveis](#eventos-disponíveis)
- [Ações Disponíveis](#ações-disponíveis)
- [Exemplos Práticos](#exemplos-práticos)
- [Tratamento de Erros](#tratamento-de-erros)

---

## Conexão

### Endpoint

```
ws://localhost:3000
```

ou em produção:

```
wss://your-domain.com
```

### Bibliotecas Recomendadas

**JavaScript/TypeScript:**
```bash
npm install socket.io-client
```

---

## Autenticação

A conexão ao WebSocket requer um token JWT válido.

### Exemplo de Conexão

```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  auth: {
    token: 'Bearer YOUR_JWT_TOKEN'
  }
});
```

### Eventos de Conexão

```typescript
socket.on('connect', () => {
  console.log('Conectado ao WebSocket:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Desconectado:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Erro de conexão:', error.message);
});
```

---

## Entrar em um Workspace

Após conectar, você **deve** informar qual workspace deseja monitorar.

### Entrar em um Workspace

```typescript
socket.emit('join:workspace', { 
  workspaceId: 'workspace-uuid-here' 
});

socket.on('joined:workspace', (data) => {
  console.log('Entrou no workspace:', data);
  // data: { workspaceId: string, clientId: string }
});
```

### Sair de um Workspace

```typescript
socket.emit('leave:workspace', { 
  workspaceId: 'workspace-uuid-here' 
});

socket.on('left:workspace', (data) => {
  console.log('Saiu do workspace:', data);
  // data: { workspaceId: string, clientId: string }
});
```

---

## Eventos Disponíveis

### 1. Nova Mensagem Enviada

Recebe notificação quando uma nova mensagem é enviada.

```typescript
socket.on('message:sent', (event) => {
  console.log('Nova mensagem:', event);
});
```

**Payload do Evento:**
```typescript
{
  messageId: string;
  chatId: string;
  workspaceId: string;
  sender: 'customer' | 'assistant' | 'human_assistant';
  content: string;
  createdAt: Date;
}
```

### 2. Chat Marcado como Lido

Recebe notificação quando um chat é marcado como lido.

```typescript
socket.on('chat:marked-as-read', (event) => {
  console.log('Chat marcado como lido:', event);
});
```

**Payload do Evento:**
```typescript
{
  chatId: string;
  workspaceId: string;
}
```

### 3. Status da Instância WhatsApp

Recebe notificação quando o status de uma instância WhatsApp é atualizado.

```typescript
socket.on('instance:status', (event) => {
  console.log('Status da instância atualizado:', event);
});
```

**Payload do Evento:**
```typescript
{
  companyWhatsappIntegrationId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
}
```

**Nota:** Este evento é emitido para o workspace quando há mudanças no status da conexão WhatsApp.

### 4. QR Code Gerado

Recebe notificação quando um QR Code é gerado para conexão WhatsApp.

```typescript
socket.on('qr:generated', (event) => {
  console.log('QR Code gerado:', event);
  // Exibir QR Code para usuário escanear
});
```

**Payload do Evento:**
```typescript
{
  companyWhatsappIntegrationId: string;
  qrCode: string; // Base64 ou URL do QR Code
}
```

**Nota:** Este evento é emitido para o workspace quando um novo QR Code precisa ser escaneado para conectar a instância WhatsApp.

---

## Ações Disponíveis

### Marcar Chat como Lido

```typescript
socket.emit('chat:mark-as-read', { 
  chatId: 'chat-uuid-here' 
});
```

**Resposta de Sucesso:**
```typescript
socket.on('chat:marked-as-read', (data) => {
  console.log('Chat marcado como lido:', data);
});
```

**Resposta de Erro:**
```typescript
socket.on('error', (data) => {
  console.error('Erro:', data.message);
});
```

---

## Exemplos Práticos

### Exemplo Completo - React

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function useWebSocket(workspaceId: string, token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('ws://localhost:3000', {
      auth: { token: `Bearer ${token}` }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join:workspace', { workspaceId });
    });

    newSocket.on('joined:workspace', (data) => {
      console.log('Entrou no workspace:', data.workspaceId);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('message:sent', (event) => {
      console.log('Nova mensagem:', event);
    });

    newSocket.on('chat:marked-as-read', (event) => {
      console.log('Chat marcado como lido:', event.chatId);
    });

    newSocket.on('error', (data) => {
      console.error('Erro WebSocket:', data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave:workspace', { workspaceId });
      newSocket.disconnect();
    };
  }, [workspaceId, token]);

  return { socket, connected };
}

function ChatComponent() {
  const { socket, connected } = useWebSocket(
    'workspace-uuid',
    'your-jwt-token'
  );

  const markChatAsRead = (chatId: string) => {
    if (socket && connected) {
      socket.emit('chat:mark-as-read', { chatId });
    }
  };

  return (
    <div>
      <p>Status: {connected ? 'Conectado' : 'Desconectado'}</p>
      <button onClick={() => markChatAsRead('chat-uuid')}>
        Marcar como lido
      </button>
    </div>
  );
}
```

### Exemplo - Vanilla JavaScript

```javascript
const socket = io('ws://localhost:3000', {
  auth: { token: 'Bearer YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Conectado');
  socket.emit('join:workspace', { workspaceId: 'workspace-uuid' });
});

socket.on('message:sent', (event) => {
  console.log('Nova mensagem:', event);
});

socket.on('chat:marked-as-read', (event) => {
  console.log('Chat marcado como lido:', event.chatId);
});

document.getElementById('mark-read-btn').addEventListener('click', () => {
  socket.emit('chat:mark-as-read', { chatId: 'chat-uuid' });
});
```

---

## Tratamento de Erros

```typescript
socket.on('error', (data) => {
  switch (data.message) {
    case 'Unauthorized':
      console.error('Token inválido ou expirado');
      break;
      
    case 'Unauthorized or workspace not joined':
      console.error('Você precisa entrar em um workspace primeiro');
      socket.emit('join:workspace', { workspaceId: 'workspace-uuid' });
      break;
      
    case 'Chat not found':
      console.error('Chat não encontrado');
      break;
      
    default:
      console.error('Erro desconhecido:', data.message);
  }
});
```

### Reconexão Automática

```typescript
const socket = io('ws://localhost:3000', {
  auth: { token: 'Bearer YOUR_JWT_TOKEN' },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconectado após', attemptNumber, 'tentativas');
  socket.emit('join:workspace', { workspaceId: 'workspace-uuid' });
});
```

---

## Tipos TypeScript

```typescript
interface MessageSentEvent {
  messageId: string;
  chatId: string;
  workspaceId: string;
  sender: 'customer' | 'assistant' | 'human_assistant';
  content: string;
  createdAt: Date;
}

interface ChatMarkedAsReadEvent {
  chatId: string;
  workspaceId: string;
}

interface InstanceStatusEvent {
  companyWhatsappIntegrationId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
}

interface QrCodeGeneratedEvent {
  companyWhatsappIntegrationId: string;
  qrCode: string;
}

interface JoinWorkspacePayload {
  workspaceId: string;
}

interface MarkChatAsReadPayload {
  chatId: string;
}
```

---

## Mudanças de Arquitetura

### Migração de Company para Workspace

**Versão Anterior (Deprecated):**
- Eventos eram emitidos por `companyId`
- Todos dispositivos da company recebiam eventos
- Métodos: `emitInstanceStatusToCompany()`, `emitQrCodeGeneratedToCompany()`

**Versão Atual:**
- Eventos são emitidos por `workspaceId`
- Apenas dispositivos do workspace específico recebem eventos
- Métodos: `emitInstanceStatusToWorkspace()`, `emitQrCodeGeneratedToWorkspace()`

**Benefícios da Mudança:**
- ✅ **Melhor Isolamento**: Eventos segmentados por workspace
- ✅ **Controle Granular**: Cliente escolhe quais workspaces monitorar
- ✅ **Escalabilidade**: Reduz tráfego desnecessário de eventos
- ✅ **Flexibilidade**: Permite múltiplos workspaces por company

**Métodos Atualizados:**

| Método Anterior | Método Atual | Descrição |
|----------------|--------------|-----------|
| `emitMessageSentToCompany()` | `emitMessageSentToWorkspace()` | Emite evento de nova mensagem |
| `emitChatMarkedAsReadToCompany()` | `emitChatMarkedAsReadToWorkspace()` | Emite evento de chat lido |
| `emitInstanceStatusToCompany()` | `emitInstanceStatusToWorkspace()` | Emite status da instância WhatsApp |
| `emitQrCodeGeneratedToCompany()` | `emitQrCodeGeneratedToWorkspace()` | Emite QR Code gerado |

**Impacto na Integração:**
- Frontend deve informar `workspaceId` ao conectar via `join:workspace`
- Todos os eventos agora incluem `workspaceId` no payload
- Necessário re-entrar no workspace após reconexão
