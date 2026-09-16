import { H } from "highlight.run";
import {
  sanitizeHighlightMetadata,
  sanitizeHighlightStringMetadata,
  sanitizeObservabilityText,
} from "@/services/observability/sanitizeObservability";

/**
 * HighlightService provides helper functions for working with Highlight.run
 */
export const HighlightService = {
  /**
   * Track a user event in Highlight
   * @param eventName The name of the event to track
   * @param metadata Optional metadata to include with the event
   */
  trackEvent: (
    eventName: string,
    metadata?: Record<string, string | number | boolean>
  ) => {
    if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
      H.track(eventName, sanitizeHighlightMetadata(metadata || {}));
    }
  },

  /**
   * Identify a user in Highlight
   * @param userId The user ID to identify
   * @param metadata Optional metadata about the user
   */
  identifyUser: (userId: string, metadata?: Record<string, string>) => {
    if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
      H.identify(
        userId,
        sanitizeHighlightStringMetadata(metadata || {}),
      );
    }
  },

  /**
   * Report an error to Highlight
   * @param error The error to report
   * @param message Optional message to include with the error
   * @param metadata Optional metadata to include with the error
   */
  reportError: (
    error: Error,
    message?: string,
    metadata?: Record<string, string>
  ) => {
    if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
      const safeError = new Error(
        sanitizeObservabilityText(error.message) || "Unexpected error",
      );
      safeError.name = sanitizeObservabilityText(error.name) || "Error";
      H.consumeError(
        safeError,
        sanitizeObservabilityText(message) || undefined,
        sanitizeHighlightStringMetadata(metadata || {}),
      );
    }
  },

  /**
   * Report a form validation error to Highlight with detailed context
   * @param formId The ID of the form with validation errors
   * @param formName A descriptive name for the form
   * @param errors Object containing the validation errors
   * @param formContext Additional context about the form and its usage
   */
  reportFormError: (
    formId: string,
    formName: string,
    errors: Record<string, { message?: string }>,
    formContext?: Record<string, string>
  ) => {
    if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
      const safeFormId = sanitizeObservabilityText(formId);
      const safeFormName = sanitizeObservabilityText(formName);
      const safeErrors = Object.fromEntries(
        Object.entries(errors).map(([field, fieldError]) => [
          sanitizeObservabilityText(field) || "field",
          {
            message:
              sanitizeObservabilityText(fieldError?.message) || "Invalid",
          },
        ]),
      );
      const safeContext = sanitizeHighlightStringMetadata(formContext || {});
      const errorFields = Object.keys(safeErrors);
      
      const errorMessages = errorFields
        .map((field) => `${field}: ${safeErrors[field]?.message || "Invalid"}`)
        .join("; ");
      
      const error = new Error(`Form validation error in ${safeFormName}`);
      
      H.consumeError(error, `Form validation error: ${safeFormName}`, {
        formId: safeFormId,
        formName: safeFormName,
        errorCount: String(errorFields.length),
        errorFields: errorFields.join(", "),
        errorMessages,
        ...safeContext,
      });
      
      H.track(`form_validation_error`, {
        formId: safeFormId,
        formName: safeFormName,
        errorCount: errorFields.length,
        errorFields: errorFields.join(", "),
        ...safeContext,
      });
    }
  },

  /**
   * Get the Highlight session URL
   * @returns Promise with session URL and timestamp URL
   */
  getSessionDetails: async () => {
    if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
      return H.getSessionDetails();
    }
    return { url: "", urlWithTimestamp: "" };
  },
};
