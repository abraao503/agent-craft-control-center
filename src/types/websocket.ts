export interface MessageSentEvent {
  messageId: string;
  chatId: string;
  workspaceId: string;
  sender: 'customer' | 'assistant' | 'human_assistant';
  content: string;
  type?: 'text' | 'image' | 'audio' | 'document';
  mediaUrl?: string;
  mediaMimetype?: string;
  createdAt: Date;
}

export interface ChatMarkedAsReadEvent {
  chatId: string;
  workspaceId: string;
}

export interface InstanceStatusEvent {
  companyWhatsappIntegrationId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'open' | 'close';
}

export interface QrCodeGeneratedEvent {
  companyWhatsappIntegrationId: string;
  qrCode: string;
}

export interface JoinWorkspacePayload {
  workspaceId: string;
}

export interface MarkChatAsReadPayload {
  chatId: string;
}
