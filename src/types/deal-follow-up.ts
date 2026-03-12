/**
 * IMPORTANTE: No backend este recurso é chamado de "follow-up"
 * mas no frontend chamamos de "Agendamento de Mensagens" para melhor UX
 *
 * API endpoints: /deals/:dealId/follow-ups
 */

export type DealFollowUpStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";

// Type alias para melhor legibilidade no frontend
export type DealScheduledMessage = DealFollowUp;
export type DealScheduledMessageStatus = DealFollowUpStatus;

// --- Recurrence types ---

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export type WeeklyRule = {
  type: "WEEKLY";
  daysOfWeek: number[]; // 0=Dom, 1=Seg, ..., 6=Sáb
};

export type MonthlyDayRule = {
  type: "MONTHLY_DAY";
  day: number; // 1-31
};

export type MonthlyNthWeekdayRule = {
  type: "MONTHLY_NTH_WEEKDAY";
  weekday: number; // 0-6
  nth: number; // 1-5
};

export type MonthlyLastDayRule = {
  type: "MONTHLY_LAST_DAY";
};

export type MonthlyRule =
  | MonthlyDayRule
  | MonthlyNthWeekdayRule
  | MonthlyLastDayRule;

export type DailyRecurrence = {
  frequency: "DAILY";
  interval: number;
  endAt?: string;
};

export type WeeklyRecurrence = {
  frequency: "WEEKLY";
  interval: number;
  endAt?: string;
  rule: WeeklyRule;
};

export type MonthlyRecurrence = {
  frequency: "MONTHLY";
  interval: number;
  endAt?: string;
  rule: MonthlyRule;
  invalidDatePolicy?: "SKIP" | "LAST_DAY";
};

export type Recurrence = DailyRecurrence | WeeklyRecurrence | MonthlyRecurrence;

// --- Media type ---

export type FollowUpMediaType = "image" | "audio" | "document";

// --- Main types ---

export type DealFollowUp = {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  nextScheduledAt: string | null;
  dealId: string;
  status: DealFollowUpStatus;
  // Media fields
  mediaUrl: string | null;
  mediaMimetype: string | null;
  mediaType: FollowUpMediaType | null;
  // Recurrence fields
  recurrence: Recurrence | null;
  isRecurring: boolean;
  totalOccurrences: number;
  failedOccurrences: number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FollowUpOccurrence = {
  id: string;
  followUpId: string;
  scheduledAt: string;
  status: DealFollowUpStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: string | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FollowUpOccurrenceListResponse = {
  items: FollowUpOccurrence[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateDealFollowUpParams = {
  title: string;
  message: string;
  scheduledAt: string;
  file?: File;
  recurrence?: Recurrence;
};

export type DealFollowUpListResponse = {
  items: DealFollowUp[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
