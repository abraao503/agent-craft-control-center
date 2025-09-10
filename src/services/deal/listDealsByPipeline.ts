import { api } from "../api";
import { DealListItem, RelatedMinimal } from "@/types/deal";

// Accepts possible backend variations for stage reference
type DealApiItem = {
  id: string;
  stageId?: string;
  currentStageId?: string;
  stage?: { id: string };
  // possible snake_case variants
  stage_id?: string;
  current_stage_id?: string;
  title: string;
  description?: string | null;
  value?: number | null;
  currency?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: RelatedMinimal | null;
  assignedUser?: RelatedMinimal | null;
};

export const listDealsByPipeline = async (
  pipelineId: string,
  workspaceId: string
): Promise<DealListItem[]> => {
  const { data } = await api.get<DealApiItem[]>(
    `/deal/pipeline/${pipelineId}`,
    { params: { workspaceId } }
  );

  // Normalize stageId in case API returns currentStageId or nested stage
  return data.map((d) => {
    const stageId = d.stageId ?? d.currentStageId ?? d.stage_id ?? d.current_stage_id ?? d.stage?.id ?? "";
    return {
      ...d,
      stageId,
      currency: d.currency || "BRL",
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
    } as DealListItem;
  });
};
