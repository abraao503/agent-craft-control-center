import { api } from "../api";
import { CreatePipelineInput, CreatePipelineResponse } from "@/types/pipeline";

export const createPipeline = async (
  payload: CreatePipelineInput
): Promise<CreatePipelineResponse> => {
  const { workspaceId, ...body } = payload;
  const { data } = await api.post<CreatePipelineResponse>("/pipeline", body, {
    params: { workspaceId },
  });
  return data;
};
