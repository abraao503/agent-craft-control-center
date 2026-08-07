// Types for Mass Broadcast (Disparo em Massa)
// Used for managing WhatsApp mass messaging campaigns

export type MassBroadcastStatus =
  | "DRAFT"
  | "PROCESSING"
  | "READY"
  | "SENDING"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type MassBroadcastRecipientStatus =
  | "PENDING"
  | "QUEUED"
  | "SENT"
  | "FAILED"
  | "SKIPPED";

export interface MassBroadcast {
  id: string;
  companyId: string;
  workspaceId: string;
  createdByUserId: string;
  name: string;
  messageVariations: string[];
  pipelineId: string;
  status: MassBroadcastStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount?: number;
  deliveredCount?: number;
  readCount?: number;
  provider?: string | null;
  metaTemplateId?: string | null;
  metaTemplateLanguage?: string | null;
  metaTemplateBindings?: Record<string, unknown> | null;
  configurationState?: "READY" | "REQUIRES_TEMPLATE" | string;
  customerIds: string[];
  includeTagIds: string[];
  excludeTagIds: string[];
  pipelineStageIds: string[];
  applyTagIds: string[];
  messageDelaySeconds: number;
  startTime: string | null;
  endTime: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MassBroadcastRecipient {
  id: string;
  massBroadcastId: string;
  customerId: string;
  customerPhone: string;
  chatId: string;
  status: MassBroadcastRecipientStatus;
  dispatchStatus?: string;
  deliveryStatus?: string;
  skipReason?: string | null;
  messageContent: string;
  messageId: string | null;
  sentAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  tagsApplied: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MassBroadcastRecipientsSummary {
  total: number;
  pending: number;
  queued: number;
  sent: number;
  failed: number;
  cancelled: number;
  skipped: number;
}

export interface MassBroadcastWithSummary extends MassBroadcast {
  recipientsSummary: MassBroadcastRecipientsSummary;
}

export interface PreviewRecipientsParams {
  workspaceId: string;
  customerIds?: string[];
  includeTagIds?: string[];
  excludeTagIds?: string[];
  pipelineStageIds?: string[];
  pipelineId?: string;
  integrationId?: string;
  templateId?: string;
  bindings?: Record<string, unknown>;
}

export interface PreviewRecipient {
  customerId: string;
  chatId: string;
  customerPhone: string;
  customerName: string;
}

export interface PreviewRecipientsResponse {
  recipients: PreviewRecipient[];
  total: number;
  eligible?: number;
  ignoredByReason?: Record<string, number>;
}

export interface CreateMassBroadcastInput {
  name: string;
  messages: string[];
  pipelineId: string;
  workspaceId: string;
  customerIds?: string[];
  includeTagIds?: string[];
  excludeTagIds?: string[];
  pipelineStageIds?: string[];
  applyTagIds?: string[];
  messageDelaySeconds?: number;
  startTime?: string;
  endTime?: string;
  file?: File;
  provider?: string;
  metaTemplateId?: string;
  metaTemplateLanguage?: string;
  metaTemplateBindings?: Record<string, unknown>;
}

export interface ListMassBroadcastsParams {
  page?: number;
  limit?: number;
  workspaceId?: string;
  status?: MassBroadcastStatus;
}

export interface ListMassBroadcastRecipientsParams {
  page?: number;
  limit?: number;
  status?: MassBroadcastRecipientStatus;
}

export interface RetryFailedResponse {
  broadcast: MassBroadcast;
  retriedCount: number;
}
