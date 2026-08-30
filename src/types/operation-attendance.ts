export type AttendanceStatus =
  | "TRIAGE"
  | "WAITING_QUEUE"
  | "IN_PROGRESS"
  | "PENDING"
  | "CLOSED";

export type AttendanceCommandAction =
  | "INBOUND_CREATE"
  | "INBOUND_RESUME"
  | "ROUTE"
  | "CLAIM"
  | "ASSIGN"
  | "TRANSFER"
  | "UNASSIGN"
  | "PENDING"
  | "RESUME"
  | "CLOSE"
  | "FOLLOW_UP_CREATE"
  | "FOLLOW_UP_UPDATE"
  | "FOLLOW_UP_CANCEL";

export type AttendanceActorType =
  | "USER"
  | "ASSISTANT"
  | "SYSTEM"
  | "INTEGRATION";

export type OperationalOutboxStatus =
  | "PENDING"
  | "PROCESSING"
  | "PUBLISHED"
  | "FAILED";

export type OperationalFollowUpStatus =
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type OperationalFollowUpOccurrenceStatus =
  | "PENDING"
  | "PROCESSING"
  | "QUEUED"
  | "SENT"
  | "FAILED"
  | "CANCELLED"
  | "BLOCKED_CONFIGURATION";

export interface AttendanceCustomerSnapshot {
  id: string;
  name: string;
  phoneMasked?: string | null;
}

export interface AttendanceLastMessageSnapshot {
  id: string;
  sender: "CUSTOMER" | "HUMAN" | "ASSISTANT";
  type: string;
  preview: string;
  createdAt: string;
  deliveryStatus: string | null;
}

export interface AttendanceDestinationSnapshot {
  areaName: string | null;
  queueName: string | null;
}

export interface AttendanceAssigneeSnapshot {
  type: "USER" | "ASSISTANT";
  id: string;
  name: string;
}

export interface Attendance {
  id: string;
  companyId: string;
  workspaceId: string;
  chatId: string;
  companyWhatsappIntegrationId: string;
  cycleNumber: number;
  status: AttendanceStatus;
  targetAreaId: string | null;
  targetQueueId: string | null;
  assigneeUserId: string | null;
  assigneeAssistantId: string | null;
  pendingReason: string | null;
  pendingDueAt: string | null;
  closeSummary: string | null;
  version: number;
  lastInboundMessageId: string | null;
  lastActivityAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceWithDetails extends Attendance {
  customer?: AttendanceCustomerSnapshot;
  destination?: AttendanceDestinationSnapshot;
  assignee?: AttendanceAssigneeSnapshot | null;
  lastMessage?: AttendanceLastMessageSnapshot | null;
  unreadCount?: number;
}

export interface AttendanceCustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface AttendanceChannelDetail {
  id: string;
  displayName: string;
  provider: string;
}

export type AttendanceReplyCapabilityStatus =
  | "SERVICE_ALLOWED"
  | "TEMPLATE_REQUIRED"
  | "CHANNEL_UNAVAILABLE"
  | "NOT_ASSIGNEE"
  | "ATTENDANCE_NOT_ACTIVE";

export interface AttendanceReplyCapabilities {
  status: AttendanceReplyCapabilityStatus;
  supportsText: boolean;
  supportsMedia: boolean;
  supportsTemplate: boolean;
  latestInboundMessageId: string | null;
}

export type OperationalTemplateBinding =
  | { source: "fixed"; value: string }
  | {
      source: "customer";
      field: "name" | "firstName" | "phone" | "email";
    }
  | { source: "owner"; field: "name" };

export interface OperationalAttendanceTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string | null;
  components: unknown;
  compatible: boolean;
}

export type AttendanceDetail = Omit<AttendanceWithDetails, "customer"> & {
  customer?: AttendanceCustomerDetail;
  channel?: AttendanceChannelDetail | null;
  replyCapabilities: AttendanceReplyCapabilities;
};

export type AttendanceMessageSender = "CUSTOMER" | "HUMAN" | "ASSISTANT";

export interface AttendanceMessageItem {
  id: string;
  sender: AttendanceMessageSender;
  type: string;
  content: string;
  mediaMimetype?: string | null;
  templateName?: string | null;
  templateId?: string | null;
  sentByUser?: {
    id: string;
    name: string;
  } | null;
  dispatchStatus?: string | null;
  deliveryStatus?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  total: number;
  unreadAttendances: number;
  byStatus: Record<AttendanceStatus, number>;
}

export interface AttendanceOptionQueue {
  id: string;
  name: string;
  active: boolean;
}

export interface AttendanceOptionArea {
  id: string;
  name: string;
  active: boolean;
  queues: AttendanceOptionQueue[];
}

export interface AttendanceOptionUser {
  id: string;
  name: string;
  active: boolean;
}

export interface AttendanceOptionChannel {
  id: string;
  displayName: string;
  active: boolean;
}

export interface AttendanceOptionCapabilities {
  canAssign: boolean;
  canTransferToUser: boolean;
}

