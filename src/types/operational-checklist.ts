export type OperationalChecklistTemplateVisibility = "OFFICIAL" | "PERSONAL";

export type OperationalChecklistItemResponsible = "CUSTOMER" | "TEAM";

export interface OperationalChecklistTemplateItem {
  id: string;
  templateId: string;
  position: number;
  label: string;
  responsible: OperationalChecklistItemResponsible;
  required: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalChecklistTemplate {
  id: string;
  companyId: string;
  workspaceId: string;
  ownerUserId: string | null;
  visibility: OperationalChecklistTemplateVisibility;
  name: string;
  version: number;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OperationalChecklistTemplateItem[];
}

export interface OperationalChecklistPreference {
  id: string;
  companyId: string;
  workspaceId: string;
  userId: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetOperationalChecklistPreferenceParams {
  workspaceId: string;
  templateId: string;
}

export interface OperationalChecklistTemplateItemInput {
  label: string;
  responsible: OperationalChecklistItemResponsible;
  required: boolean;
}

export interface CreateOperationalChecklistTemplateParams {
  workspaceId: string;
  name: string;
  items: OperationalChecklistTemplateItemInput[];
}

export interface UpdateOperationalChecklistTemplateParams {
  workspaceId: string;
  templateId: string;
  name?: string;
  items?: OperationalChecklistTemplateItemInput[];
  expectedVersion: number;
}

export interface ArchiveOperationalChecklistTemplateParams {
  workspaceId: string;
  templateId: string;
  expectedVersion: number;
}

export interface OperationalAttendanceChecklistItem {
  id: string;
  checklistId: string;
  position: number;
  label: string;
  responsible: OperationalChecklistItemResponsible;
  required: boolean;
  completed: boolean;
  completedAt: string | null;
  completedByUserId: string | null;
}

export interface OperationalAttendanceChecklist {
  id: string;
  companyId: string;
  workspaceId: string;
  attendanceId: string;
  templateId: string;
  templateVersion: number;
  name: string;
  version: number;
  active: boolean;
  lastUpdatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OperationalAttendanceChecklistItem[];
}

export interface OperationalAttendanceChecklistProgress {
  total: number;
  completed: number;
  pending: number;
}

export type OperationalAttendanceChecklistView =
  OperationalAttendanceChecklist & {
    progress: OperationalAttendanceChecklistProgress;
  };

export interface GetOperationalAttendanceChecklistParams {
  workspaceId: string;
  attendanceId: string;
}

export interface ApplyOperationalAttendanceChecklistParams
  extends GetOperationalAttendanceChecklistParams {
  templateId: string;
}

export interface ReplaceOperationalAttendanceChecklistParams
  extends GetOperationalAttendanceChecklistParams {
  templateId: string;
  expectedVersion: number;
}

export interface UpdateOperationalAttendanceChecklistItemInput {
  id?: string;
  position: number;
  label: string;
  responsible: OperationalChecklistItemResponsible;
  required: boolean;
  completed: boolean;
}

export interface UpdateOperationalAttendanceChecklistParams
  extends GetOperationalAttendanceChecklistParams {
  expectedVersion: number;
  name?: string;
  items: UpdateOperationalAttendanceChecklistItemInput[];
}
