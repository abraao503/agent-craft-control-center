import { api } from "@/services/api";
import { OperationalAssistantAbilityAreaOption } from "@/types/operation-assistant";

export interface OperationalAssistantAbilityOptionsResponse {
  areas: OperationalAssistantAbilityAreaOption[];
}

export async function listOperationalAssistantAbilityOptions(
  workspaceId: string,
): Promise<OperationalAssistantAbilityOptionsResponse> {
  const { data } = await api.get<OperationalAssistantAbilityOptionsResponse>(
    `/operation/workspaces/${workspaceId}/assistants/ability-options`,
  );

  return data;
}
