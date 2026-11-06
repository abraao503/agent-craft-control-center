import { api } from "@/services/api";
import { OperationalQueueTransferDestinations } from "@/types/operation";

export async function updateOperationalQueueTransferDestinations(params: {
  workspaceId: string;
  areaId: string;
  queueId: string;
  expectedVersion: number;
  targetQueueIds: string[];
}): Promise<OperationalQueueTransferDestinations> {
  const { data } = await api.patch<OperationalQueueTransferDestinations>(
    `/operation/workspaces/${params.workspaceId}/areas/${params.areaId}/queues/${params.queueId}/transfer-destinations`,
    {
      expectedVersion: params.expectedVersion,
      targetQueueIds: params.targetQueueIds,
    },
  );

  return data;
}
