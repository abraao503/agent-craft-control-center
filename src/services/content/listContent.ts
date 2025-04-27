import { ListContentResponse } from "@/types/content";
import { api } from "../api";

export const listContent = async (): Promise<ListContentResponse> => {
  const response = await api.get<ListContentResponse>("/content/list");
  return response.data;
};
