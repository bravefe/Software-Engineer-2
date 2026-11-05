import type { UserProfile } from "../context/AuthContext";

interface LoginResponse {
  user: UserProfile;
}

interface CurrentUserResponse {
  user: UserProfile;
}

interface ErrorResponse {
  error?: string;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const data = (await response.json()) as ErrorResponse;
    throw new Error(data.error || "Unable to restore authentication session");
  }

  const data = (await response.json()) as CurrentUserResponse;
  return data.user;
}

export async function login(
  email: string,
  password: string,
): Promise<UserProfile> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = (await response.json()) as ErrorResponse;
    throw new Error(data.error || "Login failed");
  }

  const data = (await response.json()) as LoginResponse;
  return data.user;
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const data = (await response.json()) as ErrorResponse;
    throw new Error(data.error || "Unable to sign out");
  }
}
