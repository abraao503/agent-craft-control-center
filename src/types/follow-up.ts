export type FollowUp = {
  id: string; // UUID
  name: string;
  message: string;
  messageQueue: MessageQueue;
  inactiveChatTime: number; // tempo em minutos
  workspaceId: string; // UUID
  assistantId: string; // UUID
  companyId: string; // UUID
  inclusiveTags?: string[]; // IDs das tags inclusivas
  exclusiveTags?: string[]; // IDs das tags exclusivas
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
