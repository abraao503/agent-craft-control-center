import { api } from "../api";
import { CreatePipelineStageInput } from "@/types/pipeline";

export interface UpdatePipelineStagesInput {
  workspaceId: string;
  stages: Array<
    {
      id: string;
      name?: string;
      description?: string | null;
      order: number;
      color?: string;
      winProbability?: number; // 0-100
      isWonStage?: boolean;
      isLostStage?: boolean;
    }
  >;
}

export interface UpdatePipelineStagesResponse {
  message: string;
}

export const updatePipelineStages = async (
  pipelineId: string,
  payload: UpdatePipelineStagesInput
): Promise<UpdatePipelineStagesResponse> => {
  const { data } = await api.patch<UpdatePipelineStagesResponse>(
    `/pipeline/${pipelineId}/stages`,
    payload
  );
  return data;
};
