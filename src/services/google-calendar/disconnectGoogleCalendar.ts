import { api } from "../api";

export interface DisconnectGoogleCalendarParams {
  integrationId: string;
}

export async function disconnectGoogleCalendar({
  integrationId,
}: DisconnectGoogleCalendarParams): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(
    `/google-calendar/disconnect?integrationId=${integrationId}`,
  );
  return data;
}
