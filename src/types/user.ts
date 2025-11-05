// Types for User management
// Comments in English as per project rules

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  workspaceId: string;
}

export interface ListUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface AssignUserToDealInput {
  workspaceId: string;
  userId: string;
}
