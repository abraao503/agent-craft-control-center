import { api } from "@/services/api";
import {
  AttendanceWithDetails,
  GetAttendanceDetailParams,
} from "@/types/operation-attendance";

export async function getAttendanceDetail(
  params: GetAttendanceDetailParams,
): Promise<AttendanceWithDetails> {
  const { workspaceId, attendanceId } = params;
  const { data } = await api.get<AttendanceWithDetails>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}`,
  );

  return data;
}
