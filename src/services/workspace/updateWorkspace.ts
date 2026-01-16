import { api } from "@/services/api";
import { Workspace } from "@/types/workspace";

export interface UpdateWorkspaceParams {
  workspaceId: string;
  name: string;
}

export const updateWorkspace = async (
  params: UpdateWorkspaceParams
): Promise<Workspace> => {
  const { workspaceId, ...body } = params;
  const response = await api.patch<Workspace>(
    `/workspace/${workspaceId}`,
    body
  );
  return response.data;
};
