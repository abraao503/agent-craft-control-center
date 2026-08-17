import { AuthSessionResponse } from "@/types/auth";
import { api } from "../api";

export async function stopUserImpersonation(): Promise<AuthSessionResponse> {
  const { data } = await api.post<AuthSessionResponse>(
    "/user/impersonation/stop",
  );

  return data;
}
