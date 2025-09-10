import { api } from "../api";
import { MoveDealStageInput } from "@/types/deal";

export const moveDealStage = async (
  dealId: string,
  payload: MoveDealStageInput
): Promise<{ message: string }> => {
  const { data } = await api.patch<{ message: string }>(
    `/deal/${dealId}/move-stage`,
    payload
  );
  return data;
};
