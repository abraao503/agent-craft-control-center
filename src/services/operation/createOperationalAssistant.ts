import { api } from "@/services/api";
import {
  CreateOperationalAssistantParams,
  OperationalAssistantDetails,
} from "@/types/operation-assistant";

export async function createOperationalAssistant(
  params: CreateOperationalAssistantParams,
): Promise<OperationalAssistantDetails> {
  const idempotencyKey = params.idempotencyKey ?? crypto.randomUUID();
  const { data } = await api.post<OperationalAssistantDetails>(
    `/operation/workspaces/${params.workspaceId}/assistants`,
    params.body,
    { headers: { "Idempotency-Key": idempotencyKey } },
  );

  return data;
}
