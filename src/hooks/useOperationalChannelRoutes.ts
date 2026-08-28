import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { createOperationalChannelRoute } from "@/services/operation/createOperationalChannelRoute";
import { deleteOperationalChannelRoute } from "@/services/operation/deleteOperationalChannelRoute";
import { listOperationalChannelRoutes } from "@/services/operation/listOperationalChannelRoutes";
import { updateOperationalChannelRoute } from "@/services/operation/updateOperationalChannelRoute";
import {
  CreateOperationalChannelRouteParams,
  DeleteOperationalChannelRouteParams,
  UpdateOperationalChannelRouteParams,
} from "@/types/operation-channels";

export function useOperationalChannelRoutes(
  workspaceId?: string,
  page = 1,
) {
  return useQuery({
    queryKey: ["operation-channel-routes", workspaceId, page],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalChannelRoutes(workspaceId, { page, limit: 100 });
    },
    enabled: Boolean(workspaceId),
  });
}

export function useOperationalChannelRouteMutations(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateRoutes = async () => {
    if (!resolvedWorkspaceId) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["operation-channel-routes", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-channels", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-setup", resolvedWorkspaceId],
      }),
    ]);
  };

  const create = useMutation({
    mutationFn: (
      params: Omit<CreateOperationalChannelRouteParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return createOperationalChannelRoute({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateRoutes,
  });

  const update = useMutation({
    mutationFn: (
      params: Omit<UpdateOperationalChannelRouteParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return updateOperationalChannelRoute({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateRoutes,
  });

  const remove = useMutation({
    mutationFn: (
      params: Omit<DeleteOperationalChannelRouteParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return deleteOperationalChannelRoute({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateRoutes,
  });

  return { create, update, remove };
}
