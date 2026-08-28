import { api } from "@/services/api";
import {
  DeactivateOperationalChannelParams,
  OperationalChannel,
} from "@/types/operation-channels";

export async function deactivateOperationalChannel(
  params: DeactivateOperationalChannelParams,
): Promise<OperationalChannel> {
  const { data } = await api.post<OperationalChannel>(
    `/operation/workspaces/${params.workspaceId}/channels/${params.channelId}/deactivate`,
    { expectedVersion: params.expectedVersion },
    { headers: { "Idempotency-Key": params.idempotencyKey } },
  );

  return data;
}
