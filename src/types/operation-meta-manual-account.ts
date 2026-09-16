export type OperationalMetaManualAccountStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "NEEDS_REAUTHORIZATION"
  | "DISCONNECTED"
  | "ERROR";

export interface OperationalMetaManualPhoneNumber {
  id: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string | null;
  qualityRating: string | null;
  status: string | null;
  lastSyncedAt: string | null;
  boundIntegrationId: string | null;
}

export interface OperationalMetaManualAccount {
  id: string;
  companyId: string;
  wabaId: string;
  businessId: string | null;
  status: OperationalMetaManualAccountStatus;
  connectionMode: "MANUAL";
  appId: string | null;
  webhookVerifiedAt: string | null;
  lastValidatedAt: string | null;
  tokenExpiresAt: string | null;
  grantedScopes: string[];
  createdAt: string;
  updatedAt: string;
  webhookConfigured: boolean;
  phoneNumbers: OperationalMetaManualPhoneNumber[];
}

export interface SaveOperationalMetaManualAccountBody {
  appId: string;
  appSecret: string;
  accessToken: string;
}

export interface SaveOperationalMetaManualAccountParams {
  workspaceId: string;
  wabaId: string;
  body: SaveOperationalMetaManualAccountBody;
}

export interface ConfigureOperationalMetaWebhookData {
  webhookUrl: string;
  verifyToken: string;
}

export interface ConfigureOperationalMetaWebhookParams {
  workspaceId: string;
  wabaId: string;
}
