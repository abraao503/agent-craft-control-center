import { Pagination } from "./pagination";

export type Message = {
  id: string;
  sender: "customer" | "assistant" | "human_assistant";
  content: string;
  createdAt: string;
  chatId: string;
};

export type ListMessagesParams = {
  chatId: string;
  page?: number;
};

export type ListMessagesResponse = Pagination<Message>;

export type SendMessageParams = {
  chatId: string;
  message: string;
  agentId: string;
};

export type MessageEvent = {
  messageId: string;
  chatId: string;
  sender: "customer" | "assistant" | "human_assistant";
  content: string;
  createdAt: string;
};
