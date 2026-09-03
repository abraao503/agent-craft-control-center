import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { createOperationalAssistant } from "@/services/operation/createOperationalAssistant";
import { deleteOperationalAssistant } from "@/services/operation/deleteOperationalAssistant";
import { getOperationalAssistant } from "@/services/operation/getOperationalAssistant";
import { listOperationalAssistantOptions } from "@/services/operation/listOperationalAssistantOptions";
import { listOperationalAssistants } from "@/services/operation/listOperationalAssistants";
import { updateOperationalAssistant } from "@/services/operation/updateOperationalAssistant";
import {
  CreateOperationalAssistantParams,
  DeleteOperationalAssistantParams,
  UpdateOperationalAssistantParams,
} from "@/types/operation-assistant";

export function useOperationalAssistants(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation-assistants", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalAssistants(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalAssistant(
  workspaceId?: string,
  assistantId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation-assistant", workspaceId, assistantId],
    queryFn: () => {
      if (!workspaceId || !assistantId) {
        throw new Error("Assistant operacional não selecionado");
      }

      return getOperationalAssistant(workspaceId, assistantId);
    },
    enabled: Boolean(workspaceId && assistantId && enabled),
  });
}

export function useOperationalAssistantOptions(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation-assistant-options", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalAssistantOptions(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalAssistantMutations(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateOperationalAssistantState = async () => {
    if (!resolvedWorkspaceId) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["operation-assistants", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-assistant-options", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-route-assistants", resolvedWorkspaceId],
      }),
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
      params: Omit<CreateOperationalAssistantParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return createOperationalAssistant({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateOperationalAssistantState,
  });

  const update = useMutation({
    mutationFn: (
      params: Omit<UpdateOperationalAssistantParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return updateOperationalAssistant({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateOperationalAssistantState,
  });

  const remove = useMutation({
    mutationFn: (
      params: Omit<DeleteOperationalAssistantParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return deleteOperationalAssistant({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateOperationalAssistantState,
  });

  return { create, update, remove };
}
