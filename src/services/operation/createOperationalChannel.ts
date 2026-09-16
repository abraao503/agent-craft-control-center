import { api } from "@/services/api";
import {
  CreateOperationalChannelParams,
  OperationalChannel,
} from "@/types/operation-channels";

export async function createOperationalChannel(
  params: CreateOperationalChannelParams,
): Promise<OperationalChannel> {
  const { data } = await api.post<OperationalChannel>(
    `/operation/workspaces/${params.workspaceId}/channels`,
    params.body,
    { headers: { "Idempotency-Key": params.idempotencyKey } },
  );

  return data;
}
