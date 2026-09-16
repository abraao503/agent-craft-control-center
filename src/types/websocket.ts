export interface MessageSentEvent {
  messageId: string;
  chatId: string;
  workspaceId: string;
  sender: 'customer' | 'assistant' | 'human_assistant';
  content: string;
  type?: 'text' | 'image' | 'audio' | 'document' | 'template';
  mediaUrl?: string;
  mediaMimetype?: string;
  createdAt: Date;
  sentByUser?: { id: string; name: string } | null;
  companyWhatsappIntegrationId?: string | null;
}

export interface ChatMarkedAsReadEvent {
  chatId: string;
  workspaceId: string;
  userId?: string;
}

export interface WhatsappMessageStatusEvent {
  messageId: string;
  chatId: string;
  externalMessageId: string;
  deliveryStatus: string;
  deliveryUpdatedAt: string | Date;
  errorCode?: string;
  errorMessage?: string;
}

export interface WhatsappMessageBlockedEvent {
  chatId: string;
  clientMessageId: string;
  code: string;
  origin?: string;
}

export interface InstanceStatusEvent {
  companyWhatsappIntegrationId: string;
  workspaceId: string;
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
