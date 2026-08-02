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
  lastMessage?: string | null;
  unreadCount?: number;
  customer: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    identifier?: string;
  };
  agent: {
    id: string;
    name: string;
  } | null;
  totalMessages: number;
  handledBy: "ai" | "human";
  tags?: Tag[];
  primaryDeal: {
    id: string;
    pipeline: { id: string; name: string };
    stage: { id: string; name: string; color: string };
    assignedUser: { id: string; name: string } | null;
  };
};

export type ConversationsResponse = Pagination<Conversation>;

export type ConversationsFilters = {
  search?: string;
  agentId?: string;
  tagId?: string;
  tagIds?: string[];
  page: number;
  limit: number;
  sortBy: "lastMessageAt";
  sortOrder: "asc" | "desc";
  initialDate?: Date;
  finalDate?: Date;
  handledBy?: "assistant" | "human";
  assignmentScope: "all" | "mine" | "unassigned" | "user";
  assignedUserId?: string;
  pipelineId?: string;
  stageId?: string;
  onlyUnread?: boolean;
};
