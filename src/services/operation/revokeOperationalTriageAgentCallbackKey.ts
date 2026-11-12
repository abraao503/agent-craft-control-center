import { api } from "@/services/api";
import { OperationalTriageAgentCallbackKeyParams } from "@/types/operation-triage-agent";

export async function revokeOperationalTriageAgentCallbackKey(
  params: OperationalTriageAgentCallbackKeyParams,
): Promise<void> {
  await api.delete(
    `/operation/workspaces/${params.workspaceId}/triage-agents/${params.agentId}/callback-key`,
  );
}
