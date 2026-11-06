import { api } from "@/services/api";
import { OperationalQueueTransferDestinations } from "@/types/operation";

export async function getOperationalQueueTransferDestinations(params: {
  workspaceId: string;
  areaId: string;
  queueId: string;
}): Promise<OperationalQueueTransferDestinations> {
  const { data } = await api.get<OperationalQueueTransferDestinations>(
    `/operation/workspaces/${params.workspaceId}/areas/${params.areaId}/queues/${params.queueId}/transfer-destinations`,
  );

  return data;
}
