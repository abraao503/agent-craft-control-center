import { api } from "@/services/api";

export interface UpdateMultipleConversationsParams {
  chatIds: string[];
  tagIds?: string[];
  removeTagIds?: string[];
  handledBy?: "assistant" | "human";
  workspaceId?: string;
}

/**
 * Updates multiple conversations at once
 * @param params Object containing chatIds, optional tagIds, and optional handledBy
 * @returns Promise that resolves when the update is complete
 */
export const updateMultipleConversations = async (
  params: UpdateMultipleConversationsParams
): Promise<void> => {
  const { chatIds, tagIds, removeTagIds, handledBy, workspaceId } = params;

  await api.post(`chat/update-multiple`, {
    chatIds,
    tagIds,
    removeTagIds,
    handledBy,
    workspaceId,
  });
};
