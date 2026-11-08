import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { getPrisma } from "../prisma";

const router = Router();

async function respondWithHealth(
  response: Response,
  role?: "REQUESTER" | "REVIEWER",
): Promise<void> {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    response.json({
      ...(role ? { role } : {}),
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    response.status(503).json({
      ...(role ? { role } : {}),
      status: "error",
      database: "disconnected",
      message: "Database connection failed.",
    });
  }
}

router.get("/health", async (_request: Request, response: Response) => {
  await respondWithHealth(response);
});

router.get(
  "/health/requester",
  requireAuth,
  requireRole(
    ["REQUESTER"],
    "Requester health endpoint is only accessible to users with the REQUESTER role.",
  ),
  async (_request: Request, response: Response) => {
    await respondWithHealth(response, "REQUESTER");
  },
);

router.get(
  "/health/reviewer",
  requireAuth,
  requireRole(
    ["REVIEWER"],
    "Reviewer health endpoint is only accessible to users with the REVIEWER role.",
  ),
  async (_request: Request, response: Response) => {
    await respondWithHealth(response, "REVIEWER");
  },
);

export default router;
