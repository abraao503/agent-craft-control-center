export type OperationalSetupStatus = "IN_PROGRESS" | "STRUCTURED";

export type OperationalSetupReadinessStatus =
  | "BLOCKED"
  | "READY_FOR_ACTIVATION";

export type OperationalSetupMissing =
  | "ACTIVE_AREA"
  | "ACTIVE_QUEUE"
  | "ACTIVE_MEMBER"
  | "FALLBACK_ROUTE";

export type AreaMembershipRole = "OPERATOR" | "SUPERVISOR";

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

export interface ServiceArea {
  id: string;
  companyId: string;
  workspaceId: string;
  name: string;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceQueue {
  id: string;
  companyId: string;
  workspaceId: string;
  areaId: string;
  name: string;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AreaMembership {
  id: string;
  companyId: string;
  workspaceId: string;
  areaId: string;
  userId: string;
  role: AreaMembershipRole;
  active: boolean;
  deletedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface OperationalAreasPage {
  items: ServiceArea[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OperationalQueuesPage {
  items: ServiceQueue[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OperationalAreaMembershipsPage {
  items: AreaMembership[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOperationalAreaParams {
  workspaceId: string;
  name: string;
  description?: string;
}

export interface UpdateOperationalAreaParams {
  workspaceId: string;
  areaId: string;
  name?: string;
  description?: string | null;
  active?: boolean;
  expectedVersion: number;
}

export interface DeleteOperationalAreaParams {
  workspaceId: string;
  areaId: string;
  expectedVersion: number;
}

export interface CreateOperationalQueueParams {
  workspaceId: string;
  areaId: string;
  name: string;
  description?: string;
}

export interface UpdateOperationalQueueParams {
  workspaceId: string;
  areaId: string;
  queueId: string;
  name?: string;
  description?: string | null;
  active?: boolean;
  expectedVersion: number;
}

export interface DeleteOperationalQueueParams {
  workspaceId: string;
  areaId: string;
  queueId: string;
  expectedVersion: number;
}

export interface UpsertOperationalAreaMembershipParams {
  workspaceId: string;
  areaId: string;
  userId: string;
  role: AreaMembershipRole;
  expectedVersion?: number;
}

export interface DeleteOperationalAreaMembershipParams {
  workspaceId: string;
  areaId: string;
  userId: string;
  expectedVersion?: number;
}
