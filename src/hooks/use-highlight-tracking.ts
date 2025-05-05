import { useAuth } from "@/contexts/auth/hooks";
import { HighlightService } from "@/lib/highlight";

interface TrackEventOptions {
  includeUserData?: boolean;
  metadata?: Record<string, string>;
}

interface EventMetadata {
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  [key: string]: string;
}

/**
 * Hook for tracking user interactions with Highlight
 */
export function useHighlightTracking() {
  const { user } = useAuth();

  /**
   * Track a user interaction event
   * @param eventName The name of the event
   * @param options Additional options for the event
   */
  const trackEvent = (eventName: string, options: TrackEventOptions = {}) => {
    const { includeUserData = true, metadata = {} } = options;

    // Build event metadata
    const eventMetadata: EventMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
    };

    // Add user data if requested and available
    if (includeUserData && user) {
      eventMetadata.userId = user.id;
      eventMetadata.userName = user.name;
      eventMetadata.userEmail = user.email;
    }

    // Track the event
    HighlightService.trackEvent(eventName, eventMetadata);
  };

  /**
   * Create a callback that tracks an event when invoked
   * @param eventName The name of the event
   * @param callback Optional callback function to run after tracking
   * @param options Additional options for the event
   */
  const createTrackingCallback = <T extends Array<string>, R>(
    eventName: string,
    callback?: (...args: T) => R,
    options: TrackEventOptions = {}
  ) => {
    return (...args: T): R | undefined => {
      // Track the event
      trackEvent(eventName, {
        ...options,
        metadata: {
          ...(options.metadata || {}),
          // Include args if they're primitives that can be serialized
          ...args.reduce((acc, arg, index) => {
            if (
              arg === null ||
              arg === undefined ||
              typeof arg === "string" ||
              typeof arg === "number" ||
              typeof arg === "boolean"
            ) {
              acc[`arg${index}`] = arg;
            }
            return acc;
          }, {} as Record<string, string>),
        },
      });

      // Call the callback if one was provided
      if (callback) {
        return callback(...args);
      }
      return undefined;
    };
  };

  return {
    trackEvent,
    createTrackingCallback,
  };
}
