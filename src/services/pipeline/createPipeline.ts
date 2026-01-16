import { api } from "../api";
import { CreatePipelineInput, CreatePipelineResponse } from "@/types/pipeline";

export const createPipeline = async (
  payload: CreatePipelineInput
): Promise<CreatePipelineResponse> => {
  const { data } = await api.post<CreatePipelineResponse>("/pipeline", payload);
  return data;
};
