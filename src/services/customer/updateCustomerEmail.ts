import { api } from "../api";

export interface UpdateCustomerEmailParams {
  customerId: string;
  email: string;
  workspaceId: string;
}

export async function updateCustomerEmail({
  customerId,
  email,
  workspaceId,
}: UpdateCustomerEmailParams): Promise<void> {
  await api.patch(`/customer/${customerId}/email`, { email, workspaceId });
}
