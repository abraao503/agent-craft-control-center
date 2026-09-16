import { api } from "@/services/api";
import {
  AttendanceCommandResponse,
  UnassignAttendanceParams,
} from "@/types/operation-attendance";

export async function unassignAttendance(
  params: UnassignAttendanceParams,
): Promise<AttendanceCommandResponse> {
  const { workspaceId, attendanceId, idempotencyKey, ...body } = params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<AttendanceCommandResponse>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/unassign`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
