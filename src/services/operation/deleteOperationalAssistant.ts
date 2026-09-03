import { api } from "@/services/api";
import { DeleteOperationalAssistantParams } from "@/types/operation-assistant";

export async function deleteOperationalAssistant(
  params: DeleteOperationalAssistantParams,
): Promise<void> {
  await api.delete(
    `/operation/workspaces/${params.workspaceId}/assistants/${params.assistantId}`,
  );
}
