
import { api } from "@/services/api";
import { Conversation } from "@/types/conversation";
import { CONVERSATIONS } from "@/services/mockData";

export const updateConversationHandler = async (
  conversationId: string, 
  handledBy: "ai" | "human"
): Promise<Conversation> => {
  try {
    // In a real app, we would use the API client:
    // const response = await api.patch(`/conversations/${conversationId}`, { handledBy });
    // return response.data;

    // For now, update the mock data
    const conversation = CONVERSATIONS.find((conv) => conv.id === conversationId);
    
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    
    conversation.handledBy = handledBy;
    
    return { ...conversation };
  } catch (error) {
    console.error("Error updating conversation handler:", error);
    throw error;
  }
};
