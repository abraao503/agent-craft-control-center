export interface DealStageChangedEvent {
  dealId: string;
  pipelineId: string;
  workspaceId: string;
  fromStageId: string | null;
  toStageId: string;
  userId: string | null;
  assistantId: string | null;
  reason: string | null;
  transitionId: string;
  createdAt: Date;
}

export interface ActivityCreatedEvent {
  workspaceId: string;
  dealId?: string;
  type:
    | "deal_stage_transition"
    | "deal_note_created"
    | "deal_note_updated"
    | "deal_note_deleted";
  createdAt: Date;
}
