import { api } from "../api";
import { UpdateStageFormFieldInput } from "@/types/stage-form-field";

export const updateStageFormField = async (
  id: string,
  input: UpdateStageFormFieldInput
): Promise<{ id: string }> => {
  const response = await api.patch(`/stage-form-field/${id}`, input);
  return response.data;
};
