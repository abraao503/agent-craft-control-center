import { useQuery } from "@tanstack/react-query";

import { listMessageDeliveryChecks } from "@/services/operation/listMessageDeliveryChecks";
import type { MessageDeliveryCheckSummary } from "@/types/operation-attendance";

const DELIVERY_CHECKS_MAX_MESSAGES = 100;

type UseMessageDeliveryChecksParams = {
  workspaceId?: string;
  attendanceId?: string;
  messageIds: string[];
  enabled?: boolean;
};

export function useMessageDeliveryChecks({
  workspaceId,
  attendanceId,
  messageIds,
  enabled = true,
}: UseMessageDeliveryChecksParams) {
  const checksQuery = useQuery({
    queryKey: [
      "operation",
      "attendance-delivery-checks",
      workspaceId,
      attendanceId,
      messageIds,
    ],
    queryFn: () =>
      listMessageDeliveryChecks({
        workspaceId: workspaceId as string,
        attendanceId: attendanceId as string,
        messageIds: messageIds.slice(0, DELIVERY_CHECKS_MAX_MESSAGES),
      }),
    enabled:
      enabled && Boolean(workspaceId && attendanceId && messageIds.length > 0),
  });

  const checksByMessageId = new Map<string, MessageDeliveryCheckSummary>();

  for (const summary of checksQuery.data?.items ?? []) {
    checksByMessageId.set(summary.messageId, summary);
  }

  return { checksQuery, checksByMessageId };
}
