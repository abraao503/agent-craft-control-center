import { useQuery } from "@tanstack/react-query";
import { listOperationalChannelTemplates } from "@/services/operation/listOperationalChannelTemplates";

export const operationalChannelTemplatesQueryKey = (
  workspaceId?: string,
  channelId?: string,
) => ["operation", "channel-templates", workspaceId, channelId] as const;

export function useOperationalChannelTemplates(
  workspaceId?: string,
  channelId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: operationalChannelTemplatesQueryKey(workspaceId, channelId),
    queryFn: () =>
      listOperationalChannelTemplates(workspaceId!, channelId!),
    enabled: Boolean(workspaceId && channelId && enabled),
    staleTime: 30_000,
  });
}
