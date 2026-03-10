import { api } from "../api";

export interface GoogleCalendarEvent {
  id: string | null;
  googleEventId: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  attendees?: string[];
  htmlLink?: string;
  dealId?: string;
  customerId?: string;
  source: "db" | "google";
}

export interface ListGoogleCalendarEventsParams {
  integrationId: string;
  page?: number;
  limit?: number;
  dealId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListGoogleCalendarEventsResponse {
  items: GoogleCalendarEvent[];
  total: number;
}

export async function listGoogleCalendarEvents({
  integrationId,
  page,
  limit,
  dealId,
  customerId,
  startDate,
  endDate,
}: ListGoogleCalendarEventsParams): Promise<ListGoogleCalendarEventsResponse> {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));
  if (dealId) params.append("dealId", dealId);
  if (customerId) params.append("customerId", customerId);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const query = params.toString();
  const url = `/google-calendar/${integrationId}/events${query ? `?${query}` : ""}`;

  const { data } = await api.get<ListGoogleCalendarEventsResponse>(url);
  return data;
}
