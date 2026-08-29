import { api } from "@/services/api";
import {
  AttendanceCommandsPage,
  ListAttendanceCommandsParams,
} from "@/types/operation-attendance";

export async function listAttendanceCommands(
  params: ListAttendanceCommandsParams,
): Promise<AttendanceCommandsPage> {
  const { workspaceId, attendanceId, ...queryParams } = params;
  const { data } = await api.get<AttendanceCommandsPage>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/commands`,
    { params: queryParams },
  );

  return data;
}
