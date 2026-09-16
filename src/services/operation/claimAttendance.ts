import { api } from "@/services/api";
import {
  AttendanceCommandResponse,
  ClaimAttendanceParams,
} from "@/types/operation-attendance";

export async function claimAttendance(
  params: ClaimAttendanceParams,
): Promise<AttendanceCommandResponse> {
  const { workspaceId, attendanceId, idempotencyKey, ...body } = params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<AttendanceCommandResponse>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/claim`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
