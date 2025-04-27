import { api } from "../api";

export const deleteContent = async (contentId: string) => {
  const response = await api.delete(`/content/${contentId}`);
  return response.data;
};
