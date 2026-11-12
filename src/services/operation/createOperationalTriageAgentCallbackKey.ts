import { api } from "@/services/api";
import {
  OperationalTriageAgentCallbackKeyIssue,
  OperationalTriageAgentCallbackKeyParams,
  OperationalTriageAgentCallbackKeyStatus,
} from "@/types/operation-triage-agent";

function callbackKeyPath({ workspaceId, agentId }: OperationalTriageAgentCallbackKeyParams) {
  return `/operation/workspaces/${workspaceId}/triage-agents/${agentId}/callback-key`;
}

export async function getOperationalTriageAgentCallbackKey(
  params: OperationalTriageAgentCallbackKeyParams,
): Promise<OperationalTriageAgentCallbackKeyStatus> {
  const { data } = await api.get<OperationalTriageAgentCallbackKeyStatus>(
    callbackKeyPath(params),
  );
  return data;
}

export async function createOperationalTriageAgentCallbackKey(
  params: OperationalTriageAgentCallbackKeyParams,
): Promise<OperationalTriageAgentCallbackKeyIssue> {
  const { data } = await api.post<OperationalTriageAgentCallbackKeyIssue>(
    callbackKeyPath(params),
  );
  return data;
}
