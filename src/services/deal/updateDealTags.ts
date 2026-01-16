import { api } from "@/services/api";

export interface UpdateDealTagsInput {
  tagIds: string[];
}

export const updateDealTags = async (
  dealId: string,
  workspaceId: string,
  data: UpdateDealTagsInput
): Promise<void> => {
  await api.patch(`/deal/${dealId}/tags`, data, {
    params: { workspaceId },
  });
};
