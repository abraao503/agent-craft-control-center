import { api } from "@/services/api";
import {
  AttendanceCommandResponse,
  CloseAttendanceParams,
} from "@/types/operation-attendance";

export async function closeAttendance(
  params: CloseAttendanceParams,
): Promise<AttendanceCommandResponse> {
  const { workspaceId, attendanceId, idempotencyKey, ...body } = params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<AttendanceCommandResponse>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/close`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
