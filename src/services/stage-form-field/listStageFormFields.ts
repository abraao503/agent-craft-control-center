import { api } from "../api";
import { StageFormField } from "@/types/stage-form-field";

export const listStageFormFields = async (
  stageId: string
): Promise<StageFormField[]> => {
  const response = await api.get("/stage-form-field", {
    params: { stageId },
  });
  return response.data;
};
