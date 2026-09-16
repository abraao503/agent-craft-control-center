import { api } from "@/services/api";
import {
  AttendanceCommandResponse,
  PendingAttendanceParams,
} from "@/types/operation-attendance";

export async function pendingAttendance(
  params: PendingAttendanceParams,
): Promise<AttendanceCommandResponse> {
  const { workspaceId, attendanceId, idempotencyKey, ...body } = params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<AttendanceCommandResponse>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/pending`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
