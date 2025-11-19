import { api } from "@/services/api";

export interface DeleteUserRequest {
  userId: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message?: string;
}

/**
 * Deleta um usuário do sistema
 * O backend valida se o usuário solicitante tem permissão para deletar
 */
export async function deleteUser(
  params: DeleteUserRequest
): Promise<DeleteUserResponse> {
  const { data } = await api.delete<DeleteUserResponse>(
    `/user/${params.userId}`
  );
  return data;
}
