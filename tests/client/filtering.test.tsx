// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RequesterDashboard from "../../client/src/pages/RequesterDashboard";
import ReviewerQueue from "../../client/src/pages/ReviewerQueue";

describe("Frontend component tests: Request Filtering & Search (FEAT-10)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("RequesterDashboard filtering controls", () => {
    it("renders all filter controls and clear button", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] }),
      } as any);

      render(
        <MemoryRouter>
          <RequesterDashboard />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/status filter/i)).toBeTruthy();
      });

      expect(screen.getByLabelText(/start date/i)).toBeTruthy();
      expect(screen.getByLabelText(/end date/i)).toBeTruthy();
      expect(screen.getByLabelText(/keyword search/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /^filter$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^clear$/i })).toBeTruthy();
    });

    it("applies filters and fetches requests with query parameters", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] }),
      } as any);
      globalThis.fetch = mockFetch;

      render(
        <MemoryRouter>
          <RequesterDashboard />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/status filter/i)).toBeTruthy();
      });

      // Change status filter
      fireEvent.change(screen.getByLabelText(/status filter/i), {
        target: { value: "APPROVED" },
      });

      // Enter start date
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2026-01-01" },
      });

      // Enter end date
      fireEvent.change(screen.getByLabelText(/end date/i), {
        target: { value: "2026-01-31" },
      });

      // Enter keyword
      fireEvent.change(screen.getByLabelText(/keyword search/i), {
        target: { value: "Office" },
      });

      // Click Filter
      fireEvent.click(screen.getByRole("button", { name: /^filter$/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/requests?status=APPROVED&startDate=2026-01-01&endDate=2026-01-31&search=Office"),
          expect.anything(),
        );
      });
    });

    it("clears filters and reloads the full authorized list", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] }),
      } as any);
      globalThis.fetch = mockFetch;

      render(
        <MemoryRouter>
          <RequesterDashboard />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/keyword search/i)).toBeTruthy();
      });

      // Set keyword
      const searchInput = screen.getByLabelText(/keyword search/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: "Keyboard" } });
      expect(searchInput.value).toBe("Keyboard");

      // Click Clear
      fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));

      await waitFor(() => {
        expect(searchInput.value).toBe("");
        expect(mockFetch).toHaveBeenLastCalledWith("/api/requests", expect.anything());
      });
    });

    it("displays appropriate empty state when no requests match filter", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] }),
      } as any);

      render(
        <MemoryRouter>
          <RequesterDashboard />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText(/no purchase requests submitted yet/i)).toBeTruthy();
      });

      // Apply filter that yields no results
      fireEvent.change(screen.getByLabelText(/keyword search/i), {
        target: { value: "NonExistent" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^filter$/i }));

      await waitFor(() => {
        expect(screen.getByText(/no matching purchase requests/i)).toBeTruthy();
        expect(screen.getByText(/no purchase requests match your selected filter criteria/i)).toBeTruthy();
      });
    });
  });

  describe("ReviewerQueue filtering controls", () => {
    it("renders reviewer filter controls and triggers filtered fetch", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          requests: [
            {
              id: 1,
              requestNumber: "PR-2026-00001",
              title: "Reviewer Test Request",
              amount: "100.00",
              status: "PENDING_REVIEW",
              requesterId: 1,
              reviewerId: 2,
              createdAt: "2026-11-01T10:00:00.000Z",
              submittedAt: "2026-11-01T10:00:00.000Z",
              requester: { id: 1, name: "Alice", email: "alice@test.com", role: "REQUESTER" },
            },
          ],
        }),
      } as any);
      globalThis.fetch = mockFetch;

      render(
        <MemoryRouter>
          <ReviewerQueue />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Reviewer Test Request")).toBeTruthy();
      });

      // Apply filter
      fireEvent.change(screen.getByLabelText(/status filter/i), {
        target: { value: "APPROVED" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^filter$/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/requests?status=APPROVED"),
          expect.anything(),
        );
      });
    });
  });
});
