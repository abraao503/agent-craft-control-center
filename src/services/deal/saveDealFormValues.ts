import { api } from "../api";
import { SaveFormFieldValuesInput } from "@/types/stage-form-field";

export const saveDealFormValues = async (
  dealId: string,
  input: SaveFormFieldValuesInput
): Promise<void> => {
  await api.post(`/deal/${dealId}/form-values`, input);
};
