import { api } from "../api";

export interface SignupCompanyParams {
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  companyName: string;
}

export interface SignupCompanyResponse {
  message: string;
  company: {
    id: string;
    name: string;
    createdAt: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

export async function signupCompany(
  params: SignupCompanyParams
): Promise<SignupCompanyResponse> {
  const { data } = await api.post<SignupCompanyResponse>(
    "/company/signup",
    params
  );
  return data;
}
