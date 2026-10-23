import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  createOperationalApiKey,
  listOperationalApiKeys,
  revokeOperationalApiKey,
} from "@/services/operation-api-access";

const rootKey = ["operation", "api-keys"] as const;

export function useOperationalApiKeys(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [...rootKey, workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listOperationalApiKeys(workspaceId, { page: 1, limit: 100 });
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalApiKeyMutations(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const invalidate = () => {
    if (!resolvedWorkspaceId) return;
    return queryClient.invalidateQueries({
      queryKey: [...rootKey, resolvedWorkspaceId],
    });
  };

  const create = useMutation({
    mutationFn: (name: string) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return createOperationalApiKey(resolvedWorkspaceId, name);
    },
    onSuccess: invalidate,
  });

  const revoke = useMutation({
    mutationFn: (apiKeyId: string) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return revokeOperationalApiKey(resolvedWorkspaceId, apiKeyId);
    },
    onSuccess: invalidate,
  });

  return { create, revoke };
}
