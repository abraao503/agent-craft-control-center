import { api } from "@/services/api";
import { UserRole } from "@/services/company/listCompanyAdmins";

export interface AddUserToCompanyRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  workspaceId?: string;
}

export interface AddUserToCompanyResponse {
  success: boolean;
  userId?: string;
  message?: string;
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
