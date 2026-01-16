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

export type DealFollowUp = {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  dealId: string;
  status: DealFollowUpStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: string | null;
  error: string | null;
  jobId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CreateDealFollowUpParams = {
  title: string;
  message: string;
  scheduledAt: string;
};

export type DealFollowUpListResponse = {
  items: DealFollowUp[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
