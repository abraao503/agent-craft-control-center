import { api } from "../api";

export interface DeleteGoogleCalendarEventParams {
  id: string; // Internal event ID
}

export async function deleteGoogleCalendarEvent({
  id,
}: DeleteGoogleCalendarEventParams): Promise<void> {
  await api.delete(`/google-calendar/events/${id}`);
}
