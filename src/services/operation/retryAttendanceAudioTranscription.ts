import { api } from "@/services/api";
import type {
  RetryAudioTranscriptionParams,
  RetryAudioTranscriptionResponse,
} from "@/types/audio-transcription";

export async function retryAttendanceAudioTranscription(
  params: RetryAudioTranscriptionParams,
): Promise<RetryAudioTranscriptionResponse> {
  const { workspaceId, attendanceId, messageId } = params;
  const { data } = await api.post<RetryAudioTranscriptionResponse>(
    `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/messages/${messageId}/transcription/retry`,
  );
  return data;
}
