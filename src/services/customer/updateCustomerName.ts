import { api } from "../api";

export interface UpdateCustomerNameParams {
  customerId: string;
  name: string;
}

export async function updateCustomerName({
  customerId,
  name,
}: UpdateCustomerNameParams): Promise<void> {
  await api.patch(`/customer/${customerId}/name`, { name });
}
