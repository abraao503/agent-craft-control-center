import { api } from "@/services/api";
import {
  CreateOperationalQueueParams,
  ServiceQueue,
} from "@/types/operation";

export async function createOperationalQueue(
  params: CreateOperationalQueueParams,
): Promise<ServiceQueue> {
  const { workspaceId, areaId, ...body } = params;
  const { data } = await api.post<ServiceQueue>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/queues`,
    body,
  );

  return data;
}
