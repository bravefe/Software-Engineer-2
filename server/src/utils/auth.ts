import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const COOKIE_NAME = "macau678_session";
export const JWT_SECRET = process.env.JWT_SECRET || "macau678-super-secret-jwt-key-min-32-chars";

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload, secret = JWT_SECRET, expiresIn = "8h"): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string, secret = JWT_SECRET): TokenPayload | null {
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

