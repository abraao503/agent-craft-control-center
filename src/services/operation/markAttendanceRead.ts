import { api } from "@/services/api";
import { MarkAttendanceReadParams } from "@/types/operation-attendance";

export async function markAttendanceRead(
  params: MarkAttendanceReadParams,
): Promise<void> {
  const { workspaceId, attendanceId } = params;
  await api.post<void>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/read`,
  );
}
