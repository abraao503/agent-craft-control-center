import { api } from "@/services/api";
import {
  CreateOperationalChannelRouteParams,
  OperationalChannelRoute,
} from "@/types/operation-channels";

export async function createOperationalChannelRoute(
  params: CreateOperationalChannelRouteParams,
): Promise<OperationalChannelRoute> {
  const { data } = await api.post<OperationalChannelRoute>(
    `/operation/workspaces/${params.workspaceId}/channel-routes`,
    params.body,
    { headers: { "Idempotency-Key": params.idempotencyKey } },
  );

  return data;
}
