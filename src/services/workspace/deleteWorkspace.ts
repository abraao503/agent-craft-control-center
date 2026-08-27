import { api } from "@/services/api";

export interface DeleteWorkspaceParams {
  workspaceId: string;
}

export type DeleteWorkspaceError =
  | "Workspace not found"
  | "Cannot delete default workspace"
  | "Unauthorized"
  | "Failed to delete workspace";

/**
 * Deleta um workspace
 * Não é possível deletar o workspace padrão
 */
export const deleteWorkspace = async (
  params: DeleteWorkspaceParams
): Promise<void> => {
  await api.delete<void>(`/workspace/${params.workspaceId}`);
};
