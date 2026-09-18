import { api } from "@/services/api";
import {
  CreateAttendanceInternalNoteParams,
  CreateAttendanceInternalNoteResponse,
} from "@/types/operation-attendance";

export async function createAttendanceInternalNote(
  params: CreateAttendanceInternalNoteParams,
): Promise<CreateAttendanceInternalNoteResponse> {
  const { workspaceId, attendanceId, content, idempotencyKey } = params;
  const key = idempotencyKey ?? crypto.randomUUID();

  const { data } = await api.post<CreateAttendanceInternalNoteResponse>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/internal-notes`,
    { content },
    { headers: { "Idempotency-Key": key } },
  );

  return data;
}
