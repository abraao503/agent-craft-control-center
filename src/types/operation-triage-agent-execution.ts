import type { AttendanceStatus } from "./operation-attendance";

export type OperationalTriageAgentExecutionStatus =
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "STALE"
  | "CANCELLED";

export type OperationalTriageAgentStage =
  | "MENU"
  | "WAITING_EXTERNAL_AGENT"
  | "CONVERSATION"
  | "TRANSFER"
  | "HUMAN_QUEUE"
  | "HUMAN_CONTINGENCY"
  | "HUMAN_SERVICE"
  | "STALE"
  | "CANCELLED";

export interface OperationalTriageAgentHistoryContext {
  attendanceStatus: AttendanceStatus;
  destinationLabel: string | null;
  hasExternalHandoff: boolean;
}

export interface OperationalTriageAgentExecutionView {
  id: string;
  status: OperationalTriageAgentExecutionStatus;
  attempts: number;
  /** Mantidos para compatibilidade do payload; a UI exibe a etapa conversacional. */
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
