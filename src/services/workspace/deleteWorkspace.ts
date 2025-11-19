import { api } from "@/services/api";

export interface DeleteWorkspaceParams {
  workspaceId: string;
}

export interface DeleteWorkspaceResponse {
  success: boolean;
  message?: string;
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
): Promise<DeleteWorkspaceResponse> => {
  const response = await api.delete<DeleteWorkspaceResponse>(
    `/workspace/${params.workspaceId}`
  );
  return response.data;
};
