import { useQueries, useQuery } from "@tanstack/react-query";
import { listAgent } from "@/services/agent/listAgent";
import { listOperationalAreas } from "@/services/operation/listOperationalAreas";
import { listOperationalQueues } from "@/services/operation/listOperationalQueues";

export function useOperationalRouteOptions(
  workspaceId?: string,
  enabled = true,
) {
  const areasQuery = useQuery({
    queryKey: ["operation-areas", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalAreas(workspaceId, 1, 100);
    },
    enabled: Boolean(workspaceId && enabled),
  });

  const areas = areasQuery.data?.items ?? [];
  const queueQueries = useQueries({
    queries: areas.map((area) => ({
      queryKey: ["operation-queues", workspaceId, area.id],
      queryFn: () => {
        if (!workspaceId) {
          throw new Error("Workspace operacional não selecionado");
        }

        return listOperationalQueues(workspaceId, area.id, 1, 100);
      },
      enabled: Boolean(workspaceId && enabled),
    })),
  });

  const assistantsQuery = useQuery({
    queryKey: ["operation-route-assistants", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listAgent(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
  });

  return {
    areas,
    queues: queueQueries.flatMap((query) => query.data?.items ?? []),
    assistants: assistantsQuery.data?.agents ?? [],
    isLoading:
      enabled &&
      (areasQuery.isLoading ||
        assistantsQuery.isLoading ||
        queueQueries.some((query) => query.isLoading)),
    isError:
      enabled &&
      (areasQuery.isError ||
        assistantsQuery.isError ||
        queueQueries.some((query) => query.isError)),
    refetch: () => {
      void areasQuery.refetch();
      void assistantsQuery.refetch();
      queueQueries.forEach((query) => void query.refetch());
    },
  };
}
