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
  active?: boolean;
  items?: OperationalChecklistTemplateItemInput[];
  expectedVersion: number;
}

export interface ArchiveOperationalChecklistTemplateParams {
  workspaceId: string;
  templateId: string;
  expectedVersion: number;
}
