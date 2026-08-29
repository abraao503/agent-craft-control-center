import { api } from "@/services/api";
import {
  AttendancesPage,
  ListAttendancesParams,
} from "@/types/operation-attendance";

export async function listAttendances(
  params: ListAttendancesParams,
): Promise<AttendancesPage> {
  const { workspaceId, ...queryParams } = params;
  const { data } = await api.get<AttendancesPage>(
    `/operation/workspaces/${workspaceId}/attendances`,
    { params: queryParams },
  );

  return data;
}
