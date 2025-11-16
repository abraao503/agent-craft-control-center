export type Pagination<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export enum ActivityType {
  DEAL_STAGE_TRANSITION = "deal_stage_transition",
  DUE_DATE_EXPIRED = "due_date_expired",
}

export type DealStageTransitionActivity = {
  type: ActivityType.DEAL_STAGE_TRANSITION;
  id: string;
  dealId: string;
  dealTitle: string;
  fromStageName: string | null;
  toStageName: string;
  pipelineId: string;
  pipelineName: string;
  userId: string | null;
  userName: string | null;
  assistantId: string | null;
  assistantName: string | null;
  reason: string | null;
  createdAt: Date;
};

export type DueDateExpiredActivity = {
  type: ActivityType.DUE_DATE_EXPIRED;
  id: string;
  dealId: string;
  dealTitle: string;
  pipelineId: string;
  pipelineName: string;
  currentStageId: string;
  currentStageName: string;
  fieldId: string;
  fieldLabel: string;
  dueDate: Date;
  createdAt: Date;
};

export type Activity = DealStageTransitionActivity | DueDateExpiredActivity;
