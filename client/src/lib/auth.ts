import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export async function register(data: RegisterData): Promise<{ user: User }> {
  const response = await apiRequest("POST", "/api/auth/register", data);
  return response.json();
}

export async function login(data: LoginData): Promise<{ user: User; needsPasswordReset?: boolean }> {
  const response = await apiRequest("POST", "/api/auth/login", data);
  return response.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
  const response = await apiRequest("POST", "/api/auth/forgot-password", data);
  return response.json();
}

export async function resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
  const response = await apiRequest("POST", "/api/auth/reset-password", data);
  return response.json();
}
