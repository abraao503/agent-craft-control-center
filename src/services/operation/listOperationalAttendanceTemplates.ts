import { api } from "@/services/api";
import {
  ListOperationalAttendanceTemplatesParams,
  OperationalAttendanceTemplate,
} from "@/types/operation-attendance";

export async function listOperationalAttendanceTemplates(
  params: ListOperationalAttendanceTemplatesParams,
): Promise<OperationalAttendanceTemplate[]> {
  const { workspaceId, attendanceId } = params;
  const { data } = await api.get<OperationalAttendanceTemplate[]>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/templates`,
  );

  return data;
}
