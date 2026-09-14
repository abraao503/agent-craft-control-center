import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket } from "@/lib/socket";
import { replaceAttendanceInKanban } from "@/utils/operationalKanbanCache";
import {
  OPERATIONAL_PUBLIC_EVENTS,
  OperationalPublicEvent,
  OperationalPublicEventName,
  OperationalRealtimeStatus,
} from "@/types/operational-realtime";
import type { AttendanceKanbanPage, AttendanceWithDetails } from "@/types/operation-attendance";

const EVENT_NAMES = Object.values(OPERATIONAL_PUBLIC_EVENTS) as OperationalPublicEventName[];
const MAX_REMEMBERED_EVENTS = 500;

function isAttendanceWithDetails(
  value: unknown,
): value is AttendanceWithDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as Record<string, unknown>).id === "string" &&
    "status" in value &&
    typeof (value as Record<string, unknown>).status === "string" &&
    "version" in value &&
    typeof (value as Record<string, unknown>).version === "number" &&
    Number.isInteger((value as Record<string, unknown>).version)
  );
}

interface UseOperationalRealtimeOptions {
  workspaceId?: string;
  attendanceId?: string;
  chatId?: string;
  currentAttendanceVersion?: number;
  enabled?: boolean;
}

interface UseOperationalRealtimeResult {
  status: OperationalRealtimeStatus;
  joinedWorkspace: boolean;
  lastEventAt: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOperationalPublicEvent(value: unknown): value is OperationalPublicEvent {
  if (!isRecord(value)) return false;

  return (
    value.schemaVersion === 1 &&
    typeof value.eventId === "string" &&
    value.eventId.length > 0 &&
    typeof value.workspaceId === "string" &&
    value.workspaceId.length > 0 &&
    typeof value.attendanceId === "string" &&
    value.attendanceId.length > 0 &&
    (value.chatId === null || typeof value.chatId === "string") &&
    (value.aggregateVersion === null ||
      (typeof value.aggregateVersion === "number" &&
        Number.isInteger(value.aggregateVersion) &&
        value.aggregateVersion >= 1)) &&
    (value.messageId === null || typeof value.messageId === "string") &&
    typeof value.kind === "string" &&
    typeof value.occurredAt === "string" &&
    !Number.isNaN(Date.parse(value.occurredAt))
  );
}

function remember(set: Set<string>, value: string) {
  set.add(value);
  if (set.size <= MAX_REMEMBERED_EVENTS) return;

  const oldest = set.values().next().value;
  if (typeof oldest === "string") set.delete(oldest);
}

export function useOperationalRealtime({
  workspaceId,
  attendanceId,
  chatId,
  currentAttendanceVersion,
  enabled = true,
}: UseOperationalRealtimeOptions): UseOperationalRealtimeResult {
  const queryClient = useQueryClient();
  const currentVersionRef = useRef<number | undefined>(currentAttendanceVersion);
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const processedMessageKeysRef = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState<OperationalRealtimeStatus>("disabled");
  const [joinedWorkspace, setJoinedWorkspace] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  useEffect(() => {
    currentVersionRef.current = currentAttendanceVersion;
  }, [currentAttendanceVersion]);

  useEffect(() => {
    if (!enabled || !workspaceId) {
      setStatus("disabled");
      setJoinedWorkspace(false);
      return;
    }

    const token = localStorage.getItem("token") ?? "";
    if (!token) {
      setStatus("disabled");
      setJoinedWorkspace(false);
      return;
    }

    const socket = connectSocket(token);
    let mounted = true;
    const targetAttendanceId = attendanceId;
    const targetChatId = chatId;

    const patchKanbanCache = (event: OperationalPublicEvent): boolean => {
      if (event.aggregateVersion === null) return false;

      const cached = queryClient.getQueryData<unknown>([
        "operation",
        "attendance",
        workspaceId,
        event.attendanceId,
      ]);
      if (!cached || !isAttendanceWithDetails(cached)) {
        return false;
      }

      if (cached.version < event.aggregateVersion) return false;

      const kanbanQueries = queryClient.getQueriesData<AttendanceKanbanPage>({
        queryKey: ["operation", "attendance-kanban", workspaceId],
      });

      let patched = false;
      for (const [queryKey, data] of kanbanQueries) {
        if (!data) continue;
        const item = data.columns
          .flatMap((column) => column.items)
          .find((candidate) => candidate.id === event.attendanceId);
        if (!item || item.version > cached.version) continue;

        queryClient.setQueryData(queryKey, (old: AttendanceKanbanPage | undefined) => {
          if (!old) return old;
          return replaceAttendanceInKanban(old, cached);
        });
        patched = true;
      }

      return patched;
    };

    const invalidateWorkspace = (
      eventAttendanceId?: string,
      eventChatId?: string | null,
    ) => {
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendances", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["operation", "conversations", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-kanban", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-summary", workspaceId],
      });

      const isCurrentConversation =
        Boolean(targetChatId && eventChatId && eventChatId === targetChatId) ||
        Boolean(eventAttendanceId && eventAttendanceId === targetAttendanceId);
      if (!isCurrentConversation || !targetAttendanceId) return;

      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance", workspaceId, targetAttendanceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-messages", workspaceId, targetAttendanceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-events", workspaceId, targetAttendanceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-timeline", workspaceId, targetAttendanceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-commands", workspaceId, targetAttendanceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["operation", "attendance-follow-ups", workspaceId, targetAttendanceId],
      });
      void queryClient.invalidateQueries({
        queryKey: [
          "operation",
          "attendance-follow-up-occurrences",
          workspaceId,
          targetAttendanceId,
        ],
      });
    };

    const clearWorkspaceCache = () => {
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === "operation" && query.queryKey[2] === workspaceId,
      });
    };

    const reconcile = () => invalidateWorkspace(targetAttendanceId, targetChatId);
    const handleConnect = () => {
      if (!mounted) return;
      setStatus("connected");
      setJoinedWorkspace(false);
      socket.emit("join:workspace", { workspaceId });
      reconcile();
    };
    const handleJoinedWorkspace = (payload: unknown) => {
      if (!mounted || !isRecord(payload) || payload.workspaceId !== workspaceId) {
        return;
      }
      setJoinedWorkspace(true);
    };
    const handleLeftWorkspace = (payload: unknown) => {
      if (!mounted || !isRecord(payload) || payload.workspaceId !== workspaceId) {
        return;
      }
      setJoinedWorkspace(false);
    };
    const handleDisconnect = (reason: string) => {
      if (!mounted) return;
      setJoinedWorkspace(false);
      setStatus(reason === "io client disconnect" ? "offline" : "reconnecting");
    };
    const handleConnectError = () => {
      if (mounted) setStatus("reconnecting");
    };
    const handleReconnectAttempt = () => {
      if (mounted) setStatus("reconnecting");
    };
    const handleReconnectFailed = () => {
      if (mounted) setStatus("offline");
    };
    const handleSocketError = (payload: unknown) => {
      if (!mounted) return;
      const message = isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : "";
      if (
        message === "Workspace access denied" ||
        message === "Operational membership required"
      ) {
        clearWorkspaceCache();
        setJoinedWorkspace(false);
        setStatus("access-denied");
      }
    };

    const handleOperationalEvent = (rawEvent: unknown) => {
      if (!mounted || !isOperationalPublicEvent(rawEvent)) return;
      if (rawEvent.workspaceId !== workspaceId) return;
      if (processedEventIdsRef.current.has(rawEvent.eventId)) return;

      const isMessageEvent =
        Boolean(rawEvent.messageId) &&
        (rawEvent.kind === "CREATED" || rawEvent.kind === "STATUS");
      const messageKey = isMessageEvent
        ? `${rawEvent.kind}:${rawEvent.messageId}`
        : null;
      if (messageKey && processedMessageKeysRef.current.has(messageKey)) {
        remember(processedEventIdsRef.current, rawEvent.eventId);
        return;
      }

      remember(processedEventIdsRef.current, rawEvent.eventId);
      if (messageKey) {
        remember(processedMessageKeysRef.current, messageKey);
      }

      const isCurrentAttendance = rawEvent.attendanceId === targetAttendanceId;
      const isKnownStaleEvent =
        isCurrentAttendance &&
        rawEvent.aggregateVersion !== null &&
        currentVersionRef.current !== undefined &&
        rawEvent.aggregateVersion <= currentVersionRef.current;
      if (isKnownStaleEvent) return;

      setLastEventAt(rawEvent.occurredAt);

      patchKanbanCache(rawEvent);
      invalidateWorkspace(rawEvent.attendanceId, rawEvent.chatId);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("joined:workspace", handleJoinedWorkspace);
    socket.on("left:workspace", handleLeftWorkspace);
    socket.on("error", handleSocketError);
    for (const eventName of EVENT_NAMES) {
      socket.on(eventName, handleOperationalEvent);
    }
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect_failed", handleReconnectFailed);

    if (socket.connected) {
      handleConnect();
    } else {
      setStatus("connecting");
    }

    const handleFocus = () => reconcile();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("joined:workspace", handleJoinedWorkspace);
      socket.off("left:workspace", handleLeftWorkspace);
      socket.off("error", handleSocketError);
      for (const eventName of EVENT_NAMES) {
        socket.off(eventName, handleOperationalEvent);
      }
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect_failed", handleReconnectFailed);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (socket.connected) {
        socket.emit("leave:workspace", { workspaceId });
      }
    };
  }, [attendanceId, chatId, enabled, queryClient, workspaceId]);

  return { status, joinedWorkspace, lastEventAt };
}
