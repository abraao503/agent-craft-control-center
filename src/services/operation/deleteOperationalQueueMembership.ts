import { api } from "@/services/api";
import { DeleteOperationalQueueMembershipParams } from "@/types/operation";

export async function deleteOperationalQueueMembership(
  params: DeleteOperationalQueueMembershipParams,
): Promise<void> {
  const { workspaceId, areaId, queueId, userId, expectedVersion } = params;
  await api.delete(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/queues/${queueId}/members/${userId}`,
    {
      params: {
        ...(expectedVersion !== undefined && { expectedVersion }),
      },
    },
  );
}
