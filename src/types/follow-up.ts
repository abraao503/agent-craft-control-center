/**
 * IMPORTANTE: Este arquivo contém tipos para o recurso de mensagens em fila
 * que no backend é chamado de "follow-up" mas no frontend chamamos de
 * "Agendamento de Mensagens" para melhor UX.
 *
 * Este é um recurso diferente do "reengagementConfig" (Follow-up) nas pipelines.
 *
 * API endpoints: /follow-ups, /message-queues
 */

export type FollowUp = {
  id: string; // UUID
  name: string;
  messages: string[];
  messageQueue: MessageQueue;
  minInactiveChatTime: number; // tempo mínimo em minutos
  maxInactiveChatTime: number; // tempo máximo em minutos
  workspaceId: string; // UUID
  assistantId: string; // UUID
  companyId: string; // UUID
  inclusiveTags?: string[]; // IDs das tags inclusivas
  exclusiveTags?: string[]; // IDs das tags exclusivas
  responseTags?: string[]; // IDs das tags que serão atribuídas ao chat quando o follow-up for respondido
  maxMessages?: number; // número máximo de follow-ups a serem enviados
  totalQueuedMessages?: number;
  totalQueuedMessagesSent?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type MessageQueue = {
  id: string;
  name: string;
  delaySeconds: number;
  isActive: boolean;
  workspaceId: string;
  companyId: string;
  followUpId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type QueuedMessage = {
  id: string; // UUID
  messageQueueId: string; // UUID
  content: string;
  status: "pending" | "sent" | "failed" | "canceled" | "scheduled";
  createdAt: Date;
  updatedAt: Date;
  sentAt: Date | null; // Data de envio
  customer: {
    id: string;
    phone: string;
    identifier: string;
  };
};

export type Pagination<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
