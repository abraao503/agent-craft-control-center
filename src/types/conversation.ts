
import { AgentLanguage } from "./agent";

export type ConversationParticipant = "agent" | "customer" | "human-attendant";

export type ConversationMessage = {
  id: string;
  content: string;
  timestamp: string;
  sender: ConversationParticipant;
};

export type Conversation = {
  id: string;
  agentId: string;
  agentName: string;
  customerName: string;
  lastInteractionAt: string;
  messages: ConversationMessage[];
  handledBy: "ai" | "human";
};

export type ConversationsResponse = {
  conversations: Conversation[];
  total: number;
};

export type ConversationsFilters = {
  search?: string;
  agentId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  page: number;
  pageSize: number;
};
