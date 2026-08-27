import { useQuery } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { getOperationalSetup } from "@/services/operation/getOperationalSetup";

export function useOperationalSetup() {
  const { currentWorkspace } = useWorkspaceContext();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;

  return useQuery({
    queryKey: ["operation-setup", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return getOperationalSetup(workspaceId);
    },
    enabled: Boolean(workspaceId),
  });
}
