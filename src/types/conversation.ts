import { Pagination } from "./pagination";
import { Tag } from "./tag";

export type ConversationParticipant = "agent" | "customer" | "human-attendant";

export type ConversationMessage = {
  id: string;
  content: string;
  timestamp: string;
  sender: ConversationParticipant;
};

export type Conversation = {
  id: string;
  lastInteraction: Date | null;
  customer: {
    id: string;
    phone: string;
    identifier?: string;
  };
  agent: {
    id: string;
    name: string;
  };
  totalMessages: number;
  handledBy: "ai" | "human";
  tags?: Tag[];
};

export type ConversationsResponse = Pagination<Conversation>;

export type ConversationsFilters = {
  search?: string;
  agentId?: string;
  tagId?: string;
  tagIds?: string[];
  page: number;
  limit: number;
  sortBy: "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
  initialDate?: Date;
  finalDate?: Date;
  handledBy?: "assistant" | "human";
};
