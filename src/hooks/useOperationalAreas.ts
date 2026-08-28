import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { createOperationalArea } from "@/services/operation/createOperationalArea";
import { deleteOperationalArea } from "@/services/operation/deleteOperationalArea";
import { listOperationalAreas } from "@/services/operation/listOperationalAreas";
import { updateOperationalArea } from "@/services/operation/updateOperationalArea";
import {
  CreateOperationalAreaParams,
  DeleteOperationalAreaParams,
  UpdateOperationalAreaParams,
} from "@/types/operation";

export function useOperationalAreas(workspaceId?: string) {
  return useQuery({
    queryKey: ["operation-areas", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalAreas(workspaceId);
    },
    enabled: Boolean(workspaceId),
  });
}

export function useOperationalAreaMutations(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateAreas = () => {
    void queryClient.invalidateQueries({
      queryKey: ["operation-areas", resolvedWorkspaceId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["operation-setup", resolvedWorkspaceId],
    });
  };

  const create = useMutation({
    mutationFn: (params: Omit<CreateOperationalAreaParams, "workspaceId">) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return createOperationalArea({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateAreas,
  });

  const update = useMutation({
    mutationFn: (
      params: Omit<UpdateOperationalAreaParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return updateOperationalArea({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateAreas,
  });

  const remove = useMutation({
    mutationFn: (
      params: Omit<DeleteOperationalAreaParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return deleteOperationalArea({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateAreas,
  });

  return { create, update, remove };
}
