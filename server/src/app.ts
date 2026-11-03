import cors from "cors";
import express, { type Request, type Response } from "express";
import type { PrismaClient } from "@prisma/client";

export function createApp(prisma: PrismaClient) {
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:5173",
    }),
  );
  app.use(express.json());

  app.get("/api/health", async (_request: Request, response: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.json({ status: "ok", database: "connected" });
    } catch (error) {
      console.error("Database health check failed:", error);
      response.status(503).json({ status: "error", database: "disconnected" });
    }
  });

  return app;
}
