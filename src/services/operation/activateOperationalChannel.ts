import { api } from "@/services/api";
import { ActivateOperationalChannelParams } from "@/types/operation-channels";

export async function activateOperationalChannel(
  params: ActivateOperationalChannelParams,
): Promise<void> {
  await api.post<void>(
    `/operation/workspaces/${params.workspaceId}/channels/${params.channelId}/activate`,
    undefined,
    { headers: { "Idempotency-Key": params.idempotencyKey } },
  );
}
