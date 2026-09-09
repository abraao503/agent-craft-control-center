export type OperationalTriageAgentAdapter = "GENERIC_HTTP";

export const OPERATIONAL_TRIAGE_AGENT_PROTOCOL_LABEL =
  "Protocolo conversacional v1";

export interface OperationalTriageAgent {
  id: string;
  companyId: string;
  workspaceId: string;
  name: string;
  adapter: OperationalTriageAgentAdapter;
  enabled: boolean;
  baseUrl: string;
  timeoutMs: number;
  maxAttempts: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  credentialConfigured: boolean;
}

export interface OperationalTriageAgentConnectionTest {
  ok: true;
  status: number;
  latencyMs: number;
}

export interface OperationalTriageAgentListResponse {
  items: OperationalTriageAgent[];
}

export interface CreateOperationalTriageAgentBody {
  name: string;
  adapter: OperationalTriageAgentAdapter;
  enabled: boolean;
  baseUrl: string;
  credential: string;
  timeoutMs: number;
  maxAttempts: number;
}

export interface UpdateOperationalTriageAgentBody {
  name?: string;
  adapter?: OperationalTriageAgentAdapter;
  enabled?: boolean;
  baseUrl?: string;
  credential?: string;
  timeoutMs?: number;
  maxAttempts?: number;
  expectedVersion: number;
}

export interface CreateOperationalTriageAgentParams {
  workspaceId: string;
  body: CreateOperationalTriageAgentBody;
}

export interface UpdateOperationalTriageAgentParams {
  workspaceId: string;
  agentId: string;
  body: UpdateOperationalTriageAgentBody;
}

export interface DeactivateOperationalTriageAgentParams {
  workspaceId: string;
  agentId: string;
  expectedVersion: number;
}

export interface TestOperationalTriageAgentParams {
  workspaceId: string;
  agentId: string;
}
