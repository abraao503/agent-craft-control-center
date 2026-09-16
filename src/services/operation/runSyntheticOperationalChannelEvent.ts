import { api } from "@/services/api";
import {
  RunSyntheticOperationalChannelEventBody,
  RunSyntheticOperationalChannelEventResponse,
} from "@/types/operation-synthetic-event";

export async function runSyntheticOperationalChannelEvent(
  workspaceId: string,
  body: RunSyntheticOperationalChannelEventBody,
): Promise<RunSyntheticOperationalChannelEventResponse> {
  const { data } = await api.post<RunSyntheticOperationalChannelEventResponse>(
    `/operation/workspaces/${workspaceId}/channel-events/synthetic`,
    body,
    { headers: { "Idempotency-Key": crypto.randomUUID() } },
  );

  return data;
}
