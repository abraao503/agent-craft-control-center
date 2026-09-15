import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { createOperationalQueue } from "@/services/operation/createOperationalQueue";
import { deleteOperationalQueue } from "@/services/operation/deleteOperationalQueue";
import { listOperationalQueues } from "@/services/operation/listOperationalQueues";
import { updateOperationalQueue } from "@/services/operation/updateOperationalQueue";
import {
  CreateOperationalQueueParams,
  DeleteOperationalQueueParams,
  UpdateOperationalQueueParams,
} from "@/types/operation";

export function useOperationalQueues(
  workspaceId?: string,
  areaId?: string,
  page = 1,
  limit = 20,
) {
  return useQuery({
    queryKey: ["operation-queues", workspaceId, areaId, page, limit],
    queryFn: () => {
      if (!workspaceId || !areaId) {
        throw new Error("Área operacional não selecionada");
      }

      return listOperationalQueues(workspaceId, areaId, page, limit);
    },
    enabled: Boolean(workspaceId && areaId),
    placeholderData: (previousData) => previousData,
  });
}

export function useOperationalQueueMutations(
  workspaceId?: string,
  areaId?: string,
) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateQueues = () => {
    void queryClient.invalidateQueries({
      queryKey: ["operation-queues", resolvedWorkspaceId, areaId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation-setup", resolvedWorkspaceId],
    });
  };

  const create = useMutation({
    mutationFn: (
      params: Omit<CreateOperationalQueueParams, "workspaceId" | "areaId">,
    ) => {
      if (!resolvedWorkspaceId || !areaId) {
        throw new Error("Área operacional não selecionada");
      }

      return createOperationalQueue({
        ...params,
        workspaceId: resolvedWorkspaceId,
        areaId,
      });
    },
    onSuccess: invalidateQueues,
  });

  const update = useMutation({
    mutationFn: (
      params: Omit<UpdateOperationalQueueParams, "workspaceId" | "areaId">,
    ) => {
      if (!resolvedWorkspaceId || !areaId) {
        throw new Error("Área operacional não selecionada");
      }

      return updateOperationalQueue({
        ...params,
        workspaceId: resolvedWorkspaceId,
        areaId,
      });
    },
    onSuccess: invalidateQueues,
  });

  const remove = useMutation({
    mutationFn: (
      params: Omit<DeleteOperationalQueueParams, "workspaceId" | "areaId">,
    ) => {
      if (!resolvedWorkspaceId || !areaId) {
        throw new Error("Área operacional não selecionada");
      }

      return deleteOperationalQueue({
        ...params,
        workspaceId: resolvedWorkspaceId,
        areaId,
      });
    },
    onSuccess: invalidateQueues,
  });

  return { create, update, remove };
}
