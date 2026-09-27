import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  listCommercialMetaManualAccounts,
  saveCommercialMetaManualAccount,
} from "@/services/whatsapp/commercialMetaManualAccounts";
import type {
  SaveCommercialMetaManualAccountParams,
} from "@/types/commercial-meta-manual-account";

export const commercialMetaManualAccountsQueryKey = (workspaceId?: string) =>
  ["commercial-meta-manual-accounts", workspaceId] as const;

export function useCommercialMetaManualAccounts(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: commercialMetaManualAccountsQueryKey(workspaceId),
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace comercial não selecionado");
      }

      return listCommercialMetaManualAccounts(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
    retry: false,
  });
}

export function useCommercialMetaManualAccountMutations(
  workspaceId?: string,
) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId = workspaceId ?? currentWorkspace?.id;

  const save = useMutation({
    mutationFn: (
      params: Omit<SaveCommercialMetaManualAccountParams, "workspaceId">,
    ) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace comercial não selecionado");
      }

      return saveCommercialMetaManualAccount({
        ...params,
        workspaceId: resolvedWorkspaceId,
      });
    },
    onSuccess: async () => {
      if (!resolvedWorkspaceId) return;

      await queryClient.invalidateQueries({
        queryKey: commercialMetaManualAccountsQueryKey(resolvedWorkspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: ["meta-cloud-diagnostic", resolvedWorkspaceId],
      });
    },
  });

  return { save };
}
