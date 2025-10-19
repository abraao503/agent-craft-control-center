import { api } from "../api";

export const markChatAsRead = async (chatId: string): Promise<void> => {
  await api.patch(`/chat/${chatId}/read`);
};
