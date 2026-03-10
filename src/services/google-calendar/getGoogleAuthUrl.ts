import { api } from "../api";

export interface GetGoogleAuthUrlParams {
  workspaceId: string;
}

export interface GetGoogleAuthUrlResponse {
  authUrl: string;
}

export async function getGoogleAuthUrl({ workspaceId }: GetGoogleAuthUrlParams): Promise<GetGoogleAuthUrlResponse> {
  const { data } = await api.get<GetGoogleAuthUrlResponse>(
    `/google-calendar/auth-url?workspaceId=${workspaceId}`
  );
  return data;
}
