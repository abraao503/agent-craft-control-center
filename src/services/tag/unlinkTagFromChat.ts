import { api } from "@/lib/api";
import { TagLinkRequest } from "@/types/tag";

export const unlinkTagFromChat = async (params: TagLinkRequest): Promise<void> => {
  await api.post("/tag/unlink-from-chat", params);
};
