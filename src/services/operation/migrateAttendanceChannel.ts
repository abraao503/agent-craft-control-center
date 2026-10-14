import { api } from "@/services/api";
import {
  AttendanceCommandResponse,
  MigrateAttendanceChannelParams,
} from "@/types/operation-attendance";

export async function migrateAttendanceChannel(
  params: MigrateAttendanceChannelParams,
): Promise<AttendanceCommandResponse> {
  const { workspaceId, attendanceId, idempotencyKey, ...body } = params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<AttendanceCommandResponse>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/migrate-channel`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
