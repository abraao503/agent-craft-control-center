import { Pagination } from "./pagination";

export type Message = {
  id: string;
  sender: "customer" | "assistant" | "human_assistant";
  content: string;
  type: "text" | "image" | "audio" | "document";
  mediaUrl: string | null;
  mediaMimetype: string | null;
  createdAt: string;
  chatId: string;
  sentByUser?: { id: string; name: string } | null;
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
