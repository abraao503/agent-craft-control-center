// Types for Deals in Sales Kanban
// Comments in English as per project rules

export interface RelatedMinimal {
  id: string;
  name: string;
  chatId?: string;
  chatUnreadCount?: number;
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
  tags?: string[]; // Array of tag IDs associated with the deal
  dueDate?: string | null; // Due date from due_date field type
}

export interface CreateDealInput {
  workspaceId: string; // UUID
  pipelineId: string; // UUID
  currentStageId: string; // UUID
  assignedUserId?: string; // UUID
  title: string;
  description?: string;
  value?: number; // >= 0
  currency?: string; // default BRL
  expectedCloseDate?: string; // ISO datetime
  customerName: string; // Required - Customer name
  customerPhone: string; // Required - Phone number (international format supported, e.g. +5511999887766 or 11999887766)
  customerEmail?: string; // Optional - Valid email format
}

export interface CreateDealResponse {
  id: string;
}

export interface MoveDealStageInput {
  workspaceId: string; // UUID
  stageId: string; // destination stage UUID
  reason?: string;
}

export interface UpdateDealInput {
  title?: string;
  description?: string;
  value?: number;
  currency?: string;
  expectedCloseDate?: string;
  assignedUserId?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface DealNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  } | null;
}

export interface CreateDealNoteInput {
  dealId: string;
  content: string;
}

export interface CreateDealNoteResponse {
  id: string;
}

export interface UpdateDealNoteInput {
  content: string;
}

export interface DealDetails {
  id: string;
  title: string;
  description: string | null;
  value: number | null;
  currency: string;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  assignedUser?: {
    id: string;
    name: string;
  };
  currentStage?: {
    id: string;
    name: string;
    color: string;
  };
  tags?: string[]; // Array of tag IDs associated with the deal
}

export interface GetDealsByStageResponse {
  items: DealListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetDealsByStageParams {
  stageId: string;
  workspaceId: string;
  limit?: number;
  page?: number;
  search?: string;
  assignedUserId?: string;
}
