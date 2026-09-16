import { api } from "@/services/api";
import {
  OperationalChannel,
  UpdateOperationalChannelParams,
} from "@/types/operation-channels";

export async function updateOperationalChannel(
  params: UpdateOperationalChannelParams,
): Promise<OperationalChannel> {
  const { data } = await api.patch<OperationalChannel>(
    `/operation/workspaces/${params.workspaceId}/channels/${params.channelId}`,
    params.body,
    { headers: { "Idempotency-Key": params.idempotencyKey } },
  );

  return data;
}
