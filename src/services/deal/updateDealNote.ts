import { api } from "../api";
import { UpdateDealNoteInput } from "@/types/deal";

export const updateDealNote = async (
  noteId: string,
  input: UpdateDealNoteInput
): Promise<void> => {
  await api.patch(`/deal/note/${noteId}`, input);
};
