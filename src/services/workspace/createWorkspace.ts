import { api } from "@/lib/api";
import { Workspace } from "@/types/workspace";

export interface CreateWorkspaceParams {
  name: string;
}

export const createWorkspace = async (params: CreateWorkspaceParams): Promise<Workspace> => {
  const response = await api.post<Workspace>("/workspace", params);
  return response.data;
};
