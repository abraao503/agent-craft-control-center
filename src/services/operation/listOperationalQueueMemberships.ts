import { api } from "@/services/api";
import { OperationalQueueMembershipsPage } from "@/types/operation";

export async function listOperationalQueueMemberships(
  workspaceId: string,
  areaId: string,
  queueId: string,
  page = 1,
  limit = 100,
): Promise<OperationalQueueMembershipsPage> {
  const { data } = await api.get<OperationalQueueMembershipsPage>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/queues/${queueId}/members`,
    { params: { page, limit } },
  );

  return data;
}
