import { api } from "../api";

export interface UpdateCustomerPhoneParams {
  customerId: string;
  phone: string;
  workspaceId: string;
}

export async function updateCustomerPhone({
  customerId,
  phone,
  workspaceId,
}: UpdateCustomerPhoneParams): Promise<void> {
  await api.patch(`/customer/${customerId}/phone`, { phone, workspaceId });
}
