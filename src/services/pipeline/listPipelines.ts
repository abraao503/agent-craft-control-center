import { api } from "../api";
import { PipelineListItem } from "@/types/pipeline";

export const listPipelines = async (
  workspaceId: string
): Promise<PipelineListItem[]> => {
  const { data } = await api.get<PipelineListItem[]>(`/pipeline`, {
    params: { workspaceId },
  });

  // Normalize dates
  return data.map((p) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));
};
