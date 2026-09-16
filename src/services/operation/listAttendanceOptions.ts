import { api } from "@/services/api";
import {
  AttendanceOptions,
  ListAttendanceOptionsParams,
} from "@/types/operation-attendance";

export async function listAttendanceOptions(
  params: ListAttendanceOptionsParams,
): Promise<AttendanceOptions> {
  const { data } = await api.get<AttendanceOptions>(
    `/operation/workspaces/${params.workspaceId}/attendances/options`,
  );

  return data;
}
