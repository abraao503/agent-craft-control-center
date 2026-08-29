import { api } from "@/services/api";
import {
  UpdateOperationalFollowUpParams,
  UpdateOperationalFollowUpResult,
} from "@/types/operation-attendance";

export async function updateOperationalFollowUp(
  params: UpdateOperationalFollowUpParams,
): Promise<UpdateOperationalFollowUpResult> {
  const { workspaceId, attendanceId, followUpId, idempotencyKey, ...body } =
    params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.patch<UpdateOperationalFollowUpResult>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/follow-ups/${followUpId}`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
