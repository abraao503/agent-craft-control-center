import type { AttendanceStatus } from "@/types/operation-attendance";

export type OperationalKanbanMoveAction =
  | "ROUTE"
  | "CLAIM"
  | "ASSIGN"
  | "TRANSFER"
  | "PENDING"
  | "RESUME"
  | "UNASSIGN"
  | "CLOSE";

export type OperationalKanbanMoveResult =
  | {
      kind: "NOOP";
      sourceStatus: AttendanceStatus;
      targetStatus: AttendanceStatus;
    }
  | {
      kind: "INVALID";
      sourceStatus: AttendanceStatus;
      targetStatus: AttendanceStatus;
      reason: string;
    }
  | {
      kind: "COMMAND";
      sourceStatus: AttendanceStatus;
      targetStatus: AttendanceStatus;
      action: OperationalKanbanMoveAction;
      requiresDialog: boolean;
    };

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  TRIAGE: "Triagem",
  WAITING_QUEUE: "Aguardando fila",
  IN_PROGRESS: "Em atendimento",
  PENDING: "Pendente",
  CLOSED: "Encerrado",
};

const MOVE_RULES: Partial<
  Record<
    `${AttendanceStatus}:${AttendanceStatus}`,
    {
      action: OperationalKanbanMoveAction;
      requiresDialog: boolean;
    }
  >
> = {
  "TRIAGE:WAITING_QUEUE": { action: "ROUTE", requiresDialog: true },
  "WAITING_QUEUE:IN_PROGRESS": { action: "CLAIM", requiresDialog: false },
  "IN_PROGRESS:WAITING_QUEUE": {
    action: "TRANSFER",
    requiresDialog: true,
  },
  "IN_PROGRESS:PENDING": { action: "PENDING", requiresDialog: true },
  "IN_PROGRESS:CLOSED": { action: "CLOSE", requiresDialog: true },
  "PENDING:WAITING_QUEUE": { action: "TRANSFER", requiresDialog: true },
  "PENDING:IN_PROGRESS": { action: "RESUME", requiresDialog: false },
  "PENDING:CLOSED": { action: "CLOSE", requiresDialog: true },
};

const ACTION_MENUS: Record<AttendanceStatus, OperationalKanbanMoveAction[]> = {
  TRIAGE: ["ROUTE"],
  WAITING_QUEUE: ["CLAIM", "ASSIGN", "TRANSFER"],
  IN_PROGRESS: ["ASSIGN", "TRANSFER", "UNASSIGN", "PENDING", "CLOSE"],
  PENDING: ["ASSIGN", "TRANSFER", "UNASSIGN", "RESUME", "CLOSE"],
  CLOSED: [],
};

export function getOperationalKanbanMove(
  sourceStatus: AttendanceStatus,
  targetStatus: AttendanceStatus,
): OperationalKanbanMoveResult {
  if (sourceStatus === targetStatus) {
    return { kind: "NOOP", sourceStatus, targetStatus };
  }

  const rule = MOVE_RULES[`${sourceStatus}:${targetStatus}`];
  if (!rule) {
    return {
      kind: "INVALID",
      sourceStatus,
      targetStatus,
      reason: `Não é possível mover um atendimento de ${STATUS_LABELS[sourceStatus]} para ${STATUS_LABELS[targetStatus]}. Use uma ação disponível no detalhe.`,
    };
  }

  return {
    kind: "COMMAND",
    sourceStatus,
    targetStatus,
    ...rule,
  };
}

export function getOperationalKanbanActionMenu(
  status: AttendanceStatus,
): OperationalKanbanMoveAction[] {
  return ACTION_MENUS[status].slice();
}
