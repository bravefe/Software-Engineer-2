// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "../../client/src/components/Navbar";
import { AuthProvider } from "../../client/src/context/AuthContext";

const reviewer = {
  id: 2,
  name: "Bob Reviewer",
  email: "bob@macau678.com",
  role: "REVIEWER" as const,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("authentication session restoration", () => {
  it("restores the authenticated user and role-specific navigation on load", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: reviewer }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Bob Reviewer (REVIEWER)")).toBeTruthy();
    expect(screen.getByText("Review Queue")).toBeTruthy();
    expect(screen.getByText("Reports")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      credentials: "include",
    });
  });

  it("clears the server session when signing out", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "Logged out successfully" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <AuthProvider initialUser={reviewer}>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>,
    );

    screen.getByRole("button", { name: /sign out/i }).click();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      expect(screen.getByRole("link", { name: /sign in/i })).toBeTruthy();
    });
  });
});
