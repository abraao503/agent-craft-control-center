import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  findMessageElement,
  INITIAL_QUOTED_NAVIGATION_STATE,
  QuotedNavigationState,
  scrollToMessage,
} from "@/utils/quoted-message-navigation";

type UseQuotedMessageNavigationOptions = {
  scopeKey: string;
  containerRef: RefObject<HTMLElement>;
  requestRemoteMessage: (messageId: string) => void;
  remoteMessageState: {
    targetMessageId: string | null;
    status: "idle" | "loading" | "success" | "error";
    found: boolean;
  };
};

export function useQuotedMessageNavigation({
  scopeKey,
  containerRef,
  requestRemoteMessage,
  remoteMessageState,
}: UseQuotedMessageNavigationOptions) {
  const [state, setState] = useState<QuotedNavigationState>(
    INITIAL_QUOTED_NAVIGATION_STATE,
  );
  const activeRequest = useRef<{
    scopeKey: string;
    targetMessageId: string;
  } | null>(null);
  const highlightTimer = useRef<number | null>(null);

  const highlight = useCallback((messageId: string) => {
    if (highlightTimer.current !== null) {
      window.clearTimeout(highlightTimer.current);
    }
    highlightTimer.current = window.setTimeout(() => {
      setState((current) =>
        current.targetMessageId === messageId
          ? { ...current, status: "idle", targetMessageId: null }
          : current,
      );
      highlightTimer.current = null;
    }, 2_500);
  }, []);

  const navigateToMessage = useCallback(
    (targetMessageId: string, sourceMessageId: string) => {
      activeRequest.current = { scopeKey, targetMessageId };
      const loaded = scrollToMessage(containerRef.current, targetMessageId);
      setState({
        sourceMessageId,
        targetMessageId,
        status: loaded ? "success" : "loading",
        errorMessage: null,
      });

      if (loaded) {
        highlight(targetMessageId);
        return;
      }

      requestRemoteMessage(targetMessageId);
    },
    [containerRef, highlight, requestRemoteMessage, scopeKey],
  );

  useLayoutEffect(() => {
    activeRequest.current = null;
    setState(INITIAL_QUOTED_NAVIGATION_STATE);
  }, [scopeKey]);

  useLayoutEffect(() => {
    const targetMessageId = state.targetMessageId;
    if (!targetMessageId || state.status !== "loading") return;
    const request = activeRequest.current;
    if (
      !request ||
      request.scopeKey !== scopeKey ||
      request.targetMessageId !== targetMessageId
    ) {
      return;
    }
    if (remoteMessageState.targetMessageId !== targetMessageId) return;

    if (remoteMessageState.status === "loading") return;
    if (remoteMessageState.status === "error" || !remoteMessageState.found) {
      setState((current) =>
        current.targetMessageId === targetMessageId
          ? {
              ...current,
              status: "error",
              errorMessage:
                "Não foi possível localizar a mensagem original.",
            }
          : current,
      );
      return;
    }

    if (scrollToMessage(containerRef.current, targetMessageId)) {
      setState((current) =>
        current.targetMessageId === targetMessageId
          ? { ...current, status: "success", errorMessage: null }
          : current,
      );
      highlight(targetMessageId);
    }
  }, [
    containerRef,
    highlight,
    remoteMessageState,
    scopeKey,
    state.status,
    state.targetMessageId,
  ]);

  useEffect(
    () => () => {
      if (highlightTimer.current !== null) {
        window.clearTimeout(highlightTimer.current);
      }
      activeRequest.current = null;
    },
    [],
  );

  const reset = useCallback(() => {
    activeRequest.current = null;
    setState(INITIAL_QUOTED_NAVIGATION_STATE);
  }, []);

  const getPreviewState = useCallback(
    (sourceMessageId: string) =>
      state.sourceMessageId === sourceMessageId
        ? state
        : INITIAL_QUOTED_NAVIGATION_STATE,
    [state],
  );

  const isNavigating = state.status === "loading";
  const highlightedMessageId =
    state.status === "success" ? state.targetMessageId : null;

  return {
    navigateToMessage,
    reset,
    getPreviewState,
    isNavigating,
    highlightedMessageId,
    findLoadedMessage: (messageId: string) =>
      Boolean(findMessageElement(containerRef.current, messageId)),
  };
}
