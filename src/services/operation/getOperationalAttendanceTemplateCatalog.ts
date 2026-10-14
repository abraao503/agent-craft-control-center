import { api } from "@/services/api";
import {
  OperationalAttendanceTemplateCatalog,
} from "@/types/operation-attendance";

interface GetOperationalAttendanceTemplateCatalogParams {
  workspaceId: string;
  attendanceId: string;
}

export async function getOperationalAttendanceTemplateCatalog(
  params: GetOperationalAttendanceTemplateCatalogParams,
): Promise<OperationalAttendanceTemplateCatalog> {
  const { workspaceId, attendanceId } = params;
  const { data } = await api.get<OperationalAttendanceTemplateCatalog>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/template-catalog`,
  );

  return data;
}
