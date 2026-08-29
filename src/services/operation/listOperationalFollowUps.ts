import { api } from "@/services/api";
import {
  ListOperationalFollowUpsParams,
  OperationalFollowUpsPage,
} from "@/types/operation-attendance";

export async function listOperationalFollowUps(
  params: ListOperationalFollowUpsParams,
): Promise<OperationalFollowUpsPage> {
  const { workspaceId, attendanceId, ...queryParams } = params;
  const { data } = await api.get<OperationalFollowUpsPage>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/follow-ups`,
    { params: queryParams },
  );

  return data;
}
