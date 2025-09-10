import { api } from "../api";

// Item structure for updating existing stages within a pipeline
export interface UpdatePipelineStageItem {
  id: string;
  name?: string;
  description?: string | null;
  order: number;
  color?: string;
  winProbability?: number; // 0-100
  isWonStage?: boolean;
  isLostStage?: boolean;
}

export interface UpdatePipelineInput {
  workspaceId: string;
  name?: string;
  description?: string | null;
  stages?: UpdatePipelineStageItem[];
}

export const updatePipeline = async (
  pipelineId: string,
  payload: UpdatePipelineInput
): Promise<{ message: string }> => {
  const { workspaceId, ...body } = payload;
  const { data } = await api.patch<{ message: string }>(
    `/pipeline/${pipelineId}`,
    body,
    {
      params: { workspaceId },
    }
  );
  return data;
};
