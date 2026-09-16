export type WorkspaceType = "COMMERCIAL" | "OPERATION";

export interface Workspace {
  id: string;
  name: string;
  companyId: string;
  isDefault: boolean;
  type: WorkspaceType;
}
