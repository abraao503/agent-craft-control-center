import { api } from "@/services/api";
import type { MetaCloudTemplate } from "@/services/whatsapp/metaCloud";

export async function listOperationalChannelTemplates(
  workspaceId: string,
  channelId: string,
): Promise<MetaCloudTemplate[]> {
  const { data } = await api.get<MetaCloudTemplate[]>(
    `/operation/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/templates`,
  );

  return data;
}
