import { H } from "highlight.run";

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
      H.track(eventName, metadata);
    }
  },

  /**
   * Identify a user in Highlight
   * @param userId The user ID to identify
   * @param metadata Optional metadata about the user
   */
  identifyUser: (userId: string, metadata?: Record<string, string>) => {
    if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
      H.identify(userId, metadata);
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
      H.consumeError(error, message, metadata);
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
      const errorFields = Object.keys(errors);
      
      // Extract error messages
      const errorMessages = errorFields.map(field => {
        return `${field}: ${errors[field]?.message || "Invalid"}`;
      }).join("; ");
      
      // Create custom error for reporting
      const error = new Error(`Form validation error in ${formName}`);
      
      // Track both as error and event for different visualization options
      H.consumeError(error, `Form validation error: ${formName}`, {
        formId,
        formName,
        errorCount: String(errorFields.length),
        errorFields: errorFields.join(", "),
        errorMessages,
        ...formContext
      });
      
      // Also track as event for custom metrics
      H.track(`form_validation_error`, {
        formId,
        formName,
        errorCount: errorFields.length,
        errorFields: errorFields.join(", "),
        ...formContext
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
