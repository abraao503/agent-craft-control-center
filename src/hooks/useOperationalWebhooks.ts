import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  createOperationalWebhook,
  getOperationalWebhook,
  listOperationalWebhookExecutions,
  listOperationalWebhooks,
  regenerateOperationalWebhook,
  updateOperationalWebhook,
} from "@/services/operation-webhook";
import type {
  CreateOperationalWebhookInput,
  OperationalWebhookExecutionListParams,
  OperationalWebhookListParams,
  UpdateOperationalWebhookInput,
} from "@/types/operational-webhook";

const rootKey = ["operation", "webhooks"] as const;

export function useOperationalWebhooks(
  workspaceId?: string,
  params: OperationalWebhookListParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [...rootKey, workspaceId, params],
    queryFn: () => {
      if (!workspaceId) throw new Error("Workspace operacional não selecionado");
      return listOperationalWebhooks(workspaceId, params);
    },
    enabled: Boolean(workspaceId && enabled),
    placeholderData: (previousData) => previousData,
  });
}

export function useOperationalWebhook(
  workspaceId?: string,
  webhookId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [...rootKey, workspaceId, webhookId],
    queryFn: () => {
      if (!workspaceId) throw new Error("Workspace operacional não selecionado");
      if (!webhookId) throw new Error("Webhook operacional não informado");
      return getOperationalWebhook(workspaceId, webhookId);
    },
    enabled: Boolean(workspaceId && webhookId && enabled),
  });
}

export function useOperationalWebhookExecutions(
  workspaceId?: string,
  webhookId?: string,
  params: OperationalWebhookExecutionListParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [...rootKey, workspaceId, webhookId, "executions", params],
    queryFn: () => {
      if (!workspaceId) throw new Error("Workspace operacional não selecionado");
      if (!webhookId) throw new Error("Webhook operacional não informado");
      return listOperationalWebhookExecutions(workspaceId, webhookId, params);
    },
    enabled: Boolean(workspaceId && webhookId && enabled),
    placeholderData: (previousData) => previousData,
  });
}

export function useOperationalWebhookMutations(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidate = async (webhookId?: string) => {
    if (!resolvedWorkspaceId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [...rootKey, resolvedWorkspaceId] }),
      webhookId
        ? queryClient.invalidateQueries({
            queryKey: [...rootKey, resolvedWorkspaceId, webhookId],
          })
        : Promise.resolve(),
    ]);
  };

  const create = useMutation({
    mutationFn: (input: CreateOperationalWebhookInput) => {
      if (!resolvedWorkspaceId) throw new Error("Workspace operacional não selecionado");
      return createOperationalWebhook(resolvedWorkspaceId, input);
    },
    onSuccess: () => invalidate(),
  });

  const update = useMutation({
    mutationFn: (input: UpdateOperationalWebhookInput & { webhookId: string }) => {
      if (!resolvedWorkspaceId) throw new Error("Workspace operacional não selecionado");
      const { webhookId, ...body } = input;
      return updateOperationalWebhook(resolvedWorkspaceId, webhookId, body);
    },
    onSuccess: (webhook) => invalidate(webhook.id),
  });

  const regenerate = useMutation({
    mutationFn: (webhookId: string) => {
      if (!resolvedWorkspaceId) throw new Error("Workspace operacional não selecionado");
      return regenerateOperationalWebhook(resolvedWorkspaceId, webhookId);
    },
    onSuccess: (result) => invalidate(result.webhook.id),
  });

  return { create, update, regenerate };
}
