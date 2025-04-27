import { ListIaModelsResponse } from "@/types/iaModel";
import { api } from "../api";

export const listIaModels = async (): Promise<ListIaModelsResponse> => {
  const response = await api.get<ListIaModelsResponse>("/ia-model/list");
  return response.data;
};
