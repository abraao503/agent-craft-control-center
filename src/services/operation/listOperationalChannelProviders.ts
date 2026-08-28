import { api } from "@/services/api";
import { OperationalChannelProvider } from "@/types/operation-channels";

export async function listOperationalChannelProviders(
  workspaceId: string,
): Promise<OperationalChannelProvider[]> {
  const { data } = await api.get<OperationalChannelProvider[]>(
    `/operation/workspaces/${workspaceId}/channels/providers`,
  );

  return data;
}
