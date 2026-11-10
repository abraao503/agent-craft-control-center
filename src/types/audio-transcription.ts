export type AudioTranscriptionStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface AttendanceMessageTranscription {
  status: AudioTranscriptionStatus;
  text: string | null;
  errorCode: string | null;
}

export type AudioTranscriptionKeyStatus =
  | "ACTIVE"
  | "INVALID"
  | "QUOTA_EXCEEDED";

export interface AudioTranscriptionConfiguration {
  configured: boolean;
  status: AudioTranscriptionKeyStatus | null;
  keyLastFour: string | null;
  lastCheckedAt: string | null;
  lastErrorCode: string | null;
}

export interface SaveAudioTranscriptionConfigurationParams {
  apiKey: string;
}

export interface RetryAudioTranscriptionParams {
  workspaceId: string;
  attendanceId: string;
  messageId: string;
}

export interface RetryAudioTranscriptionResponse {
  messageId: string;
  status: "PENDING";
}
