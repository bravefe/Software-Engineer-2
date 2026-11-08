// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getHealthStatus, getRoleHealthResults } = vi.hoisted(() => ({
  getHealthStatus: vi.fn(),
  getRoleHealthResults: vi.fn(),
}));

vi.mock("../../client/src/api/health", () => ({
  getHealthStatus,
  getRoleHealthResults,
}));

import HealthPage from "../../client/src/pages/Health";

describe("Health page", () => {
  beforeEach(() => {
    getHealthStatus.mockReset().mockResolvedValue({
      status: "ok",
      database: "connected",
    });
    getRoleHealthResults.mockReset().mockResolvedValue([
      {
        role: "REQUESTER",
        status: { status: "ok", database: "connected" },
      },
      {
        role: "REVIEWER",
        error:
          "Reviewer health endpoint is only accessible to users with the REVIEWER role.",
      },
    ]);
  });

  it("shows public health and the results for both role-specific endpoints", async () => {
    render(<HealthPage />);

    expect(
      await screen.findAllByText("API: ok; database: connected."),
    ).toHaveLength(2);
    expect(
      screen.getByText(
        "Reviewer health endpoint is only accessible to users with the REVIEWER role.",
      ),
    ).toBeTruthy();
    expect(getHealthStatus).toHaveBeenCalledOnce();
    expect(getRoleHealthResults).toHaveBeenCalledOnce();
  });

  it("displays the public health endpoint error message", async () => {
    getHealthStatus.mockRejectedValueOnce(
      new Error("Database connection failed."),
    );

    render(<HealthPage />);

    expect(
      await screen.findByText("Database connection failed."),
    ).toBeTruthy();
  });
});
