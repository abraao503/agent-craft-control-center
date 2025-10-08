import { api } from "../api";
import { StageFormFieldHistory } from "@/types/stage-form-field";

export const getStageFormFieldHistory = async (
  dealId: string,
  stageId: string
): Promise<StageFormFieldHistory[]> => {
  const response = await api.get("/stage-form-field/history", {
    params: { dealId, stageId },
  });
  return response.data;
};
