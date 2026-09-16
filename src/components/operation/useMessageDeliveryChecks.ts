import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { listMessageDeliveryChecks } from "@/services/operation/listMessageDeliveryChecks";
import type {
  MessageDeliveryCheckSummary,
  MessageDeliveryChecksQueryState,
} from "@/types/operation-attendance";

const DELIVERY_CHECKS_MAX_MESSAGES = 100;

function normalizeMessageIds(messageIds: string[]): string[] {
  const uniqueMessageIds = Array.from(
    new Set(
      messageIds
        .map((messageId) => messageId.trim())
        .filter(Boolean),
    ),
  );

  return uniqueMessageIds.slice(0, DELIVERY_CHECKS_MAX_MESSAGES).sort();
}

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
  const stableMessageIds = normalizeMessageIds(messageIds);
  const queryEnabled =
    enabled && Boolean(workspaceId && attendanceId && stableMessageIds.length > 0);
  const checksQuery = useQuery({
    queryKey: [
      "operation",
      "attendance-delivery-checks",
      workspaceId,
      attendanceId,
      stableMessageIds,
    ],
    queryFn: () =>
      listMessageDeliveryChecks({
        workspaceId: workspaceId as string,
        attendanceId: attendanceId as string,
        messageIds: stableMessageIds,
      }),
    enabled: queryEnabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const checksByMessageId = useMemo(() => {
    const summaries = new Map<string, MessageDeliveryCheckSummary>();

    for (const summary of checksQuery.data?.items ?? []) {
      summaries.set(summary.messageId, summary);
    }

    return summaries;
  }, [checksQuery.data]);

  const state: MessageDeliveryChecksQueryState = !queryEnabled
    ? "disabled"
    : checksQuery.isError
      ? "error"
      : checksQuery.isPending
        ? "loading"
        : "ready";

  return { checksQuery, checksByMessageId, state };
}
