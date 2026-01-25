// Types for Deal Webhooks
// Used for creating external integrations to trigger deal creation

export type DealWebhookStatus = "ACTIVE" | "INACTIVE";

export interface DealWebhookAutomation {
  sendWelcomeMessage: boolean;
  welcomeMessage?: string;
}

export interface DealWebhook {
  id: string;
  name: string;
  token: string;
  pipeline: {
    id: string;
    name: string;
  };
  stage: {
    id: string;
    name: string;
  } | null;
  workspaceId: string;
  companyId: string;
  status: DealWebhookStatus;
  webhookUrl: string;
  automation: DealWebhookAutomation | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDealWebhookInput {
  name: string;
  pipelineId: string;
  workspaceId: string;
  stageId?: string; // Optional: if not provided, first stage of pipeline will be used
  automation?: DealWebhookAutomation;
}

export interface UpdateDealWebhookInput {
  name?: string;
  status?: DealWebhookStatus;
  stageId?: string;
  automation?: DealWebhookAutomation;
}

export interface CreateDealWebhookResponse {
  id: string;
  token: string;
  webhookUrl: string;
}

export interface ListDealWebhooksParams {
  workspaceId?: string;
  pipelineId?: string;
  page?: number;
  limit?: number;
}

// Trigger webhook payload (for documentation display purposes)
export interface TriggerWebhookPayload {
  pipelineId: string;
  currentStageId: string;
  title: string;
  description?: string;
  value?: number;
  customerName?: string;
  customerPhone: string; // 11 digits, format: XX9NNNNNNNN
  customerEmail?: string;
}

// Webhook Execution Types
export type DealWebhookExecutionStatus =
  | "pending"
  | "processing"
  | "success"
  | "success_with_warnings"
  | "failed";

export interface DealWebhookExecution {
  id: string;
  dealWebhookId: string;
  dealId: string | null;
  status: DealWebhookExecutionStatus;
  payload: TriggerWebhookPayload;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListDealWebhookExecutionsParams {
  page?: number;
  limit?: number;
  status?: DealWebhookExecutionStatus;
}
