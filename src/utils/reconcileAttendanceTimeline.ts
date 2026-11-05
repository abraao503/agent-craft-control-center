export interface LocalTimelineSlot {
  afterKey: string | null;
  createdAt: string;
  serverMessageId?: string;
}

export function getAttendanceTimelineKey(
  item: { kind: string; id: string; clientMessageId?: string | null },
  slots: ReadonlyMap<string, LocalTimelineSlot>,
): string {
  if (item.kind === "message") {
    const localKey = `local:${item.clientMessageId}`;
    if (item.clientMessageId && slots.has(localKey)) return localKey;
    for (const [key, slot] of slots) {
      if (slot.serverMessageId === item.id) return key;
    }
  }
  return `${item.kind}:${item.id}`;
}

/** Replace local entries in their original slots, even when HTTP and realtime race. */
export function reconcileAttendanceTimeline<T extends { key: string; createdAt: string }>(
  serverEntries: T[],
  localEntries: T[],
  slots: ReadonlyMap<string, LocalTimelineSlot>,
): T[] {
  const entries = new Map(localEntries.map((entry) => [entry.key, entry]));
  serverEntries.forEach((entry) => entries.set(entry.key, entry));
  const result = serverEntries.filter((entry) => !slots.has(entry.key));

  for (const [key, slot] of slots) {
    const entry = entries.get(key);
    if (!entry) continue;
    const anchorIndex = slot.afterKey === null
      ? -1
      : result.findIndex((item) => item.key === slot.afterKey);
    let insertionIndex = anchorIndex + 1;
    if (slot.afterKey !== null && anchorIndex < 0) {
      // The anchor can be outside the currently loaded history page.
      insertionIndex = result.findIndex((item) => item.createdAt > slot.createdAt);
      if (insertionIndex < 0) insertionIndex = result.length;
    }
    result.splice(insertionIndex, 0, entry);
  }

  return result;
}
