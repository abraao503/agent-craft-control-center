import { Pagination } from "./pagination";

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
  };
  agent: {
    id: string;
    name: string;
  };
  totalMessages: number;
};

export type ConversationsResponse = Pagination<Conversation>;

export type ConversationsFilters = {
  search?: string;
  agentId?: string;
  page: number;
  limit: number;
  sortBy: "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
  initialDate?: Date;
  finalDate?: Date;
};
