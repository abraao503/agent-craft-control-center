import { api } from "@/services/api";
import {
  ListAttendancesParams,
  OperationalConversationsPage,
} from "@/types/operation-attendance";

export async function listOperationalConversations(
  params: ListAttendancesParams,
): Promise<OperationalConversationsPage> {
  const { workspaceId, ...queryParams } = params;
  const { data } = await api.get<OperationalConversationsPage>(
    `/operation/workspaces/${workspaceId}/conversations`,
    { params: queryParams },
  );

  return data;
}
