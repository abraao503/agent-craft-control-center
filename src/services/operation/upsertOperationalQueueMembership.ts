import { api } from "@/services/api";
import {
  QueueMembership,
  UpsertOperationalQueueMembershipParams,
} from "@/types/operation";

export async function upsertOperationalQueueMembership(
  params: UpsertOperationalQueueMembershipParams,
): Promise<QueueMembership> {
  const { workspaceId, areaId, queueId, userId, expectedVersion } = params;
  const { data } = await api.put<QueueMembership>(
    `/operation/workspaces/${workspaceId}/areas/${areaId}/queues/${queueId}/members/${userId}`,
    {
      ...(expectedVersion !== undefined && { expectedVersion }),
    },
  );

  return data;
}
