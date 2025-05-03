export interface CustomField {
  name: string;
  type: string;
  value: string;
}

export interface Customer {
  id: string;
  companyId: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  totalCustomFields: number;
}

export interface CustomerWithFields {
  id: string;
  companyId: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  customFields: CustomField[];
}

export interface CustomerResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}
