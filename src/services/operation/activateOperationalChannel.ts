import { api } from "@/services/api";
import {
  ActivateOperationalChannelData,
  ActivateOperationalChannelParams,
} from "@/types/operation-channels";

export async function activateOperationalChannel(
  params: ActivateOperationalChannelParams,
): Promise<ActivateOperationalChannelData> {
  const { data } = await api.post<ActivateOperationalChannelData>(
    `/operation/workspaces/${params.workspaceId}/channels/${params.channelId}/activate`,
    undefined,
    { headers: { "Idempotency-Key": params.idempotencyKey } },
  );

  return data;
}
