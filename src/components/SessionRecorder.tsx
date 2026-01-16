import { useEffect } from "react";
import { HighlightService } from "@/lib/highlight";

interface SessionRecorderProps {
  userId?: string;
  userData?: {
    email: string;
    name: string;
    role: string;
    [key: string]: string;
  };
}

export function SessionRecorder({ userId, userData }: SessionRecorderProps) {
  useEffect(() => {
    // Only identify the user if we have a userId
    if (userId) {
      HighlightService.identifyUser(userId, {
        ...(userData || {}),
        // Use email/name as highlightDisplayName if available
        ...(userData?.name && { highlightDisplayName: userData.name }),
        sessionStartedAt: new Date().toISOString(),
      });

      // Track session start event
      HighlightService.trackEvent("session_started", {
        userId,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      });
    }

    // When the component unmounts, track session end
    return () => {
      if (userId) {
        HighlightService.trackEvent("session_ended", {
          userId,
          sessionDuration: `${Math.floor(
            (Date.now() - new Date().getTime()) / 1000
          )}s`,
        });
      }
    };
  }, [userId, userData]);

  // This component doesn't render anything visible
  return null;
}
