export type MetaIntegrationStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "NEEDS_REAUTHORIZATION"
  | "DISCONNECTED"
  | "ERROR";

export type MetaLeadEventStatus =
  | "RECEIVED"
  | "PROCESSING"
  | "WAITING_MAPPING"
  | "WAITING_PHONE"
  | "WAITING_REAUTHORIZATION"
  | "PROCESSED"
  | "IGNORED_UNKNOWN_PAGE"
  | "FAILED_PERMANENT"
  | "EXPIRED";

export interface MetaIntegration {
  id: string;
  companyId: string;
  status: MetaIntegrationStatus;
  metaUserId: string | null;
  tokenExpiresAt: string | null;
  grantedScopes: string[];
  lastDiagnosticCode: string | null;
  lastDiagnosticMessage: string | null;
  lastValidatedAt: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
}

export interface MetaAdAccount {
  id: string;
  accountId: string;
  name: string;
  accountStatus: number | null;
  selected: boolean;
}

export interface MetaPage {
  id: string;
  pageId: string;
  name: string;
  selected: boolean;
  leadgenSubscriptionStatus: "UNSUBSCRIBED" | "SUBSCRIBED" | "ERROR";
  leadgenSubscriptionError: string | null;
}

export interface MetaLeadFormMapping {
  id: string;
  formId: string;
  workspaceId: string;
  pipelineId: string;
  stageId: string;
  active: boolean;
  fields: {
    phone: string;
    name?: string;
    email?: string;
    custom: Array<{ metaField: string; customerCustomFieldId: string }>;
  };
}

export interface MetaLeadForm {
  id: string;
  pageId: string;
  pageName?: string;
  formId: string;
  name: string;
  status: string | null;
  questions: unknown;
  mapping: MetaLeadFormMapping | null;
}

export interface MetaIntegrationResponse {
  integration: MetaIntegration | null;
  adAccounts: MetaAdAccount[];
  pages: MetaPage[];
  requiredScopes: string[];
}

export interface MetaLeadEvent {
  id: string;
  workspaceId: string | null;
  leadgenId: string;
  pageExternalId: string;
  formExternalId: string | null;
  eventTime: string | null;
  status: MetaLeadEventStatus;
  errorCode: string | null;
  retryCount: number;
  customerId: string | null;
  dealId: string | null;
  createdAt: string;
}

export interface MetaLeadEventsResponse {
  items: MetaLeadEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
