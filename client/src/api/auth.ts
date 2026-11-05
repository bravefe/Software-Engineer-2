import type { UserProfile } from "../context/AuthContext";

interface LoginResponse {
  user: UserProfile;
}

interface ErrorResponse {
  error?: string;
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
