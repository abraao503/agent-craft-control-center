import { api } from "@/services/api";
import { DeleteOperationalQueueParams } from "@/types/operation";

export async function deleteOperationalQueue(
  params: DeleteOperationalQueueParams,
): Promise<void> {
  const { workspaceId, areaId, queueId, expectedVersion } = params;
  await api.delete(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/queues/${queueId}`,
    { params: { expectedVersion } },
  );
}
