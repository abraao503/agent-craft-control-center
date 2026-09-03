import { api } from "@/services/api";
import { OperationalAssistantSummary } from "@/types/operation-assistant";

export interface OperationalAssistantListResponse {
  items: OperationalAssistantSummary[];
}

export async function listOperationalAssistants(
  workspaceId: string,
): Promise<OperationalAssistantListResponse> {
  const { data } = await api.get<OperationalAssistantListResponse>(
    `/operation/workspaces/${workspaceId}/assistants`,
  );

  return data;
}
