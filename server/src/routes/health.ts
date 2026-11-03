import { Router, type Request, type Response } from "express";
import { getPrisma } from "../prisma";

const router = Router();

router.get("/health", async (_request: Request, response: Response) => {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error);
    response.status(503).json({ status: "error", database: "disconnected" });
  }
});

export default router;
