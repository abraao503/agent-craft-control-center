import { api } from "@/services/api";
import {
  ListOperationalFollowUpOccurrencesParams,
  OperationalFollowUpOccurrencesPage,
} from "@/types/operation-attendance";

export async function listOperationalFollowUpOccurrences(
  params: ListOperationalFollowUpOccurrencesParams,
): Promise<OperationalFollowUpOccurrencesPage> {
  const { workspaceId, attendanceId, followUpId, ...queryParams } = params;
  const { data } = await api.get<OperationalFollowUpOccurrencesPage>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/follow-ups/${followUpId}/occurrences`,
    { params: queryParams },
  );

  return data;
}
