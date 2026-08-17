import { AuthSessionResponse } from "@/types/auth";
import { api } from "../api";

export interface StartUserImpersonationParams {
  userId: string;
  reason: string;
}

export async function startUserImpersonation(
  params: StartUserImpersonationParams,
): Promise<AuthSessionResponse> {
  const { data } = await api.post<AuthSessionResponse>(
    `/user/${params.userId}/impersonate`,
    { reason: params.reason },
  );

  return data;
}
