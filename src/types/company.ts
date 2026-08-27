import { WorkspaceType } from "@/types/workspace";

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
  ownerName: string;
  metaCloudWhatsappEnabled: boolean;
}

export interface CreateCompanyRequest {
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  companyName: string;
}

export interface CreateCompanyResponse {
  companyId: string;
  userId: string;
  email: string;
  name: string;
}

export interface UpdateCompanyRequest {
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
  companyName?: string;
}

export interface UpdateCompanyResponse {
  companyId: string;
  message: string;
}

export interface ListCompaniesResponse {
  items: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CompanyWorkspace {
  id: string;
  name: string;
  isDefault: boolean;
  type: WorkspaceType;
}

export interface CompanyDetails {
  id: string;
  name: string | null;
  metaCloudWhatsappEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  workspaces: CompanyWorkspace[];
}

export type GetCompanyByIdResponse = CompanyDetails;

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  AGENT = "AGENT",
  USER = "USER",
}

export interface CompanyAdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface ListCompanyAdminsResponse {
  success: true;
  data: {
    items: CompanyAdminUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AddUserToCompanyRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  workspaceId?: string;
}

export interface AddUserToCompanyResponse {
  success: boolean;
  data?: {
    userId: string;
    email: string;
    name: string;
  };
  message?: string;
}
