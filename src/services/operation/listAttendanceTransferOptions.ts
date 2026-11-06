import { api } from "@/services/api";
import { AttendanceTransferOptions } from "@/types/operation-attendance";

export async function listAttendanceTransferOptions(params: {
  workspaceId: string;
  attendanceId: string;
}): Promise<AttendanceTransferOptions> {
  const { data } = await api.get<AttendanceTransferOptions>(
    `/operation/workspaces/${params.workspaceId}/attendances/${params.attendanceId}/transfer-options`,
  );

  return data;
}
