import { api } from '@/services/api';

export type GetOperationalAttendanceMessageMediaParams = {
  workspaceId: string;
  attendanceId: string;
  messageId: string;
};

export async function getOperationalAttendanceMessageMedia(
  params: GetOperationalAttendanceMessageMediaParams,
): Promise<Blob> {
  const { workspaceId, attendanceId, messageId } = params;
  const { data } = await api.get<Blob>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/messages/${messageId}/media`,
    { responseType: 'blob' },
  );

  return data;
}
