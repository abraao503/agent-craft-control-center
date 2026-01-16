// Types for Message Queue functionality
// Comments in English as per project rules

export interface MessageQueue {
  id: string;
  name: string;
  delaySeconds: number;
  isActive: boolean;
  pipelineId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface GetMessageQueueResponse {
  queue: {
    id: string;
    name: string;
    delaySeconds: number;
    isActive: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
  };
  pipeline: {
    name: string;
  };
  totalMessages: number;
}

// Helper type for components that need queue data with pipeline info
export type MessageQueueWithPipeline = GetMessageQueueResponse["queue"] &
  Pick<GetMessageQueueResponse, "pipeline" | "totalMessages">;

export interface QueuedMessageCustomer {
  name: string | null;
  phone: string;
}

export interface QueuedMessageDeal {
  title: string;
}

export interface QueuedMessage {
  id: string;
  content: string;
  customer: QueuedMessageCustomer;
  status: QueuedMessageStatus | string; // API may return lowercase
  sendAt: string | Date | null;
  createdAt: string | Date;
  deal: QueuedMessageDeal | null;
  attemptNumber?: number;
}

export enum QueuedMessageStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  SCHEDULED = "SCHEDULED",
}

export interface UpdateMessageQueueParams {
  delaySeconds?: number;
  isActive?: boolean;
}

export interface GetQueueMessagesParams {
  page?: number;
  limit?: number;
}
