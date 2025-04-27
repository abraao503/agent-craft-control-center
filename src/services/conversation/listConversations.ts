
import { api } from "@/services/api";
import { ConversationsFilters, ConversationsResponse } from "@/types/conversation";
import { CONVERSATIONS } from "@/services/mockData";

// Function to list conversations with filtering
export const listConversations = async (
  filters: ConversationsFilters
): Promise<ConversationsResponse> => {
  try {
    // In a real app, we would use the API client:
    // const response = await api.get("/conversations", { params: filters });
    // return response.data;

    // For now, use mock data and filter it based on the filters
    const { search, agentId, startDate, endDate, page, pageSize } = filters;

    let filteredConversations = [...CONVERSATIONS];

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConversations = filteredConversations.filter(
        (conv) =>
          conv.customerName.toLowerCase().includes(searchLower) ||
          conv.agentName.toLowerCase().includes(searchLower) ||
          conv.messages.some((msg) => msg.content.toLowerCase().includes(searchLower))
      );
    }

    // Apply agent filter if provided
    if (agentId) {
      filteredConversations = filteredConversations.filter((conv) => conv.agentId === agentId);
    }

    // Apply date filters if provided
    if (startDate) {
      filteredConversations = filteredConversations.filter(
        (conv) => new Date(conv.lastInteractionAt) >= startDate
      );
    }

    if (endDate) {
      // Add one day to include the end date completely
      const endDatePlusOneDay = new Date(endDate);
      endDatePlusOneDay.setDate(endDatePlusOneDay.getDate() + 1);
      
      filteredConversations = filteredConversations.filter(
        (conv) => new Date(conv.lastInteractionAt) < endDatePlusOneDay
      );
    }

    // Calculate pagination
    const total = filteredConversations.length;
    const paginatedConversations = filteredConversations.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    return {
      conversations: paginatedConversations,
      total,
    };
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return {
      conversations: [],
      total: 0,
    };
  }
};
