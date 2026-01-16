import { UserProfile } from "@/types/auth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUserProfile: () => Promise<void>;
}

export type UserLoginResponse = {
  user: User;
  token: string;
};
