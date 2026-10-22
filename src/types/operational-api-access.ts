export interface OperationalApiRateLimitPolicy {
  scope: "WORKSPACE";
  algorithm: "SLIDING_WINDOW";
  limit: number;
  windowSeconds: number;
}

export interface OperationalApiKeySummary {
  id: string;
  workspaceId: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  revokedAt: string | null;
  status: "ACTIVE" | "REVOKED";
}

export interface OperationalApiKeyList {
  items: OperationalApiKeySummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  rateLimit: OperationalApiRateLimitPolicy;
}

export interface CreateOperationalApiKeyResponse {
  apiKey: OperationalApiKeySummary;
  key: string;
}
