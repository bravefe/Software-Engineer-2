// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getHealthStatus } = vi.hoisted(() => ({
  getHealthStatus: vi.fn(),
}));

vi.mock("../../client/src/api/health", () => ({
  getHealthStatus,
}));

import HealthPage from "../../client/src/pages/Health";

describe("Health page", () => {
  beforeEach(() => {
    getHealthStatus.mockReset().mockResolvedValue({
      status: "ok",
      database: "connected",
    });
  });

  it("shows successful API and database health", async () => {
    render(<HealthPage />);

    expect(
      await screen.findByText("API: ok; database: connected."),
    ).toBeTruthy();
    expect(getHealthStatus).toHaveBeenCalledOnce();
  });
});
