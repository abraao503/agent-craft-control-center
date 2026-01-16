import { api } from "../api";
import { UpdateDealInput } from "@/types/deal";

export const updateDeal = async (
  dealId: string,
  workspaceId: string,
  input: UpdateDealInput
): Promise<void> => {
  await api.patch(`/deal/${dealId}`, input, {
    params: { workspaceId },
  });
};
