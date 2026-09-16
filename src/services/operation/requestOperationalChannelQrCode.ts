import { api } from "@/services/api";
import {
  OperationalChannelQrCode,
  RequestOperationalChannelQrCodeParams,
} from "@/types/operation-channels";

export async function requestOperationalChannelQrCode(
  params: RequestOperationalChannelQrCodeParams,
): Promise<OperationalChannelQrCode> {
  const { data } = await api.post<OperationalChannelQrCode>(
    `/operation/workspaces/${params.workspaceId}/channels/${params.channelId}/request-qr-code`,
  );

  return data;
}
