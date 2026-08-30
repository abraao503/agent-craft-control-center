import { api } from "@/services/api";
import {
  SendOperationalAttendanceMessageParams,
  SendOperationalAttendanceMessageResponse,
} from "@/types/operation-attendance";

export async function sendOperationalAttendanceMessage(
  params: SendOperationalAttendanceMessageParams,
): Promise<SendOperationalAttendanceMessageResponse> {
  const { workspaceId, attendanceId, body, file } = params;
  const idempotencyKey = params.idempotencyKey ?? crypto.randomUUID();
  const url = `/operation/workspaces/${workspaceId}/attendances/${attendanceId}/messages`;

  if (body.kind === "MEDIA") {
    if (!file) {
      throw new Error("FILE_REQUIRED");
    }

    const formData = new FormData();
    formData.append("kind", body.kind);
    formData.append("expectedVersion", String(body.expectedVersion));
    formData.append("mediaType", body.mediaType);
    if (body.caption) {
      formData.append("caption", body.caption);
    }
    formData.append("file", file);

    const { data } = await api.post<SendOperationalAttendanceMessageResponse>(
      url,
      formData,
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  }

  const { data } = await api.post<SendOperationalAttendanceMessageResponse>(
    url,
    body,
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    },
  );

  return data;
}
