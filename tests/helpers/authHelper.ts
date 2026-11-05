import request from "supertest";
import { app } from "../../server/src/app";
import { COOKIE_NAME, generateToken } from "../../server/src/utils/auth";

export async function loginAs(email: string, password = "Password123!"): Promise<{ cookie: string; user: any }> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  const cookieHeader = res.headers["set-cookie"];
  const cookie = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;

  return {
    cookie,
    user: res.body.user,
  };
}

export function createAuthCookie(userId: number, email: string, role: string): string {
  const token = generateToken({ userId, email, role });
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax`;
}

