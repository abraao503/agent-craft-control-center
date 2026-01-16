import { api } from "../api";

export interface GetUnreadCountParams {
  workspaceId: string;
}

export interface UnreadCountResponse {
  count: number;
}

export async function getUnreadActivitiesCount(
  params: GetUnreadCountParams
): Promise<UnreadCountResponse> {
  const { data } = await api.get("/activities/unread-count", {
    params: {
      workspaceId: params.workspaceId,
    },
  });

  return data;
}
