export type QuotedNavigationStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";

export type QuotedNavigationState = {
  sourceMessageId: string | null;
  targetMessageId: string | null;
  status: QuotedNavigationStatus;
  errorMessage: string | null;
};

export const INITIAL_QUOTED_NAVIGATION_STATE: QuotedNavigationState = {
  sourceMessageId: null,
  targetMessageId: null,
  status: "idle",
  errorMessage: null,
};

export function findMessageElement(
  container: HTMLElement | null,
  messageId: string,
): HTMLElement | null {
  if (!container || !messageId) return null;

  return (
    Array.from(container.querySelectorAll<HTMLElement>("[data-message-id]"))
      .find((element) => element.dataset.messageId === messageId) ?? null
  );
}

export function scrollToMessage(
  container: HTMLElement | null,
  messageId: string,
): boolean {
  const element = findMessageElement(container, messageId);
  if (!container || !element) return false;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const delta =
    elementRect.top -
    containerRect.top -
    container.clientHeight / 2 +
    elementRect.height / 2;

  container.scrollTop += delta;
  element.focus({ preventScroll: true });
  return true;
}
