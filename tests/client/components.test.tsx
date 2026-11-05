// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Navbar } from "../../client/src/components/Navbar";
import { ProtectedRoute } from "../../client/src/components/ProtectedRoute";
import { AuthProvider } from "../../client/src/context/AuthContext";
import LoginPage from "../../client/src/pages/Login";

describe("Frontend component tests: Authentication and Authorization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("TEST-COMP-01: Login form rendering and submission handling", () => {
    it("renders email and password inputs and a submit button", () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>,
      );

      expect(screen.getByLabelText(/email address/i)).toBeTruthy();
      expect(screen.getByLabelText(/password/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
    });

    it("displays validation error when submitting with empty fields", async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(
        await screen.findByText("Email and password are required."),
      ).toBeTruthy();
    });

    it("calls login endpoint and triggers callback on valid submission", async () => {
      const onLoginSuccess = vi.fn();
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@macau678.com",
        role: "REQUESTER" as const,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as any);

      render(
        <AuthProvider>
          <LoginPage onLoginSuccess={onLoginSuccess} />
        </AuthProvider>,
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "test@macau678.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "Password123!" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/auth/login",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ email: "test@macau678.com", password: "Password123!" }),
          }),
        );
        expect(onLoginSuccess).toHaveBeenCalledOnce();
      });
    });

    it("displays error message returned from server on failed authentication", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" }),
      } as any);

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>,
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "wrong@macau678.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "WrongPass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText("Invalid email or password")).toBeTruthy();
    });
  });

  describe("TEST-COMP-05: Dynamic navigation bar role rendering and route protection", () => {
    it("renders unauthenticated navigation with Sign In link", () => {
      render(
        <MemoryRouter>
          <AuthProvider initialUser={null}>
            <Navbar />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(screen.getByRole("link", { name: /sign in/i })).toBeTruthy();
      expect(screen.queryByText(/my requests/i)).toBeNull();
      expect(screen.queryByText(/review queue/i)).toBeNull();
    });

    it("renders Requester navigation items when user is authenticated as REQUESTER", () => {
      const requesterUser = {
        id: 1,
        name: "Alice Requester",
        email: "alice@macau678.com",
        role: "REQUESTER" as const,
      };

      render(
        <MemoryRouter>
          <AuthProvider initialUser={requesterUser}>
            <Navbar />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(screen.getByText("My Requests")).toBeTruthy();
      expect(screen.getByText("New Request")).toBeTruthy();
      expect(screen.queryByText("Review Queue")).toBeNull();
      expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();
    });

    it("renders Reviewer navigation items when user is authenticated as REVIEWER", () => {
      const reviewerUser = {
        id: 2,
        name: "Bob Reviewer",
        email: "bob@macau678.com",
        role: "REVIEWER" as const,
      };

      render(
        <MemoryRouter>
          <AuthProvider initialUser={reviewerUser}>
            <Navbar />
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(screen.getByText("Review Queue")).toBeTruthy();
      expect(screen.getByText("Reports")).toBeTruthy();
      expect(screen.queryByText("New Request")).toBeNull();
      expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();
    });

    it("redirects unauthenticated users attempting to access a protected route", () => {
      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <AuthProvider initialUser={null}>
            <Routes>
              <Route path="/login" element={<div>Login Page Target</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/protected" element={<div>Protected Content</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(screen.getByText("Login Page Target")).toBeTruthy();
      expect(screen.queryByText("Protected Content")).toBeNull();
    });

    it("blocks access and displays Access Denied when user role does not match route permission", () => {
      const requesterUser = {
        id: 1,
        name: "Alice Requester",
        email: "alice@macau678.com",
        role: "REQUESTER" as const,
      };

      render(
        <MemoryRouter initialEntries={["/reviewer-only"]}>
          <AuthProvider initialUser={requesterUser}>
            <Routes>
              <Route element={<ProtectedRoute allowedRoles={["REVIEWER"]} />}>
                <Route path="/reviewer-only" element={<div>Reviewer Only Secret Page</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(screen.getByText("Access Denied")).toBeTruthy();
      expect(screen.queryByText("Reviewer Only Secret Page")).toBeNull();
    });

    it("allows access to protected route when user role is authorized", () => {
      const reviewerUser = {
        id: 2,
        name: "Bob Reviewer",
        email: "bob@macau678.com",
        role: "REVIEWER" as const,
      };

      render(
        <MemoryRouter initialEntries={["/reviewer-only"]}>
          <AuthProvider initialUser={reviewerUser}>
            <Routes>
              <Route element={<ProtectedRoute allowedRoles={["REVIEWER"]} />}>
                <Route path="/reviewer-only" element={<div>Reviewer Only Secret Page</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      );

      expect(screen.getByText("Reviewer Only Secret Page")).toBeTruthy();
    });
  });

  it.todo("TEST-COMP-02: purchase request form and character counters");
  it.todo("TEST-COMP-03: review decision modal and mandatory reason enforcement");
  it.todo("TEST-COMP-04: history timeline presentation");
});
