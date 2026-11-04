import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("../../server/src/prisma", () => ({
  getPrisma: () => ({ $queryRaw: queryRaw }),
}));

import { app } from "../../server/src/app";

describe("GET /api/health", () => {
  beforeEach(() => {
    queryRaw.mockReset().mockResolvedValue([{ "?column?": 1 }]);
  });

  it("reports healthy status when the database query succeeds", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
    expect(queryRaw).toHaveBeenCalledOnce();
  });

  it("reports an error when the database query fails", async () => {
    queryRaw.mockRejectedValueOnce(new Error("Database unavailable"));

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "error", database: "disconnected" });
    expect(queryRaw).toHaveBeenCalledOnce();
  });
});
