import { apiFetch, setStoredToken } from './api-client';

export type ProfileFields = { displayName: string; professionalTitle: string; organization: string; phone: string; barNumber: string; primaryLegalArea: string; bio: string };
export type AuthUser = ProfileFields & { id: string; email: string; role: string; plan: string };
export type RegisterInput = { email: string; password: string; displayName: string; professionalTitle: string };
type AuthResponse = { accessToken: string; user: AuthUser };

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  await setStoredToken(response.accessToken);
  return response.user;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const response = await apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
  await setStoredToken(response.accessToken);
  return response.user;
}

export function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me');
}

export function updateProfile(patch: Partial<ProfileFields>): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function logout(): Promise<void> {
  await setStoredToken(null);
}
