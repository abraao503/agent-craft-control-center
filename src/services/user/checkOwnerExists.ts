import { api } from "@/services/api";

export interface CheckOwnerExistsRequest {
  companyId?: string;
  workspaceId?: string;
}

export interface CheckOwnerExistsResponse {
  exists: boolean;
  ownerName?: string;
}

/**
 * Verifica se já existe um COMPANY_OWNER na empresa ou WORKSPACE_OWNER no workspace
 */
export async function checkOwnerExists(
  params: CheckOwnerExistsRequest
): Promise<CheckOwnerExistsResponse> {
  try {
    const { data } = await api.get<CheckOwnerExistsResponse>(
      "/user/check-owner",
      { params }
    );
    return data;
  } catch (error) {
    // Se o endpoint não existir ainda, assumimos que não há validação
    return { exists: false };
  }
}
