import { api } from "@/services/api";
import { ListMessagesParams, ListMessagesResponse } from "@/types/message";

export const listMessages = async (
  filters: ListMessagesParams
): Promise<ListMessagesResponse> => {
  const { data } = await api.get<ListMessagesResponse>("/chat/message/list", {
    params: {
      ...filters,
    },
  });

  return {
    items: data.items.reverse(),
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
};
