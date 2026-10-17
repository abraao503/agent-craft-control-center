import { Pagination } from "./pagination";

export type WhatsappMessageReactionSummary = {
  emoji: string;
  count: number;
};

export type QuotedMessageSummary = {
  id: string;
  author: {
    type: "CUSTOMER" | "HUMAN" | "ASSISTANT";
    name: string | null;
  };
  type: string;
  preview: string;
};

export type MessageReplyContext =
  | { status: "available"; message: QuotedMessageSummary }
  | { status: "unavailable" }
  | null;

export type MessageReactionEvent = {
  chatId: string;
  messageId: string;
  reactions: WhatsappMessageReactionSummary[];
};

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
  dispatchStatus?: string | null;
  templateId?: string | null;
  templateName?: string | null;
  templateLanguage?: string | null;
  templateParameters?: unknown;
  templateSnapshot?: unknown;
  outboundOrigin?: string | null;
  outboundFlowId?: string | null;
  contextDealId?: string | null;
  providerCreatedAt?: string | null;
  providerUpdatedAt?: string | null;
  companyWhatsappIntegrationId?: string | null;
  reactions?: WhatsappMessageReactionSummary[];
  replyContext?: MessageReplyContext;
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
  companyWhatsappIntegrationId?: string;
  replyContextMessageId?: string;
};
