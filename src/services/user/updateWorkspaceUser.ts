import { api } from "@/services/api";
import { UserRole } from "@/services/company/listCompanyAdmins";

export interface UpdateWorkspaceUserRequest {
  userId: string;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface UpdateWorkspaceUserResponse {
  success: boolean;
  message?: string;
}

export async function updateWorkspaceUser(
  params: UpdateWorkspaceUserRequest
): Promise<UpdateWorkspaceUserResponse> {
  const { userId, ...updateData } = params;
  const { data } = await api.patch<UpdateWorkspaceUserResponse>(
    `/user/${userId}`,
    updateData
  );
  return data;
}
