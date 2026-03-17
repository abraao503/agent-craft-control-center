import { api } from "../api";

export interface UploadMediaResponse {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  mediaType: "image" | "audio" | "document";
}

/**
 * Uploads a media file (image, audio or document) to the server.
 * Returns the file metadata including the `id` to be used as `mediaFileId`
 * in reengagement-config and pipeline routes.
 *
 * Max file size: 10 MB.
 */
export async function uploadMedia(file: File): Promise<UploadMediaResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadMediaResponse>(
    "/file/media/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data;
}
