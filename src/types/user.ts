// Types for User management
// Comments in English as per project rules

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string | Date;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  workspaceId?: string; // Required for workspace-level users
  companyId?: string; // Optional: PLATFORM_ADMIN can use this to filter by company
}

export interface ListUsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssignUserToDealInput {
  workspaceId: string;
  userId: string | null;
}
