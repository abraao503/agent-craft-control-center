import { api } from "@/services/api";
import { OperationalAssistantDetails } from "@/types/operation-assistant";

export async function getOperationalAssistant(
  workspaceId: string,
  assistantId: string,
): Promise<OperationalAssistantDetails> {
  const { data } = await api.get<OperationalAssistantDetails>(
    `/operation/workspaces/${workspaceId}/assistants/${assistantId}`,
  );

  return data;
}
