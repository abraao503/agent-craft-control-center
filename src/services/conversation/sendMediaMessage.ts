import { api } from "@/services/api";
import { Message } from "@/types/message";

export type SendMediaMessageParams = {
  chatId: string;
  type: "text" | "image" | "audio" | "document";
  file?: File;
  message?: string;
  caption?: string;
};

export const sendMediaMessage = async (
  params: SendMediaMessageParams
): Promise<Message> => {
  const { chatId, type, file, message, caption } = params;

  const formData = new FormData();
  formData.append("type", type);

  if (type === "text" && message) {
    formData.append("message", message);
  } else if (file) {
    formData.append("file", file);
    if (caption) {
      formData.append("caption", caption);
    }
  }

  const { data } = await api.post<Message>(`/chat/${chatId}/message`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};
