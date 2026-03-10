import { api } from "../api";

export interface GoogleCalendarIntegration {
  id: string;
  workspaceId: string;
  companyId: string;
  googleEmail: string;
  calendarId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListGoogleCalendarIntegrationsParams {
  workspaceId: string;
}

export interface ListGoogleCalendarIntegrationsResponse {
  items: GoogleCalendarIntegration[];
}

export async function listGoogleCalendarIntegrations({
  workspaceId,
}: ListGoogleCalendarIntegrationsParams): Promise<ListGoogleCalendarIntegrationsResponse> {
  const { data } = await api.get<ListGoogleCalendarIntegrationsResponse>(
    `/google-calendar/integrations?workspaceId=${workspaceId}`,
  );
  return data;
}
