export interface RunSyntheticOperationalChannelEventBody {
  channelId: string;
  externalEventId: string;
  externalMessageId: string;
  occurredAt: string;
  contact: {
    phone: string;
    name?: string;
  };
  message: {
    type: "text";
    content: string;
  };
}

export interface RunSyntheticOperationalChannelEventResponse {
  eventId: string;
  customerId: string;
  chatId: string;
  messageId: string;
  channelId: string;
  dispatchTarget: "OPERATION";
  status: "READY_FOR_ATTENDANCE" | "ATTENDANCE_READY";
  attendanceId?: string;
  duplicate?: boolean;
}
