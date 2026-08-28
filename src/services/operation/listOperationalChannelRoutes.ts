import { api } from "@/services/api";
import {
  OperationalChannelRouteListParams,
  OperationalChannelRoutesPage,
} from "@/types/operation-channels";

export async function listOperationalChannelRoutes(
  workspaceId: string,
  params: OperationalChannelRouteListParams = {},
): Promise<OperationalChannelRoutesPage> {
  const { data } = await api.get<OperationalChannelRoutesPage>(
    `/operation/workspaces/${workspaceId}/channel-routes`,
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        ...(params.channelId ? { channelId: params.channelId } : {}),
        ...(params.configurationStatus
          ? { configurationStatus: params.configurationStatus }
          : {}),
      },
    },
  );

  return data;
}
