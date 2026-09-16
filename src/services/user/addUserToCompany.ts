import { api } from "@/services/api";
import { UserRole } from "@/services/company/listCompanyAdmins";

export interface AddUserToCompanyRequest {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  workspaceId?: string;
  companyId?: string; // Required for PLATFORM_ADMIN when creating users in a specific company
}

export interface AddUserToCompanyResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  workspaceId: string | null;
}

export async function addUserToCompany(
  params: AddUserToCompanyRequest
): Promise<AddUserToCompanyResponse> {
  const { data } = await api.post<AddUserToCompanyResponse>(
    "/user/add-to-company",
    params
  );
  return data;
}
