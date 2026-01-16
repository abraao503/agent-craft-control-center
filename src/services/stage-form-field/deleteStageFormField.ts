import { api } from "../api";

export const deleteStageFormField = async (id: string): Promise<void> => {
  await api.delete(`/stage-form-field/${id}`);
};
