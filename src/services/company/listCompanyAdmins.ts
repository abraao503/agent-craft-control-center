import { api } from "@/services/api";

export enum UserRole {
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
  COMPANY_OWNER = "COMPANY_OWNER",
  COMPANY_ADMIN = "COMPANY_ADMIN",
  WORKSPACE_OWNER = "WORKSPACE_OWNER",
  WORKSPACE_ADMIN = "WORKSPACE_ADMIN",
  WORKSPACE_MANAGER = "WORKSPACE_MANAGER",
  SALES_REP = "SALES_REP",
}

export interface CompanyAdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface ListCompanyAdminsParams {
  companyId: string;
  page?: number;
  limit?: number;
}

export interface ListCompanyAdminsResponse {
  users: CompanyAdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listCompanyAdmins(
  params: ListCompanyAdminsParams
): Promise<ListCompanyAdminsResponse> {
  const { companyId, page = 1, limit = 10 } = params;
  const { data } = await api.get<ListCompanyAdminsResponse>(
    `/company/${companyId}/admins`,
    {
      params: { page, limit },
    }
  );
  return data;
}
