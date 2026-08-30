export type UserRole =
  | "PLATFORM_ADMIN"
  | "COMPANY_OWNER"
  | "COMPANY_ADMIN"
  | "WORKSPACE_OWNER"
  | "WORKSPACE_ADMIN"
  | "WORKSPACE_MANAGER"
  | "WORKSPACE_MEMBER"
  | "SALES_REP";

export type Permission =
  | "manage:platform"
  | "view:platform-reports"
  | "create:company"
  | "delete:company"
  | "view:all-companies"
  | "view:company"
  | "manage:company"
  | "update:company"
  | "view:company-billing"
  | "create:workspace"
  | "update:workspace"
  | "delete:workspace"
  | "view:all-workspaces"
  | "view:operation-setup"
  | "manage:operation-setup"
  | "view:operation-memberships"
  | "manage:operation-memberships"
  | "view:operation-channels"
  | "manage:operation-channels"
  | "view:operation-attendances"
  | "operate:operation-attendances"
  | "create:company-user"
  | "delete:company-user"
  | "create:workspace-user"
  | "delete:workspace-user"
  | "list:users"
  | "assign:user-to-workspace"
  | "impersonate:user"
  | "create:pipeline"
  | "update:pipeline"
  | "delete:pipeline"
  | "view:pipeline"
  | "create:stage-form-field"
  | "update:stage-form-field"
  | "delete:stage-form-field"
  | "view:stage-form-field"
  | "save:form-field-values"
  | "create:assistant"
  | "update:assistant"
  | "delete:assistant"
  | "view:assistant"
  | "manage:integrations"
  | "connect:whatsapp"
  | "view:integrations"
  | "manage:whatsapp-consent"
  | "create:deal"
  | "update:deal"
  | "delete:deal"
  | "view:deal"
  | "view:all-deals"
  | "view:team-deals"
  | "view:own-deals"
  | "assign:deal"
  | "manage:deal-distribution"
  | "move:deal"
  | "view:chat"
  | "send:message"
  | "view:workspace-reports"
  | "view:company-reports"
  | "import:customers"
  | "view:customer-imports"
  | "download:customer-import-errors";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  metaCloudWhatsappEnabled: boolean;
  workspaceId: string | null;
  permissions: Permission[];
  impersonation?: {
    sessionId: string;
    actorUserId: string;
    actorName: string;
    actorEmail: string;
    expiresAt: string;
  };
}

export interface AuthSessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  workspaceId: string | null;
  defaultWorkspaceId: string;
}

export interface AuthSessionResponse {
  user: AuthSessionUser;
  token: string;
}
