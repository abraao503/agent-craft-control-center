import { api } from "@/services/api";
import { ServiceArea, ServiceQueue } from "@/types/operation";

export interface OperationalQueueDetail {
  area: ServiceArea;
  queue: ServiceQueue;
}

export async function getOperationalQueue(
  workspaceId: string,
  areaId: string,
  queueId: string,
): Promise<OperationalQueueDetail> {
  const { data } = await api.get<OperationalQueueDetail>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/queues/${queueId}`,
  );

  return data;
}
