import { api } from "../api";
import { CreateDealNoteInput, CreateDealNoteResponse } from "@/types/deal";

export const createDealNote = async (
  input: CreateDealNoteInput
): Promise<CreateDealNoteResponse> => {
  const response = await api.post<CreateDealNoteResponse>("/deal/note", input);
  return response.data;
};
