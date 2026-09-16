import { api } from "@/services/api";
import { DeactivateOperationalTriageAgentParams } from "@/types/operation-triage-agent";

export async function deactivateOperationalTriageAgent(
  params: DeactivateOperationalTriageAgentParams,
): Promise<void> {
  await api.delete(
    `/operation/workspaces/${params.workspaceId}/triage-agents/${params.agentId}`,
    { data: { expectedVersion: params.expectedVersion } },
  );
}
