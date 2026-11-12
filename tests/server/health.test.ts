import { resolve } from "node:path";
import dotenv from "dotenv";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma } from "../../server/src/prisma";

dotenv.config({ path: resolve(process.cwd(), "server/.env") });

import { app } from "../../server/src/app";

describe("GET /api/ready", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  it("reports healthy status when the real database is available", async () => {
    const response = await request(app).get("/api/ready");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
  });
});
