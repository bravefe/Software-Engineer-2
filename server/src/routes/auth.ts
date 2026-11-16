import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../prisma";
import { COOKIE_NAME, createSessionToken, hashSessionToken, SESSION_DURATION_MS, verifyPassword } from "../utils/auth";

const router = Router();

router.post("/login", async (req, res): Promise<void> => {
  const { email, password } = req.body || {};

  if (
    !email ||
    !password ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    res.status(400).json({
      error: "Email and password are required",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  const sanitizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
      return;
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await prisma.session.create({
      data: {
        id: hashSessionToken(token),
        userId: user.id,
        expiresAt,
      },
    });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION_MS,
      path: "/",
    });

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Authentication service error",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

router.post("/logout", async (req, res): Promise<void> => {
  const token = req.cookies?.[COOKIE_NAME];
  if (typeof token === "string") {
    await prisma.session.deleteMany({ where: { id: hashSessionToken(token) } });
  }
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.status(200).json({
    message: "Logged out successfully",
  });
});

router.get("/me", requireAuth, (req, res): void => {
  res.status(200).json({
    user: req.user,
  });
});

export default router;
