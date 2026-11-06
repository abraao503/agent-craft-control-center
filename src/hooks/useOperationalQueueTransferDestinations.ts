import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOperationalQueueTransferDestinations } from "@/services/operation/getOperationalQueueTransferDestinations";
import { updateOperationalQueueTransferDestinations } from "@/services/operation/updateOperationalQueueTransferDestinations";

export function useOperationalQueueTransferDestinations(
  workspaceId?: string,
  areaId?: string,
  queueId?: string,
) {
  const queryClient = useQueryClient();
  const queryKey = [
    "operation-queue-transfer-destinations",
    workspaceId,
    areaId,
    queueId,
  ] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!workspaceId || !areaId || !queueId) {
        throw new Error("Fila operacional não selecionada");
      }

      return getOperationalQueueTransferDestinations({
        workspaceId,
        areaId,
        queueId,
      });
    },
    enabled: Boolean(workspaceId && areaId && queueId),
  });

  const update = useMutation({
    mutationFn: (params: { expectedVersion: number; targetQueueIds: string[] }) => {
      if (!workspaceId || !areaId || !queueId) {
        throw new Error("Fila operacional não selecionada");
      }

      return updateOperationalQueueTransferDestinations({
        ...params,
        workspaceId,
        areaId,
        queueId,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return { query, update };
}