export interface AttendanceOptions {
  areas: AttendanceOptionArea[];
  users: AttendanceOptionUser[];
  channels: AttendanceOptionChannel[];
  capabilities: AttendanceOptionCapabilities;
}

export interface AttendanceEvent {
  id: string;
  companyId: string;
  workspaceId: string;
  attendanceId: string;
  action: AttendanceCommandAction;
  previousStatus: AttendanceStatus | null;
  newStatus: AttendanceStatus;
  previousAreaId: string | null;
  newAreaId: string | null;
  previousQueueId: string | null;
  newQueueId: string | null;
  previousUserId: string | null;
  newUserId: string | null;
  previousAssistantId: string | null;
  newAssistantId: string | null;
  actorType: AttendanceActorType;
  actorUserId: string | null;
  actorAssistantId: string | null;
  reason: string | null;
  sourceMessageId: string | null;
  correlationId: string | null;
  aggregateVersion: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SanitizedAttendanceCommand {
  id: string;
  attendanceId: string;
  action: string;
  actorType: string;
  actorUserId?: string | null;
  actorAssistantId?: string | null;
  idempotencyKey: string;
  correlationId?: string | null;
  resultStatus: number;
  attendanceVersion?: number | null;
  createdAt: string;
}

export interface FollowUpScheduleOnce {
  kind: "ONCE";
  firstRunAt: string;
}

export interface FollowUpScheduleDaily {
  kind: "DAILY";
  firstRunAt: string;
  intervalDays?: number;
  endAt?: string;
}

export interface FollowUpScheduleWeekly {
  kind: "WEEKLY";
  firstRunAt: string;
  daysOfWeek: number[]; // 1 = Monday .. 7 = Sunday
  intervalWeeks?: number;
  endAt?: string;
}

export interface FollowUpScheduleMonthlyDay {
  kind: "MONTHLY_DAY";
  firstRunAt: string;
  dayOfMonth: number;
  intervalMonths?: number;
  invalidDatePolicy?: "SKIP" | "LAST_DAY";
  endAt?: string;
}

export interface FollowUpScheduleMonthlyNthWeekday {
  kind: "MONTHLY_NTH_WEEKDAY";
  firstRunAt: string;
  nth: 1 | 2 | 3 | 4 | 5;
  dayOfWeek: number;
  intervalMonths?: number;
  endAt?: string;
}

export interface FollowUpScheduleMonthlyLastDay {
  kind: "MONTHLY_LAST_DAY";
  firstRunAt: string;
  intervalMonths?: number;
  endAt?: string;
}

export type FollowUpSchedule =
  | FollowUpScheduleOnce
  | FollowUpScheduleDaily
  | FollowUpScheduleWeekly
  | FollowUpScheduleMonthlyDay
  | FollowUpScheduleMonthlyNthWeekday
  | FollowUpScheduleMonthlyLastDay;

export interface FollowUpContentText {
  kind: "TEXT";
  text: string;
  purpose?: string;
}

export interface FollowUpContentMedia {
  kind: "MEDIA";
  mediaUrl: string;
  mediaMimetype: string;
  caption?: string;
  purpose?: string;
}

export interface FollowUpContentTemplate {
  kind: "TEMPLATE";
  templateId: string;
  templateName: string;
  templateLanguage: string;
  parameters?: Record<string, unknown>;
  snapshot?: Record<string, unknown>;
  purpose?: string;
}

export type FollowUpContent =
  | FollowUpContentText
  | FollowUpContentMedia
  | FollowUpContentTemplate;

export interface OperationalFollowUp {
  id: string;
  companyId: string;
  workspaceId: string;
  attendanceId: string;
  createdByUserId: string | null;
  title: string;
  timezone: string;
  schedule: FollowUpSchedule;
  content: FollowUpContent;
  status: OperationalFollowUpStatus;
  version: number;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OperationalFollowUpOccurrence {
  id: string;
  companyId: string;
  workspaceId: string;
  followUpId: string;
  occurrenceNumber: number;
  scheduledAt: string;
  status: OperationalFollowUpOccurrenceStatus;
  attempts: number;
  maxAttempts: number;
  claimToken: string | null;
  claimedAt: string | null;
  jobId: string | null;
  outboundRequestId: string | null;
  messageId: string | null;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendancesPage {
  items: AttendanceWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceMessagesPage {
  items: AttendanceMessageItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AttendanceEventsPage {
  items: AttendanceEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceCommandsPage {
  items: SanitizedAttendanceCommand[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OperationalFollowUpsPage {
  items: OperationalFollowUp[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OperationalFollowUpOccurrencesPage {
  items: OperationalFollowUpOccurrence[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceCommandResponse {
  attendance: AttendanceWithDetails;
  commandId?: string;
  eventId?: string;
  duplicate: boolean;
}

export interface CreateOperationalFollowUpResult {
  followUp: OperationalFollowUp;
  occurrence?: OperationalFollowUpOccurrence;
  commandId?: string;
  eventId?: string;
  duplicate: boolean;
}

export interface UpdateOperationalFollowUpResult {
  followUp: OperationalFollowUp;
  occurrence?: OperationalFollowUpOccurrence;
  duplicate: boolean;
}

export interface CancelOperationalFollowUpResult {
  followUp: OperationalFollowUp;
  duplicate: boolean;
}

export interface ListAttendancesFilters {
  page?: number;
  limit?: number;
  status?: AttendanceStatus;
  areaId?: string;
  queueId?: string;
  assigneeUserId?: string;
  assigneeAssistantId?: string;
  channelId?: string;
  customerId?: string;
  updatedFrom?: string;
  updatedTo?: string;
  search?: string;
  unreadOnly?: boolean;
}

export interface ListAttendancesParams extends ListAttendancesFilters {
  workspaceId: string;
}

export type AttendanceSummaryFilters = Omit<
  ListAttendancesFilters,
  "page" | "limit" | "status"
>;

export interface ListAttendanceSummaryParams extends AttendanceSummaryFilters {
  workspaceId: string;
}

export interface ListAttendanceOptionsParams {
  workspaceId: string;
}

export interface GetAttendanceDetailParams {
  workspaceId: string;
  attendanceId: string;
}

export interface ListAttendanceMessagesParams {
  workspaceId: string;
  attendanceId: string;
  limit?: number;
  before?: string;
}

export interface ListOperationalAttendanceTemplatesParams {
  workspaceId: string;
  attendanceId: string;
}

export type SendOperationalAttendanceMessageBody =
  | {
      kind: "TEXT";
      expectedVersion: number;
      text: string;
    }
  | {
      kind: "MEDIA";
      expectedVersion: number;
      mediaType: "image" | "audio" | "document";
      caption?: string;
    }
  | {
      kind: "TEMPLATE";
      expectedVersion: number;
      templateId: string;
      bindings?: Record<string, OperationalTemplateBinding>;
    };

export interface SendOperationalAttendanceMessageParams {
  workspaceId: string;
  attendanceId: string;
  body: SendOperationalAttendanceMessageBody;
  file?: File;
  idempotencyKey?: string;
}

export interface SendOperationalAttendanceMessageResponse {
  message: {
    id: string;
    attendanceId: string;
    sender: "HUMAN";
    type: string;
    content: string;
    dispatchStatus: string | null;
    deliveryStatus: string | null;
    createdAt: string;
  };
  outboundRequestId: string;
  duplicate: boolean;
}

export interface MarkAttendanceReadParams {
  workspaceId: string;
  attendanceId: string;
}

export interface ListAttendanceEventsParams {
  workspaceId: string;
  attendanceId: string;
  page?: number;
  limit?: number;
  afterVersion?: number;
}

export interface ListAttendanceCommandsParams {
  workspaceId: string;
  attendanceId: string;
  page?: number;
  limit?: number;
}

export interface RouteAttendanceParams {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  targetAreaId: string;
  targetQueueId: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface ClaimAttendanceParams {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  idempotencyKey?: string;
}

export interface AssignAttendanceParams {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  targetUserId: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface TransferAttendanceParams {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  targetAreaId: string;
  targetQueueId: string;
  targetUserId?: string;
  targetAssistantId?: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface UnassignAttendanceParams {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  reason?: string;
  idempotencyKey?: string;
}

export interface InlineFollowUpParams {
  title: string;
  timezone: string;
  schedule: FollowUpSchedule;
  content: FollowUpContent;
}

export interface PendingAttendanceParams {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  reason: string;
  pendingDueAt?: string;
  followUp?: InlineFollowUpParams;
  idempotencyKey?: string;
}

export interface ResumeAttendanceParams {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  reason?: string;
  idempotencyKey?: string;
}

export interface CloseAttendanceParams {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  closeSummary: string;
  idempotencyKey?: string;
}

export interface CreateOperationalFollowUpParams {
  workspaceId: string;
  attendanceId: string;
  expectedVersion: number;
  title: string;
  timezone: string;
  schedule: FollowUpSchedule;
  content: FollowUpContent;
  idempotencyKey?: string;
}

export interface UpdateOperationalFollowUpParams {
  workspaceId: string;
  attendanceId: string;
  followUpId: string;
  expectedVersion: number;
  title?: string;
  timezone?: string;
  schedule?: FollowUpSchedule;
  content?: FollowUpContent;
  idempotencyKey?: string;
}

export interface CancelOperationalFollowUpParams {
  workspaceId: string;
  attendanceId: string;
  followUpId: string;
  expectedVersion: number;
  reason?: string;
  idempotencyKey?: string;
}

export interface ListOperationalFollowUpsParams {
  workspaceId: string;
  attendanceId: string;
  page?: number;
  limit?: number;
  status?: OperationalFollowUpStatus;
}

export interface ListOperationalFollowUpOccurrencesParams {
  workspaceId: string;
  attendanceId: string;
  followUpId: string;
  page?: number;
  limit?: number;
  status?: OperationalFollowUpOccurrenceStatus;
}
