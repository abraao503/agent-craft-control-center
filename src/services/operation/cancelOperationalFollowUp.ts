import { api } from "@/services/api";
import {
  CancelOperationalFollowUpParams,
  CancelOperationalFollowUpResult,
} from "@/types/operation-attendance";

export async function cancelOperationalFollowUp(
  params: CancelOperationalFollowUpParams,
): Promise<CancelOperationalFollowUpResult> {
  const { workspaceId, attendanceId, followUpId, idempotencyKey, ...body } =
    params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<CancelOperationalFollowUpResult>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/follow-ups/${followUpId}/cancel`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
