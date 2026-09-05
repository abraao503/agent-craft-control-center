import { api } from "@/services/api";
import {
  OperationalTriageAgentListResponse,
} from "@/types/operation-triage-agent";

export async function listOperationalTriageAgents(
  workspaceId: string,
): Promise<OperationalTriageAgentListResponse> {
  const { data } = await api.get<OperationalTriageAgentListResponse>(
    `/operation/workspaces/${workspaceId}/triage-agents`,
  );

  return data;
}
