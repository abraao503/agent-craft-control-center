import { api } from "@/services/api";

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/user/forgot-password", { email });
}
