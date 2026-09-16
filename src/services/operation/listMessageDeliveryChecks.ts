import { api } from "@/services/api";
import type { MessageDeliveryChecksPage } from "@/types/operation-attendance";

export interface ListMessageDeliveryChecksParams {
  workspaceId: string;
  attendanceId: string;
  messageIds: string[];
}

export async function listMessageDeliveryChecks(
  params: ListMessageDeliveryChecksParams,
): Promise<MessageDeliveryChecksPage> {
  const { workspaceId, attendanceId, messageIds } = params;
  const { data } = await api.get<MessageDeliveryChecksPage>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/messages/delivery-checks`,
    { params: { messageIds: messageIds.join(",") } },
  );
  return data;
}
