import { api } from "@/services/api";
import {
  ApplyOperationalAttendanceChecklistParams,
  OperationalAttendanceChecklist,
} from "@/types/operational-checklist";

export async function applyOperationalAttendanceChecklist(
  params: ApplyOperationalAttendanceChecklistParams,
): Promise<OperationalAttendanceChecklist> {
  const { workspaceId, attendanceId, templateId } = params;
  const { data } = await api.post<OperationalAttendanceChecklist>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/checklist`,
    { templateId },
  );

  return data;
}
