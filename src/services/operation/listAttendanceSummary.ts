import { api } from "@/services/api";
import {
  AttendanceSummary,
  ListAttendanceSummaryParams,
} from "@/types/operation-attendance";

export async function listAttendanceSummary(
  params: ListAttendanceSummaryParams,
): Promise<AttendanceSummary> {
  const { workspaceId, ...queryParams } = params;
  const { data } = await api.get<AttendanceSummary>(
    `/operation/workspaces/${workspaceId}/attendances/summary`,
    { params: queryParams },
  );

  return data;
}
