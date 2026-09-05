export type OperationalTriageAgentExecutionStatus =
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "STALE"
  | "CANCELLED";

export interface OperationalTriageAgentExecutionView {
  id: string;
  status: OperationalTriageAgentExecutionStatus;
  attempts: number;
  decision: "ROUTE" | "ASK_CLARIFICATION" | null;
  confidence: number | null;
  destination: {
    area: string;
    queue: string;
  } | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface OperationalTriageAgentExecutionPage {
  items: OperationalTriageAgentExecutionView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
