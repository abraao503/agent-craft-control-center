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
