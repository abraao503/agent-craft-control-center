import { api } from "@/services/api";
import {
  AttendanceTimelinePage,
  ListAttendanceTimelineParams,
} from "@/types/operation-attendance";

export async function listAttendanceTimeline(
  params: ListAttendanceTimelineParams,
): Promise<AttendanceTimelinePage> {
  const { workspaceId, attendanceId, ...queryParams } = params;
  const { data } = await api.get<AttendanceTimelinePage>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/timeline`,
    { params: queryParams },
  );

  return data;
}
