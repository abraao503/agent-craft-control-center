import { api } from "@/services/api";

export interface Workspace {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface GetCompanyByIdResponse {
  id: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  workspaces: Workspace[];
}

export async function getCompanyById(
  companyId: string
): Promise<GetCompanyByIdResponse> {
  const { data } = await api.get<GetCompanyByIdResponse>(
    `/company/${companyId}`
  );
  return data;
}
