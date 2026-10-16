export type OperationalWebhookStatus = "ACTIVE" | "INACTIVE";

export type OperationalWebhookExecutionStatus =
  | "PENDING"
  | "PROCESSING"
  | "ACCEPTED"
  | "FAILED"
  | "UNKNOWN";

export interface OperationalWebhook {
  id: string;
  name: string;
  keyPrefix: string;
  companyWhatsappIntegrationId: string;
  status: OperationalWebhookStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationalWebhookInput {
  name: string;
  companyWhatsappIntegrationId: string;
}

export interface UpdateOperationalWebhookInput {
  name?: string;
  companyWhatsappIntegrationId?: string;
  status?: OperationalWebhookStatus;
  version?: number;
}

export interface OperationalWebhookWithKey {
  webhook: OperationalWebhook;
  key: string;
}

export interface OperationalWebhookExecution {
  id: string;
  webhookId: string;
  companyId: string;
  workspaceId: string;
  companyWhatsappIntegrationId: string;
  idempotencyKey: string;
  phone: string;
  kind: string;
  payload: unknown;
  status: OperationalWebhookExecutionStatus;
  errorCode: string | null;
  errorMessage: string | null;
  attendanceId: string | null;
  messageId: string | null;
  outboundRequestId: string | null;
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalWebhookListParams {
  page?: number;
  limit?: number;
  status?: OperationalWebhookStatus;
}

export interface OperationalWebhookExecutionListParams {
  page?: number;
  limit?: number;
  status?: OperationalWebhookExecutionStatus;
}

export interface OperationalWebhookPage {
  items: OperationalWebhook[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OperationalWebhookExecutionPage {
  items: OperationalWebhookExecution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OperationalWebhookTriggerResponse {
  executionId: string;
  status: OperationalWebhookExecutionStatus;
  duplicate: boolean;
}
