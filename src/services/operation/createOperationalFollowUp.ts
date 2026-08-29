import { api } from "@/services/api";
import {
  CreateOperationalFollowUpParams,
  CreateOperationalFollowUpResult,
} from "@/types/operation-attendance";

export async function createOperationalFollowUp(
  params: CreateOperationalFollowUpParams,
): Promise<CreateOperationalFollowUpResult> {
  const { workspaceId, attendanceId, idempotencyKey, ...body } = params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<CreateOperationalFollowUpResult>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/follow-ups`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
