import { api } from "@/services/api";
import {
  AttendanceCommandResponse,
  ResumeAttendanceParams,
} from "@/types/operation-attendance";

export async function resumeAttendance(
  params: ResumeAttendanceParams,
): Promise<AttendanceCommandResponse> {
  const { workspaceId, attendanceId, idempotencyKey, ...body } = params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<AttendanceCommandResponse>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/resume`,
    body,
    {
      headers: {
        "Idempotency-Key": key,
      },
    },
  );

  return data;
}
