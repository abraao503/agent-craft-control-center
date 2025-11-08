import { api } from "@/services/api";
import { Workspace } from "@/types/workspace";

export interface CreateWorkspaceParams {
  name: string;
  companyId?: string; // Optional - PLATFORM_ADMIN can specify, others use their own
}

export const createWorkspace = async (
  params: CreateWorkspaceParams
): Promise<Workspace> => {
  const response = await api.post<Workspace>("/workspace", params);
  return response.data;
};
