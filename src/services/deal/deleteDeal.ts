import { api } from "../api";

export interface DeleteDealInput {
  dealId: string;
  workspaceId: string;
}

export const deleteDeal = async ({
  dealId,
  workspaceId,
}: DeleteDealInput): Promise<void> => {
  await api.delete(`/deal/${dealId}`, {
    data: { workspaceId },
  });
};
