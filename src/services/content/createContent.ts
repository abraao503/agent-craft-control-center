import { Content, CreateContentRequest } from "@/types/content";
import { api } from "../api";

export const createContent = async (
  contentRequest: CreateContentRequest
): Promise<Content> => {
  try {
    // Create content
    await api.post("/content", contentRequest);
    
    // Fetch updated content list
    const { data } = await api.get("/content/list");
    
    // Find the new content
    const newContent = data.contents.find((c) => c.name === contentRequest.name);
    
    if (!newContent) {
      throw new Error("Content not found after creation");
    }
    
    return newContent;
  } catch (error) {
    console.error("Error creating content:", error);
    throw error;
  }
}; 