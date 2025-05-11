import { Workspace } from "@/types/workspace";
import { api } from "../api";

export const listWorkspaces = async (): Promise<Workspace[]> => {
  const response = await api.get<Workspace[]>("/workspace/list");
  return response.data;
};
