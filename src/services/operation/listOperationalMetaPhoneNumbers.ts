import { api } from "@/services/api";
import {
  OperationalMetaPhoneNumberAvailability,
} from "@/types/operation-channels";

export async function listOperationalMetaPhoneNumbers(
  workspaceId: string,
): Promise<OperationalMetaPhoneNumberAvailability[]> {
  const { data } = await api.get<OperationalMetaPhoneNumberAvailability[]>(
    `/operation/workspaces/${workspaceId}/channels/meta-cloud/phone-numbers`,
  );

  return data;
}

export function selectFreeOperationalMetaPhoneNumbers(
  phoneNumbers: OperationalMetaPhoneNumberAvailability[],
): OperationalMetaPhoneNumberAvailability[] {
  return phoneNumbers.filter(
    (phone) => phone.boundWorkspaceId === null,
  );
}
