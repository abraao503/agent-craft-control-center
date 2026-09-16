import { api } from "@/services/api";
import {
  AttendanceCommandResponse,
  TransferAttendanceParams,
} from "@/types/operation-attendance";

export async function transferAttendance(
  params: TransferAttendanceParams,
): Promise<AttendanceCommandResponse> {
  const { workspaceId, attendanceId, idempotencyKey, ...body } = params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<AttendanceCommandResponse>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/transfer`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
