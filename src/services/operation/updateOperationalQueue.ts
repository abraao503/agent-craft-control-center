import { api } from "@/services/api";
import {
  ServiceQueue,
  UpdateOperationalQueueParams,
} from "@/types/operation";

export async function updateOperationalQueue(
  params: UpdateOperationalQueueParams,
): Promise<ServiceQueue> {
  const { workspaceId, areaId, queueId, ...body } = params;
  const { data } = await api.patch<ServiceQueue>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/queues/${queueId}`,
    body,
  );

  return data;
}
