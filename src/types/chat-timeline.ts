import { Message } from "./message";
import { Pagination } from "./pagination";

type Related = { id: string; name: string };

export type ChatTimelineEvent = {
  id: string;
  type: "message" | "deal_created" | "stage_changed" | "assignment_changed";
  createdAt: string;
  deal: { id: string; title: string } | null;
  pipeline: Related | null;
  payload: {
    sender?: Message["sender"];
    content?: string;
    messageType?: Message["type"];
    mediaUrl?: string | null;
    mediaMimetype?: string | null;
    deliveryStatus?: string | null;
    externalMessageId?: string | null;
    deliveryUpdatedAt?: string | null;
    deliveryErrorCode?: string | null;
    deliveryErrorMessage?: string | null;
    providerCreatedAt?: string | null;
    providerUpdatedAt?: string | null;
    sentByUser?: Related | null;
    stage?: Related & { color?: string };
    fromStage?: (Related & { color?: string }) | null;
    toStage?: Related & { color?: string };
    previousAssignedUser?: Related | null;
    assignedUser?: Related | null;
    actor?: Related | null;
    origin?: "ROUND_ROBIN" | "MANUAL";
  };
};

export type ChatTimelineResponse = Pagination<ChatTimelineEvent>;
