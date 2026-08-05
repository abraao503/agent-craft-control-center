import { Pagination } from "./pagination";

export type Message = {
  id: string;
  sender: "customer" | "assistant" | "human_assistant";
  content: string;
  type: "text" | "image" | "audio" | "document" | "template";
  mediaUrl: string | null;
  mediaMimetype: string | null;
  createdAt: string;
  chatId: string;
  sentByUser?: { id: string; name: string } | null;
  deliveryStatus?: string | null;
  externalMessageId?: string | null;
  deliveryUpdatedAt?: string | null;
  deliveryErrorCode?: string | null;
  deliveryErrorMessage?: string | null;
  providerCreatedAt?: string | null;
  providerUpdatedAt?: string | null;
};

export type ListMessagesParams = {
  chatId: string;
  page?: number;
  limit: number;
};

export type ListMessagesResponse = Pagination<Message>;

export type SendMessageParams = {
  chatId: string;
  message: string;
  agentId: string;
};
