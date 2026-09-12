export type OperationalChannelProviderName =
  | "z-api"
  | "evolux"
  | "meta-cloud";

export type OperationalChannelEntryMode =
  | "TRIAGE"
  | "QUEUE"
  | "ASSISTANT"
  | "EXTERNAL_AGENT";

export type OperationalChannelRouteConfigurationStatus =
  | "INCOMPLETE"
  | "VALID";

export type OperationalChannelMenuOptionAction =
  | "START_EXTERNAL_AGENT"
  | "ROUTE"
  | "CLOSE";

export interface OperationalChannelMenuOption {
  id: string;
  number: number;
  label: string;
  action: OperationalChannelMenuOptionAction;
  responseText: string;
  targetAreaId: string | null;
  targetQueueId: string | null;
}

export interface OperationalChannelMenuOptionInput {
  number: number;
  label: string;
  action: OperationalChannelMenuOptionAction;
  responseText: string;
  targetAreaId: string | null;
  targetQueueId: string | null;
}

export type OperationalChannelRouteMissing =
  | "route"
  | "ASSISTANT"
  | "TRIAGE_AGENT"
  | "TARGET_AREA"
  | "TARGET_QUEUE"
  | "FALLBACK_AREA"
  | "FALLBACK_QUEUE"
  | "MENU_GREETING"
  | "INVALID_MENU_MESSAGE"
  | "HANDOFF_AREA"
  | "HANDOFF_QUEUE"
  | "MENU_OPTIONS";

export type OperationalChannelRouteDiagnosticCode =
  | "CONFIGURATION_READY"
  | "ROUTE_INCOMPLETE"
  | "INVALID_ROUTE_CONFIGURATION"
  | "TRIAGE_AGENT_NOT_FOUND"
  | "ASSISTANT_NOT_FOUND"
  | "DESTINATION_NOT_FOUND"
  | "DESTINATION_WORKSPACE_MISMATCH";

export interface OperationalChannelProviderCapabilities {
  connectionMode: "credentials" | "provisioned-number";
  supportsQr: boolean;
  supportsTemplates: boolean;
  supportsStatuses: boolean;
  supports24HourWindow: boolean;
  supportsMedia: boolean;
}

export interface OperationalChannelProvider {
  id: string;
  alias: string;
  name: OperationalChannelProviderName;
  active: boolean;
  capabilities: OperationalChannelProviderCapabilities;
}

export interface OperationalChannelDiagnostic {
  code: string;
  message: string;
}

export interface OperationalChannelRouteDestination {
  id: string;
  name: string;
  active: boolean;
}

export interface OperationalChannelRouteSummary {
  configured: boolean;
  configurationStatus: OperationalChannelRouteConfigurationStatus;
  entryMode: OperationalChannelEntryMode | null;
  missing: OperationalChannelRouteMissing[];
  diagnostic: {
    code: OperationalChannelRouteDiagnosticCode;
    message: string;
  };
}

export interface OperationalChannel {
  id: string;
  companyId: string;
  workspaceId: string;
  provider: OperationalChannelProviderName;
  providerId: string;
  providerAlias: string;
  connectionMode: OperationalChannelProviderCapabilities["connectionMode"];
  capabilities: OperationalChannelProviderCapabilities;
  displayName: string | null;
  active: boolean;
  status: string;
  connectionStatus: string;
  credentialsConfigured: boolean;
  metaPhoneNumberId: string | null;
  metaDisplayPhoneNumber: string | null;
  version: number;
  route: OperationalChannelRouteSummary;
  diagnostic: OperationalChannelDiagnostic;
}

