import { api } from "@/services/api";
import {
  OperationalAssistantDetails,
  UpdateOperationalAssistantParams,
} from "@/types/operation-assistant";

export async function updateOperationalAssistant(
  params: UpdateOperationalAssistantParams,
): Promise<OperationalAssistantDetails> {
  const { data } = await api.put<OperationalAssistantDetails>(
    `/operation/workspaces/${params.workspaceId}/assistants/${params.assistantId}`,
    params.body,
  );

  return data;
}
