// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Reports from "../../client/src/pages/Reports";

describe("Reports page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("applies status and date filters to the list and summary and handles empty results", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      const empty = url.includes("startDate=2099-01-01");
      if (url.includes("/summary")) {
        return {
          ok: true,
          json: async () => ({
            totalCount: empty ? 0 : 1,
            statusCounts: {
              DRAFT: 0,
              PENDING_REVIEW: 0,
              APPROVED: empty ? 0 : 1,
              REJECTED: 0,
              RETURNED: 0,
              WITHDRAWN: 0,
            },
            statusAmounts: {
              DRAFT: "0.00",
              PENDING_REVIEW: "0.00",
              APPROVED: empty ? "0.00" : "1250.00",
              REJECTED: "0.00",
              RETURNED: "0.00",
              WITHDRAWN: "0.00",
            },
            totalAmount: empty ? "0.00" : "1250.00",
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          requests: empty
            ? []
            : [{
                id: 1,
                requestNumber: "PR-2026-REPORT-01",
                title: "Report fixture",
                amount: "1250.00",
                status: "APPROVED",
                requesterId: 1,
                reviewerId: 2,
                createdAt: "2026-04-15T10:00:00.000Z",
                submittedAt: "2026-04-15T10:00:00.000Z",
              }],
        }),
      };
    });
    globalThis.fetch = mockFetch;

    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("report-total-amount").textContent).toBe("$1250.00");
      expect(screen.getByText("Report fixture")).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/status filter/i), {
      target: { value: "APPROVED" },
    });
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2099-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2099-01-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^filter$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("report-total-count").textContent).toBe("0");
      expect(screen.getByTestId("report-total-amount").textContent).toBe("$0.00");
      expect(screen.getByTestId("report-status-APPROVED").textContent).toBe("0");
      expect(screen.getByText("No matching purchase requests")).toBeTruthy();
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/reports/summary?status=APPROVED&startDate=2099-01-01&endDate=2099-01-31",
      expect.anything(),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/reports/requests?status=APPROVED&startDate=2099-01-01&endDate=2099-01-31",
      expect.anything(),
    );
  });
});
