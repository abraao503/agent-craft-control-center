import { useQuery } from "@tanstack/react-query";
import { listOperationalConversations } from "@/services/operation/listOperationalConversations";
import { ListAttendancesFilters } from "@/types/operation-attendance";

export function useOperationalConversations(
  workspaceId?: string,
  filters: ListAttendancesFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation", "conversations", workspaceId, filters],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalConversations({ workspaceId, ...filters });
    },
    enabled: Boolean(workspaceId && enabled),
    placeholderData: (previousData) => previousData,
  });
}
