import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { getOperationalDistribution } from "@/services/operation/getOperationalDistribution";
import { getOperationalDistributionOptions } from "@/services/operation/getOperationalDistributionOptions";
import { updateOperationalDistribution } from "@/services/operation/updateOperationalDistribution";
import { UpdateOperationalDistributionBody } from "@/types/operation-distribution";

export function useOperationalDistribution(
  workspaceId?: string,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  const settings = useQuery({
    queryKey: ["operation-distribution", resolvedWorkspaceId],
    queryFn: () => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return getOperationalDistribution(resolvedWorkspaceId);
    },
    enabled: Boolean(resolvedWorkspaceId && enabled),
  });

  const options = useQuery({
    queryKey: ["operation-distribution-options", resolvedWorkspaceId],
    queryFn: () => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return getOperationalDistributionOptions(resolvedWorkspaceId);
    },
    enabled: Boolean(resolvedWorkspaceId && enabled),
  });

  const update = useMutation({
    mutationFn: (body: UpdateOperationalDistributionBody) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return updateOperationalDistribution({
        workspaceId: resolvedWorkspaceId,
        body,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["operation-distribution", resolvedWorkspaceId],
      });
    },
  });

  return { settings, options, update, workspaceId: resolvedWorkspaceId };
}
