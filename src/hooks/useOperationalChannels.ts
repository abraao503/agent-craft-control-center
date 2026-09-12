import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { createOperationalChannel } from "@/services/operation/createOperationalChannel";
import { deactivateOperationalChannel } from "@/services/operation/deactivateOperationalChannel";
import { activateOperationalChannel } from "@/services/operation/activateOperationalChannel";
import { listOperationalChannelProviders } from "@/services/operation/listOperationalChannelProviders";
import { listOperationalChannels } from "@/services/operation/listOperationalChannels";
import { requestOperationalChannelQrCode } from "@/services/operation/requestOperationalChannelQrCode";
import { updateOperationalChannel } from "@/services/operation/updateOperationalChannel";
import {
  ActivateOperationalChannelParams,
  CreateOperationalChannelParams,
  DeactivateOperationalChannelParams,
  RequestOperationalChannelQrCodeParams,
  UpdateOperationalChannelParams,
} from "@/types/operation-channels";

export function useOperationalChannels(
  workspaceId?: string,
  page = 1,
  enabled = true,
  active?: boolean,
) {
  return useQuery({
    queryKey: ["operation-channels", workspaceId, page, active],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalChannels(workspaceId, {
        page,
        limit: 100,
        active,
      });
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalChannelProviders(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation-channel-providers", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalChannelProviders(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalChannelMutations(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateChannels = async () => {
    if (!resolvedWorkspaceId) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["operation-channels", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-channel-routes", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-setup", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-meta-phone-numbers", resolvedWorkspaceId],
      }),
    ]);
  };

  const create = useMutation({
    mutationFn: (
      params: Omit<CreateOperationalChannelParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return createOperationalChannel({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateChannels,
  });

  const update = useMutation({
    mutationFn: (
      params: Omit<UpdateOperationalChannelParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return updateOperationalChannel({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateChannels,
  });

  const deactivate = useMutation({
    mutationFn: (
      params: Omit<DeactivateOperationalChannelParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return deactivateOperationalChannel({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateChannels,
  });

  const activate = useMutation({
    mutationFn: (
      params: Omit<ActivateOperationalChannelParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return activateOperationalChannel({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateChannels,
  });

  const requestQrCode = useMutation({
    mutationFn: (
      params: Omit<RequestOperationalChannelQrCodeParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return requestOperationalChannelQrCode({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
  });

  return {
    create,
    update,
    deactivate,
    activate,
    requestQrCode,
  };
}
