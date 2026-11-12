import { api } from "@/services/api";

export interface RefreshOperationalChannelStatusData {
  channelId: string;
  status: string;
  connectionStatus: string;
  confirmed: boolean;
}

export async function refreshOperationalChannelStatus(params: {
  workspaceId: string;
  channelId: string;
}): Promise<RefreshOperationalChannelStatusData> {
  const { data } = await api.post<RefreshOperationalChannelStatusData>(
    `/operation/workspaces/${params.workspaceId}/channels/${params.channelId}/refresh-status`,
  );
  return data;
}
