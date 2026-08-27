export type OperationalSetupStatus = "IN_PROGRESS" | "STRUCTURED";

export type OperationalSetupReadinessStatus =
  | "BLOCKED"
  | "READY_FOR_ACTIVATION";

export type OperationalSetupMissing =
  | "ACTIVE_AREA"
  | "ACTIVE_QUEUE"
  | "ACTIVE_MEMBER"
  | "FALLBACK_ROUTE";

export interface OperationalSetup {
  workspaceId: string;
  workspaceType: "OPERATION";
  setupStatus: OperationalSetupStatus;
  setupCompletedAt: string | null;
  counts: {
    activeAreas: number;
    activeQueues: number;
    activeMembers: number;
  };
  readiness: {
    status: OperationalSetupReadinessStatus;
    missing: OperationalSetupMissing[];
    deferredTo: string[];
  };
  version: number;
  updatedAt: string;
}
