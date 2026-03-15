import { apiRequest } from './axios';

// Handles all auth API calls — login, register, and profile fetch.
// All functions use apiRequest from axios.ts and throw on failure.

export type AuthUser = {
  _id?: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_created?: string;
};

type AuthResponse = {
  status: string;
  data: Array<{ user: AuthUser; token: string }>;
  message: string;
};

type ProfileResponse = {
  status: string;
  data: AuthUser[];
};

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const result = await apiRequest<AuthResponse>('/api/users/login', {
    method: 'POST',
    body: { email, password },
  });

  const authData = result.data?.[0];

  if (!authData?.token || !authData?.user) {
    throw new Error('Login response was missing token or user data.');
  }

  return authData;
}

export async function registerUser(payload: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}): Promise<{ user: AuthUser; token: string }> {
  const result = await apiRequest<AuthResponse>('/api/users/register', {
    method: 'POST',
    body: payload,
  });

  const authData = result.data?.[0];

  if (!authData?.token || !authData?.user) {
    throw new Error('Registration response was missing token or user data.');
  }

  return authData;
}

export async function fetchProfile(token: string): Promise<AuthUser | null> {
  const result = await apiRequest<ProfileResponse>('/api/users/profile', {
    token,
  });

  return result.data?.[0] ?? null;
}