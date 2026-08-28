import { api } from "@/services/api";
import { OperationalQueuesPage } from "@/types/operation";

export async function listOperationalQueues(
  workspaceId: string,
  areaId: string,
  page = 1,
  limit = 100,
): Promise<OperationalQueuesPage> {
  const { data } = await api.get<OperationalQueuesPage>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/queues`,
    { params: { page, limit } },
  );

  return data;
}
