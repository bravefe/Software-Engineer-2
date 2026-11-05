import type { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma";
import { COOKIE_NAME, verifyToken } from "../utils/auth";

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: "REQUESTER" | "REVIEWER";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const token = cookieToken || headerToken;

  if (!token) {
    res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      error: "Invalid or expired authentication session",
      code: "INVALID_AUTH",
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: "User is inactive or not found",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    res.status(500).json({
      error: "Failed to verify authentication status",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

export function requireRole(
  allowedRoles: Array<"REQUESTER" | "REVIEWER">,
  errorMessage = "Access denied for current role",
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: errorMessage,
        code: "ACCESS_DENIED",
      });
      return;
    }

    next();
  };
}
