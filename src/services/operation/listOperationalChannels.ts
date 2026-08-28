import { api } from "@/services/api";
import {
  OperationalChannelListParams,
  OperationalChannelsPage,
} from "@/types/operation-channels";

export async function listOperationalChannels(
  workspaceId: string,
  params: OperationalChannelListParams = {},
): Promise<OperationalChannelsPage> {
  const { data } = await api.get<OperationalChannelsPage>(
    `/operation/workspaces/${workspaceId}/channels`,
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        ...(params.active === undefined ? {} : { active: params.active }),
        ...(params.provider ? { provider: params.provider } : {}),
      },
    },
  );

  return data;
}
