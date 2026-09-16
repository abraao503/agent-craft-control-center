import { api } from "@/services/api";
import { OperationalAssistantOption } from "@/types/operation-assistant";

export interface OperationalAssistantOptionsResponse {
  items: OperationalAssistantOption[];
}

export async function listOperationalAssistantOptions(
  workspaceId: string,
): Promise<OperationalAssistantOptionsResponse> {
  const { data } = await api.get<OperationalAssistantOptionsResponse>(
    `/operation/workspaces/${workspaceId}/assistants/options`,
  );

  return data;
}
