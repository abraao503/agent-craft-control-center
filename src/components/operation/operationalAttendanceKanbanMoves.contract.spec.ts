import type { AttendanceStatus } from "@/types/operation-attendance";
import {
  getOperationalKanbanActionMenu,
  getOperationalKanbanMove,
  OperationalKanbanMoveAction,
} from "./operationalAttendanceKanbanMoves";

const expectedMoves: Array<{
  from: AttendanceStatus;
  to: AttendanceStatus;
  action: OperationalKanbanMoveAction;
  requiresDialog: boolean;
}> = [
  { from: "TRIAGE", to: "WAITING_QUEUE", action: "ROUTE", requiresDialog: true },
  {
    from: "WAITING_QUEUE",
    to: "IN_PROGRESS",
    action: "CLAIM",
    requiresDialog: false,
  },
  {
    from: "IN_PROGRESS",
    to: "WAITING_QUEUE",
    action: "TRANSFER",
    requiresDialog: true,
  },
  {
    from: "IN_PROGRESS",
    to: "PENDING",
    action: "PENDING",
    requiresDialog: true,
  },
  {
    from: "IN_PROGRESS",
    to: "CLOSED",
    action: "CLOSE",
    requiresDialog: true,
  },
  {
    from: "PENDING",
    to: "WAITING_QUEUE",
    action: "TRANSFER",
    requiresDialog: true,
  },
  {
    from: "PENDING",
    to: "IN_PROGRESS",
    action: "RESUME",
    requiresDialog: false,
  },
  {
    from: "PENDING",
    to: "CLOSED",
    action: "CLOSE",
    requiresDialog: true,
  },
];

const expectedActionMenus: Record<AttendanceStatus, OperationalKanbanMoveAction[]> = {
  TRIAGE: ["ROUTE"],
  WAITING_QUEUE: ["CLAIM", "ASSIGN", "TRANSFER"],
  IN_PROGRESS: ["ASSIGN", "TRANSFER", "UNASSIGN", "PENDING", "CLOSE"],
  PENDING: ["ASSIGN", "TRANSFER", "UNASSIGN", "RESUME", "CLOSE"],
  CLOSED: [],
};

function operationalAttendanceKanbanMovesContract(): void {
  for (const expected of expectedMoves) {
    const move = getOperationalKanbanMove(expected.from, expected.to);
    if (
      move.kind !== "COMMAND" ||
      move.action !== expected.action ||
      move.requiresDialog !== expected.requiresDialog
    ) {
      throw new Error(`Unexpected Kanban move contract: ${expected.from}->${expected.to}`);
    }
  }

  const invalidMove = getOperationalKanbanMove("TRIAGE", "CLOSED");
  if (invalidMove.kind !== "INVALID") {
    throw new Error("Invalid operational Kanban moves must be rejected before a command");
  }

  const noOpMove = getOperationalKanbanMove("PENDING", "PENDING");
  if (noOpMove.kind !== "NOOP") {
    throw new Error("Dropping an Attendance in its current column must be a no-op");
  }

  for (const status of Object.keys(expectedActionMenus) as AttendanceStatus[]) {
    const actualActions = getOperationalKanbanActionMenu(status);
    if (actualActions.join(",") !== expectedActionMenus[status].join(",")) {
      throw new Error(`Unexpected action menu contract for ${status}`);
    }
  }
}

void operationalAttendanceKanbanMovesContract;
