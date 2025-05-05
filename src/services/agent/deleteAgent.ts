import { api } from "../api";

export const deleteAgent = async (assistantId: string): Promise<void> => {
  await api.delete(`/assistant/${assistantId}`);
}; 