import { api } from "@/services/api";
import { DeleteOperationalChannelRouteParams } from "@/types/operation-channels";

export async function deleteOperationalChannelRoute(
  params: DeleteOperationalChannelRouteParams,
): Promise<void> {
  await api.delete(
    `/operation/workspaces/${params.workspaceId}/channel-routes/${params.routeId}`,
    {
      data: { expectedVersion: params.expectedVersion },
      headers: { "Idempotency-Key": params.idempotencyKey },
    },
  );
}
