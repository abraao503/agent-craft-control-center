import { Customer, CustomerListParams, CustomerResponse } from "@/types/customer";
import { api } from "../api";

export const listCustomers = async (params?: CustomerListParams): Promise<CustomerResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  if (params?.orderBy) {
    queryParams.append('orderBy', params.orderBy);
  }
  
  if (params?.order) {
    queryParams.append('order', params.order);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await api.get<CustomerResponse>(`/customer/list${queryString}`);
  
  return {
    ...response.data,
    items: response.data.items.map(customer => ({
      ...customer,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt)
    }))
  };
}; 