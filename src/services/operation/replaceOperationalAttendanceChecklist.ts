import { api } from "@/services/api";
import {
  OperationalAttendanceChecklistView,
  ReplaceOperationalAttendanceChecklistParams,
} from "@/types/operational-checklist";

export async function replaceOperationalAttendanceChecklist(
  params: ReplaceOperationalAttendanceChecklistParams,
): Promise<OperationalAttendanceChecklistView> {
  const { workspaceId, attendanceId, templateId, expectedVersion } = params;
  const { data } = await api.post<OperationalAttendanceChecklistView>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/checklist/replace`,
    { templateId, expectedVersion },
  );

  return data;
}
