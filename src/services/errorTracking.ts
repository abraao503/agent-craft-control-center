import { HighlightService } from "@/lib/highlight";
import { AxiosError } from "axios";
import {
  getSafeObservabilityCode,
  sanitizeHighlightStringMetadata,
  sanitizeObservabilityText,
  sanitizeObservabilityUrl,
} from "@/services/observability/sanitizeObservability";

/**
 * Tracks API errors in Highlight
 * @param error The error object from axios
 * @param context Additional context about where the error occurred
 */
export function trackApiError(
  error: AxiosError,
  context: string = "api_request"
) {
  const safeContext = sanitizeObservabilityText(context);
  const safeMessage = sanitizeObservabilityText(error.message) || "Request failed";
  const customError = new Error(`API Error: ${safeMessage} (${safeContext})`);

  const responseCode = getSafeObservabilityCode(error.response?.data);
  const metadata = sanitizeHighlightStringMetadata({
    context: safeContext,
    method: error.config?.method?.toUpperCase() || "UNKNOWN",
    url: sanitizeObservabilityUrl(error.config?.url),
    status: String(error.response?.status || "NETWORK_ERROR"),
    responseCode,
  });

  HighlightService.reportError(
    customError,
    `API Error in ${safeContext}`,
    metadata
  );

  return customError;
}
