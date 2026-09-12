import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { configureOperationalMetaWebhook } from "@/services/operation/configureOperationalMetaWebhook";
import { listOperationalMetaManualAccounts } from "@/services/operation/listOperationalMetaManualAccounts";
import { saveOperationalMetaManualAccount } from "@/services/operation/saveOperationalMetaManualAccount";
import type {
  ConfigureOperationalMetaWebhookParams,
  SaveOperationalMetaManualAccountParams,
} from "@/types/operation-meta-manual-account";

export function useOperationalMetaManualAccounts(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation-meta-manual-accounts", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalMetaManualAccounts(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
    retry: false,
  });
}

export function useOperationalMetaManualAccountMutations(
  workspaceId?: string,
) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidateManualAccountQueries = async () => {
    if (!resolvedWorkspaceId) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["operation-meta-manual-accounts", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-meta-phone-numbers", resolvedWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["operation-channels", resolvedWorkspaceId],
      }),
    ]);
  };

  const save = useMutation({
    mutationFn: (
      params: Omit<SaveOperationalMetaManualAccountParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return saveOperationalMetaManualAccount({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateManualAccountQueries,
  });

  const configureWebhook = useMutation({
    mutationFn: (
      params: Omit<ConfigureOperationalMetaWebhookParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return configureOperationalMetaWebhook({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: invalidateManualAccountQueries,
  });

  return { save, configureWebhook };
}
