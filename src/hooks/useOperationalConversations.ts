import { useInfiniteQuery } from "@tanstack/react-query";
import { listOperationalConversations } from "@/services/operation/listOperationalConversations";
import { ListAttendancesFilters } from "@/types/operation-attendance";

export function useOperationalConversations(
  workspaceId?: string,
  filters: ListAttendancesFilters = {},
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ["operation", "conversations", workspaceId, filters],
    queryFn: ({ pageParam }) => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalConversations({
        workspaceId,
        ...filters,
        page: pageParam,
      });
    },
    initialPageParam: filters.page ?? 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: Boolean(workspaceId && enabled),
    placeholderData: (previousData) => previousData,
  });
}
