import { useQuery } from "@tanstack/react-query";
import { getOperationalQueue } from "@/services/operation/getOperationalQueue";

export function useOperationalQueue(
  workspaceId?: string,
  areaId?: string,
  queueId?: string,
) {
  return useQuery({
    queryKey: ["operation-queue", workspaceId, areaId, queueId],
    queryFn: () => {
      if (!workspaceId || !areaId || !queueId) {
        throw new Error("Fila operacional não selecionada");
      }

      return getOperationalQueue(workspaceId, areaId, queueId);
    },
    enabled: Boolean(workspaceId && areaId && queueId),
  });
}
