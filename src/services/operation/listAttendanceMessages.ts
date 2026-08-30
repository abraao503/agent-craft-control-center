import { api } from "@/services/api";
import {
  AttendanceMessagesPage,
  ListAttendanceMessagesParams,
} from "@/types/operation-attendance";

export async function listAttendanceMessages(
  params: ListAttendanceMessagesParams,
): Promise<AttendanceMessagesPage> {
  const { workspaceId, attendanceId, ...queryParams } = params;
  const { data } = await api.get<AttendanceMessagesPage>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/messages`,
    { params: queryParams },
  );

  return data;
}
