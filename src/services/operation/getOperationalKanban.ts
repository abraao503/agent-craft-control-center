import { api } from "@/services/api";
import {
  AttendanceKanbanPage,
  ListAttendanceKanbanParams,
} from "@/types/operation-attendance";

export async function getOperationalKanban(
  params: ListAttendanceKanbanParams,
): Promise<AttendanceKanbanPage> {
  const { workspaceId, ...queryParams } = params;
  const { data } = await api.get<AttendanceKanbanPage>(
    `/operation/workspaces/${workspaceId}/kanban`,
    { params: queryParams },
  );

  return data;
}
