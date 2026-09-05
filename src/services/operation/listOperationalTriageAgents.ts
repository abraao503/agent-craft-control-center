import { api } from "@/services/api";
import {
  OperationalTriageAgentListResponse,
} from "@/types/operation-triage-agent";

export interface ListOperationalTriageAgentsParams {
  activeOnly?: boolean;
}

export async function listOperationalTriageAgents(
  workspaceId: string,
  params: ListOperationalTriageAgentsParams = {},
): Promise<OperationalTriageAgentListResponse> {
  const search = new URLSearchParams();
  if (params.activeOnly !== undefined) {
    search.set("activeOnly", String(params.activeOnly));
  }

  const { data } = await api.get<OperationalTriageAgentListResponse>(
    `/operation/workspaces/${workspaceId}/triage-agents${
      search.size ? `?${search.toString()}` : ""
    }`,
  );

  return data;
}
