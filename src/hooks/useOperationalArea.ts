import { useQuery } from "@tanstack/react-query";
import { getOperationalArea } from "@/services/operation/getOperationalArea";

export function useOperationalArea(
  workspaceId?: string,
  areaId?: string,
) {
  return useQuery({
    queryKey: ["operation-area", workspaceId, areaId],
    queryFn: () => {
      if (!workspaceId || !areaId) {
        throw new Error("Área operacional não selecionada");
      }

      return getOperationalArea(workspaceId, areaId);
    },
    enabled: Boolean(workspaceId && areaId),
  });
}
