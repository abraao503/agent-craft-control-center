export type CommercialMetaManualAccountStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "NEEDS_REAUTHORIZATION"
  | "DISCONNECTED"
  | "ERROR";

export interface CommercialMetaManualPhoneNumber {
  id: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string | null;
  qualityRating: string | null;
  status: string | null;
  lastSyncedAt: string | null;
  boundIntegrationId: string | null;
}

/**
 * Read model returned by the commercial manual-account endpoints.
 * Credentials are intentionally absent from this type and from the API response.
 */
export interface CommercialMetaManualAccount {
  id: string;
  companyId: string;
  wabaId: string;
  businessId: string | null;
  status: CommercialMetaManualAccountStatus;
  connectionMode: "MANUAL";
  appId: string | null;
  webhookVerifiedAt: string | null;
  lastValidatedAt: string | null;
  tokenExpiresAt: string | null;
  grantedScopes: string[];
  createdAt: string;
  updatedAt: string;
  webhookConfigured: boolean;
  wabaAlreadyConfiguredInAnotherWorkspace: boolean;
  phoneNumbers: CommercialMetaManualPhoneNumber[];
}

export interface SaveCommercialMetaManualAccountBody {
  appId: string;
  appSecret: string;
  accessToken: string;
}

export interface SaveCommercialMetaManualAccountParams {
  workspaceId: string;
  wabaId: string;
  body: SaveCommercialMetaManualAccountBody;
}
