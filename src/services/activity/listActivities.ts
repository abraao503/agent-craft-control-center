import { api } from "../api";
import { Activity, Pagination } from "@/types/activity";

export interface ListActivitiesParams {
  workspaceId: string;
  page?: number;
  limit?: number;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function listActivities(
  params: ListActivitiesParams
): Promise<Pagination<Activity>> {
  const { data } = await api.get("/activities", {
    params: {
      workspaceId: params.workspaceId,
      page: params.page || 1,
      limit: params.limit || 20,
      userId: params.userId,
      startDate: params.startDate?.toISOString(),
      endDate: params.endDate?.toISOString(),
    },
  });

  // Convert date strings to Date objects
  const items = data.items.map((activity: Activity) => ({
    ...activity,
    createdAt: new Date(activity.createdAt),
    ...(activity.type === "due_date_expired" && {
      dueDate: new Date(activity.dueDate),
    }),
  }));

  return {
    ...data,
    items,
  };
}
