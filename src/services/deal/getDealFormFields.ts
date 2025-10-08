import { api } from "../api";
import { StageFormField } from "@/types/stage-form-field";

export const getDealFormFields = async (
  dealId: string
): Promise<StageFormField[]> => {
  const response = await api.get(`/deal/${dealId}/form-fields`);
  return response.data;
};
