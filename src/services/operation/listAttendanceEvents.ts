import { api } from "@/services/api";
import {
  AttendanceEventsPage,
  ListAttendanceEventsParams,
} from "@/types/operation-attendance";

export async function listAttendanceEvents(
  params: ListAttendanceEventsParams,
): Promise<AttendanceEventsPage> {
  const { workspaceId, attendanceId, ...queryParams } = params;
  const { data } = await api.get<AttendanceEventsPage>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/events`,
    { params: queryParams },
  );

  return data;
}
