import { api } from "../api";
import { CreateStageFormFieldInput } from "@/types/stage-form-field";

export const createStageFormField = async (
  input: CreateStageFormFieldInput
): Promise<{ id: string }> => {
  const response = await api.post("/stage-form-field", input);
  return response.data;
};
