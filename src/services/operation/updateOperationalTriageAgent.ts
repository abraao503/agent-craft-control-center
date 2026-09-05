import { api } from "@/services/api";
import {
  OperationalTriageAgent,
  UpdateOperationalTriageAgentParams,
} from "@/types/operation-triage-agent";

export async function updateOperationalTriageAgent(
  params: UpdateOperationalTriageAgentParams,
): Promise<OperationalTriageAgent> {
  const { data } = await api.put<OperationalTriageAgent>(
    `/operation/workspaces/${params.workspaceId}/triage-agents/${params.agentId}`,
    params.body,
  );

  return data;
}
