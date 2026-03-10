import { api } from "../api";
import { GoogleCalendarEvent } from "./listGoogleCalendarEvents";

export interface UpdateGoogleCalendarEventParams {
  id: string; // Internal event ID
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  timeZone?: string;
  location?: string;
  attendees?: string[];
}

export async function updateGoogleCalendarEvent({
  id,
  ...params
}: UpdateGoogleCalendarEventParams): Promise<{ event: GoogleCalendarEvent }> {
  const { data } = await api.patch(`/google-calendar/events/${id}`, params);
  return data;
}
