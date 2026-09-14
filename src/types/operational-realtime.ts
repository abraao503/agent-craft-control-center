export const OPERATIONAL_PUBLIC_EVENTS = {
  ATTENDANCE_CHANGED: "operation:attendance.changed:v1",
  MESSAGE_CREATED: "operation:message.created:v1",
  MESSAGE_STATUS: "operation:message.status:v1",
  READ_CHANGED: "operation:read.changed:v1",
} as const;

export type OperationalPublicEventName =
  (typeof OPERATIONAL_PUBLIC_EVENTS)[keyof typeof OPERATIONAL_PUBLIC_EVENTS];

export interface OperationalPublicEvent {
  eventId: string;
  schemaVersion: 1;
  workspaceId: string;
  attendanceId: string;
  chatId: string | null;
  aggregateVersion: number | null;
  messageId: string | null;
  kind: string;
  occurredAt: string;
}

export interface LegacyWhatsappMessageStatusEvent {
  messageId: string;
  chatId: string;
  externalMessageId?: string | null;
  deliveryStatus: string;
  deliveryUpdatedAt: string | Date;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export type OperationalRealtimeStatus =
  | "disabled"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "access-denied";
