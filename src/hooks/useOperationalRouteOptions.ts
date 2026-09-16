import { useQueries, useQuery } from "@tanstack/react-query";
import { listOperationalAssistantOptions } from "@/services/operation/listOperationalAssistantOptions";
import { listOperationalAreas } from "@/services/operation/listOperationalAreas";
import { listOperationalQueues } from "@/services/operation/listOperationalQueues";
import { listOperationalTriageAgents } from "@/services/operation/listOperationalTriageAgents";

export function useOperationalRouteOptions(
  workspaceId?: string,
  enabled = true,
  includeTriageAgents = false,
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

      return listOperationalAssistantOptions(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
  });

  const triageAgentsQuery = useQuery({
    queryKey: ["operation-route-triage-agents", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalTriageAgents(workspaceId, { activeOnly: true });
    },
    enabled: Boolean(workspaceId && enabled && includeTriageAgents),
  });

  return {
    areas,
    queues: queueQueries.flatMap((query) => query.data?.items ?? []),
    assistants: assistantsQuery.data?.items ?? [],
    triageAgents: triageAgentsQuery.data?.items ?? [],
    isLoading:
      enabled &&
      (areasQuery.isLoading ||
        assistantsQuery.isLoading ||
        (includeTriageAgents && triageAgentsQuery.isLoading) ||
        queueQueries.some((query) => query.isLoading)),
    isError:
      enabled &&
      (areasQuery.isError ||
        assistantsQuery.isError ||
        (includeTriageAgents && triageAgentsQuery.isError) ||
        queueQueries.some((query) => query.isError)),
    refetch: () => {
      void areasQuery.refetch();
      void assistantsQuery.refetch();
      if (includeTriageAgents) void triageAgentsQuery.refetch();
      queueQueries.forEach((query) => void query.refetch());
    },
  };
}
