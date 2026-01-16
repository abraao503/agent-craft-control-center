import { api } from "../api";

export const deleteDealNote = async (noteId: string): Promise<void> => {
  await api.delete(`/deal/note/${noteId}`);
};
