import { api } from "../api";
import { PipelineStageMinimal } from "@/types/pipeline";

export const listPipelineStages = async (
  pipelineId: string,
  workspaceId: string
): Promise<PipelineStageMinimal[]> => {
  const { data } = await api.get<PipelineStageMinimal[]>(
    `/pipeline/${pipelineId}/stages`,
    {
      params: { workspaceId },
    }
  );
  return data;
};
