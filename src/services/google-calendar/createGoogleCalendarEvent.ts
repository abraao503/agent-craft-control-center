import { api } from "../api";
import { GoogleCalendarEvent } from "./listGoogleCalendarEvents";

export interface CreateGoogleCalendarEventParams {
  integrationId: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  timeZone?: string;
  location?: string;
  attendees?: string[];
  dealId?: string;
  customerId?: string;
}

export async function createGoogleCalendarEvent(
  params: CreateGoogleCalendarEventParams,
): Promise<{ event: GoogleCalendarEvent }> {
  const { data } = await api.post("/google-calendar/events", params);
  return data;
}
