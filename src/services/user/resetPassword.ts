import { api } from "@/services/api";

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  await api.post("/user/reset-password", { token, newPassword });
}
