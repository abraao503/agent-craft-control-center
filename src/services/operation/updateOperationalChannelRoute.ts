import { api } from "@/services/api";
import {
  OperationalChannelRoute,
  UpdateOperationalChannelRouteParams,
} from "@/types/operation-channels";

export async function updateOperationalChannelRoute(
  params: UpdateOperationalChannelRouteParams,
): Promise<OperationalChannelRoute> {
  const { data } = await api.patch<OperationalChannelRoute>(
    `/operation/workspaces/${params.workspaceId}/channel-routes/${params.routeId}`,
    params.body,
    { headers: { "Idempotency-Key": params.idempotencyKey } },
  );

  return data;
}
