import { api } from "@/services/api";
import {
  OperationalAttendanceChecklistView,
  UpdateOperationalAttendanceChecklistParams,
} from "@/types/operational-checklist";

export async function updateOperationalAttendanceChecklist(
  params: UpdateOperationalAttendanceChecklistParams,
): Promise<OperationalAttendanceChecklistView> {
  const { workspaceId, attendanceId, expectedVersion, name, items } = params;
  const { data } = await api.patch<OperationalAttendanceChecklistView>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/checklist`,
    {
      expectedVersion,
      ...(name !== undefined ? { name } : {}),
      items,
    },
  );

  return data;
}
