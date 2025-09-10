// Types for Deals in Sales Kanban
// Comments in English as per project rules

export interface RelatedMinimal {
  id: string;
  name: string;
}

export interface DealListItem {
  id: string;
  stageId: string;
  title: string;
  description?: string | null;
  value?: number | null; // >= 0
  currency?: string | null; // 3 letters, default BRL
  createdAt: string | Date;
  updatedAt: string | Date;
  customer?: RelatedMinimal | null;
  assignedUser?: RelatedMinimal | null;
}

export interface CreateDealInput {
  workspaceId: string; // UUID
  pipelineId: string; // UUID
  currentStageId: string; // UUID
  customerId: string; // UUID
  assignedUserId?: string; // UUID
  title: string;
  description?: string;
  value?: number; // >= 0
  currency?: string; // default BRL
  expectedCloseDate?: string; // ISO datetime
}

export interface CreateDealResponse {
  id: string;
}

export interface MoveDealStageInput {
  workspaceId: string; // UUID
  stageId: string; // destination stage UUID
  reason?: string;
}
