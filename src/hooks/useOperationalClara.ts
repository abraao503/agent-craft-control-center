import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { getOperationalClaraConfiguration } from "@/services/operation/getOperationalClaraConfiguration";
import { updateOperationalClaraConfiguration } from "@/services/operation/updateOperationalClaraConfiguration";
import { UpdateOperationalClaraConfigurationBody } from "@/types/operation-assistant";

export function useOperationalClaraConfiguration(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation-clara", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return getOperationalClaraConfiguration(workspaceId);
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalClaraMutation(workspaceId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const resolvedWorkspaceId =
    workspaceId ??
    (currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined);

  return useMutation({
    mutationFn: (body: UpdateOperationalClaraConfigurationBody) => {
      if (!resolvedWorkspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return updateOperationalClaraConfiguration({
        workspaceId: resolvedWorkspaceId,
        body,
      });
    },
    onSuccess: async () => {
      if (!resolvedWorkspaceId) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["operation-clara", resolvedWorkspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["operation-setup", resolvedWorkspaceId],
        }),
      ]);
    },
  });
}
