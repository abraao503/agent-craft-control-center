import { api } from "@/services/api";
import {
  CreateManualAttendanceParams,
  CreateManualAttendanceResponse,
} from "@/types/operation-attendance";

export async function createManualAttendance(
  params: CreateManualAttendanceParams,
): Promise<CreateManualAttendanceResponse> {
  const { workspaceId, idempotencyKey, ...body } = params;
  const { data } = await api.post<CreateManualAttendanceResponse>(
    `/operation/workspaces/${workspaceId}/attendances`,
    body,
    {
      headers: {
        "Idempotency-Key": idempotencyKey ?? crypto.randomUUID(),
      },
    },
  );

  return data;
}
