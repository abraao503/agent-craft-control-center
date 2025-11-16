import { api } from "../api";

export interface MarkActivitiesAsReadParams {
  workspaceId: string;
}

export async function markActivitiesAsRead(
  params: MarkActivitiesAsReadParams
): Promise<void> {
  await api.patch("/activities/mark-as-read", {
    workspaceId: params.workspaceId,
  });
}
