import { api } from "@/services/api";
import {
  AttendanceDetail,
  GetAttendanceDetailParams,
} from "@/types/operation-attendance";

export async function getAttendanceDetail(
  params: GetAttendanceDetailParams,
): Promise<AttendanceDetail> {
  const { workspaceId, attendanceId } = params;
  const { data } = await api.get<AttendanceDetail>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}`,
  );

  return data;
}
