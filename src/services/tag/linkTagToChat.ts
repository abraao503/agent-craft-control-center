import { api } from "@/services/api";
import { TagLinkRequest } from "@/types/tag";

export const linkTagToChat = async (params: TagLinkRequest): Promise<void> => {
  await api.post("/tag/link-to-chat", params);
};