export interface OperationalChannelRoute {
  id: string;
  companyId: string;
  workspaceId: string;
  channelId: string;
  entryMode: OperationalChannelEntryMode;
  triageAgentId: string | null;
  assistantId: string | null;
  targetAreaId: string | null;
  targetQueueId: string | null;
  fallbackAreaId: string | null;
  fallbackQueueId: string | null;
  menuGreeting: string | null;
  invalidMenuMessage: string | null;
  handoffAreaId: string | null;
  handoffQueueId: string | null;
  menuOptions: OperationalChannelMenuOption[];
  active: boolean;
  configured: boolean;
  configurationStatus: OperationalChannelRouteConfigurationStatus;
  missing: OperationalChannelRouteMissing[];
  destinations: {
    triageAgent: OperationalChannelRouteDestination | null;
    assistant: OperationalChannelRouteDestination | null;
    targetArea: OperationalChannelRouteDestination | null;
    targetQueue: OperationalChannelRouteDestination | null;
    fallbackArea: OperationalChannelRouteDestination | null;
    fallbackQueue: OperationalChannelRouteDestination | null;
    handoffArea: OperationalChannelRouteDestination | null;
    handoffQueue: OperationalChannelRouteDestination | null;
  };
  diagnostic: {
    code: OperationalChannelRouteDiagnosticCode;
    message: string;
  };
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalChannelsPage {
  items: OperationalChannel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OperationalChannelRoutesPage {
  items: OperationalChannelRoute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OperationalChannelQrCode {
  qrCode: string;
}

export interface ActivateOperationalChannelData {
  channelId: string;
  active: boolean;
  status: string;
  connectionStatus: string;
  webhookUrl: string;
}

export interface OperationalMetaPhoneNumberAvailability {
  id: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string | null;
  status: string | null;
  boundWorkspaceId: string | null;
  boundWorkspaceType: "COMMERCIAL" | "OPERATION" | null;
}

export interface OperationalChannelListParams {
  page?: number;
  limit?: number;
  active?: boolean;
  provider?: OperationalChannelProviderName;
}

export interface OperationalChannelRouteListParams {
  page?: number;
  limit?: number;
  channelId?: string;
  configurationStatus?: OperationalChannelRouteConfigurationStatus;
}

export interface OperationalZApiCredentials {
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
}

export type CreateOperationalChannelBody =
  | {
      provider: "z-api";
      displayName?: string;
      credentials: OperationalZApiCredentials;
    }
  | {
      provider: "evolux";
      displayName?: string;
    }
  | {
      provider: "meta-cloud";
      displayName?: string;
      metaPhoneNumberId: string;
    };

export interface UpdateOperationalChannelBody {
  displayName?: string | null;
  credentials?: Partial<OperationalZApiCredentials>;
  expectedVersion: number;
}

export interface CreateOperationalChannelRouteBody {
  channelId: string;
  entryMode: OperationalChannelEntryMode;
  triageAgentId: string | null;
  assistantId: string | null;
  targetAreaId: string | null;
  targetQueueId: string | null;
  fallbackAreaId: string | null;
  fallbackQueueId: string | null;
  menuGreeting?: string | null;
  invalidMenuMessage?: string | null;
  handoffAreaId?: string | null;
  handoffQueueId?: string | null;
  menuOptions?: OperationalChannelMenuOptionInput[];
}

export interface UpdateOperationalChannelRouteBody {
  entryMode: OperationalChannelEntryMode;
  triageAgentId: string | null;
  assistantId: string | null;
  targetAreaId: string | null;
  targetQueueId: string | null;
  fallbackAreaId: string | null;
  fallbackQueueId: string | null;
  menuGreeting?: string | null;
  invalidMenuMessage?: string | null;
  handoffAreaId?: string | null;
  handoffQueueId?: string | null;
  menuOptions?: OperationalChannelMenuOptionInput[];
  active: boolean;
  expectedVersion: number;
}

export interface OperationalChannelMutationParams {
  workspaceId: string;
  idempotencyKey: string;
}

export interface CreateOperationalChannelParams
  extends OperationalChannelMutationParams {
  body: CreateOperationalChannelBody;
}

export interface UpdateOperationalChannelParams
  extends OperationalChannelMutationParams {
  channelId: string;
  body: UpdateOperationalChannelBody;
}

export interface DeactivateOperationalChannelParams
  extends OperationalChannelMutationParams {
  channelId: string;
  expectedVersion: number;
}

export interface ActivateOperationalChannelParams
  extends OperationalChannelMutationParams {
  channelId: string;
}

export interface RequestOperationalChannelQrCodeParams {
  workspaceId: string;
  channelId: string;
}

export interface CreateOperationalChannelRouteParams
  extends OperationalChannelMutationParams {
  body: CreateOperationalChannelRouteBody;
}

export interface UpdateOperationalChannelRouteParams
  extends OperationalChannelMutationParams {
  routeId: string;
  body: UpdateOperationalChannelRouteBody;
}

export interface DeleteOperationalChannelRouteParams
  extends OperationalChannelMutationParams {
  routeId: string;
  expectedVersion: number;
}
