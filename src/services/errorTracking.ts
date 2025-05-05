import { HighlightService } from "@/lib/highlight";
import { AxiosError } from "axios";

/**
 * Tracks API errors in Highlight
 * @param error The error object from axios
 * @param context Additional context about where the error occurred
 */
export function trackApiError(
  error: AxiosError,
  context: string = "api_request"
) {
  // Create a custom error with better context
  const customError = new Error(`API Error: ${error.message} (${context})`);

  // Include relevant request information
  const metadata: Record<string, string> = {
    context,
    method: error.config?.method?.toUpperCase() || "UNKNOWN",
    url: error.config?.url || "UNKNOWN",
    status: String(error.response?.status || "NETWORK_ERROR"),
  };

  // Include response data if available
  if (error.response?.data) {
    try {
      metadata.responseData = JSON.stringify(error.response.data).substring(
        0,
        1000
      );
    } catch (e) {
      metadata.responseData = "Error stringifying response data";
    }
  }

  // Track the error in Highlight
  HighlightService.reportError(
    customError,
    `API Error in ${context}`,
    metadata
  );

  return customError; // Return the error for further handling
}
