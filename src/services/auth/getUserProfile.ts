import { api } from "@/services/api";
import { UserProfile } from "@/types/auth";

export async function getUserProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/user/me");
  return data;
}
