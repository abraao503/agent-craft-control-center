import { api } from "@/services/api";
import {
  GetOperationalAttendanceChecklistParams,
  OperationalAttendanceChecklistView,
} from "@/types/operational-checklist";

export async function getOperationalAttendanceChecklist(
  params: GetOperationalAttendanceChecklistParams,
): Promise<OperationalAttendanceChecklistView | null> {
  const { workspaceId, attendanceId } = params;
  const { data } = await api.get<OperationalAttendanceChecklistView | null>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/checklist`,
  );

  return data;
}
