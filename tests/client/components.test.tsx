// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Navbar } from "../../client/src/components/Navbar";
import { ProtectedRoute } from "../../client/src/components/ProtectedRoute";
import { ReviewDecisionModal } from "../../client/src/components/ReviewDecisionModal";
import { RequestHistoryTimeline } from "../../client/src/components/HistoryTimeline";
import CreateRequest from "../../client/src/pages/CreateRequest";
import EditRequest from "../../client/src/pages/EditRequest";
import { AuthProvider } from "../../client/src/context/AuthContext";
import LoginPage from "../../client/src/pages/Login";

describe("Frontend component tests: Authentication and Authorization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
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

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as any));

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
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" }),
      } as any));

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

  describe("TEST-COMP-02: Purchase request form and character counters (FEAT-03, FEAT-12, FR-02, NFR-02, AC-02)", () => {
    const mockReviewers = [
      { id: 2, name: "Bob Reviewer", email: "bob@macau678.com", role: "REVIEWER" as const },
    ];

    it("renders character counters and validates minimum title length", () => {
      render(
        <MemoryRouter>
          <CreateRequest initialReviewers={mockReviewers} />
        </MemoryRouter>,
      );

      const titleInput = screen.getByLabelText(/request title/i);
      expect(screen.getByText("0 / 150")).toBeTruthy();

      fireEvent.change(titleInput, { target: { value: "AB" } });
      expect(screen.getByText("2 / 150")).toBeTruthy();
      expect(
        screen.getByText(/title must be at least 3 characters/i),
      ).toBeTruthy();

      fireEvent.change(titleInput, { target: { value: "Valid Title Here" } });
      expect(screen.getByText("16 / 150")).toBeTruthy();
      expect(screen.queryByText(/title must be at least 3 characters/i)).toBeNull();
    });

    it("validates amount and disables submission until required fields are filled", () => {
      render(
        <MemoryRouter>
          <CreateRequest initialReviewers={mockReviewers} />
        </MemoryRouter>,
      );

      const draftButton = screen.getByRole("button", { name: /save as draft/i });
      const submitButton = screen.getByRole("button", { name: /submit for review/i });

      // Initially disabled
      expect(draftButton.hasAttribute("disabled")).toBe(true);
      expect(submitButton.hasAttribute("disabled")).toBe(true);

      // Enter invalid amount (0 or negative)
      const amountInput = screen.getByLabelText(/estimated amount/i);
      fireEvent.change(amountInput, { target: { value: "0" } });
      expect(
        screen.getByText(/amount must be a positive number greater than 0.00/i),
      ).toBeTruthy();

      // Enter valid fields
      fireEvent.change(screen.getByLabelText(/request title/i), {
        target: { value: "Ergonomic Chairs" },
      });
      fireEvent.change(amountInput, { target: { value: "450.00" } });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: "Five adjustable mesh chairs" },
      });
      fireEvent.change(screen.getByLabelText(/business justification/i), {
        target: { value: "Replaces broken lab chairs" },
      });

      // Buttons now enabled
      expect(draftButton.hasAttribute("disabled")).toBe(false);
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });

    it("validates description, justification, and upper bounds with live character counters", () => {
      render(
        <MemoryRouter>
          <CreateRequest initialReviewers={mockReviewers} />
        </MemoryRouter>,
      );

      const titleInput = screen.getByLabelText(/request title/i);
      const amountInput = screen.getByLabelText(/estimated amount/i);
      const descInput = screen.getByLabelText(/description/i);
      const justInput = screen.getByLabelText(/business justification/i);
      const submitButton = screen.getByRole("button", { name: /submit for review/i });

      expect(screen.getAllByText("0 / 2000")).toHaveLength(2);

      // Whitespace-only description and over-limit justification
      fireEvent.change(descInput, { target: { value: "   " } });
      expect(descInput.className).toContain("is-invalid");
      expect(screen.getByText(/description is required and must not exceed 2000 characters/i)).toBeTruthy();

      fireEvent.change(justInput, { target: { value: "J".repeat(2001) } });
      expect(justInput.className).toContain("is-invalid");
      expect(screen.getByText("2001 / 2000")).toBeTruthy();
      expect(
        screen.getByText(/business justification is required and must not exceed 2000 characters/i),
      ).toBeTruthy();

      // Amount with > 2 decimals or above max
      fireEvent.change(amountInput, { target: { value: "450.001" } });
      expect(amountInput.className).toContain("is-invalid");
      expect(submitButton.hasAttribute("disabled")).toBe(true);

      // Exact valid boundaries: 3-char title, 0.01 amount, 2000-char description and justification
      fireEvent.change(titleInput, { target: { value: "ABC" } });
      fireEvent.change(amountInput, { target: { value: "0.01" } });
      fireEvent.change(descInput, { target: { value: "D".repeat(2000) } });
      fireEvent.change(justInput, { target: { value: "J".repeat(2000) } });

      expect(screen.getByText("3 / 150")).toBeTruthy();
      expect(screen.getAllByText("2000 / 2000")).toHaveLength(2);
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });

    it("shows field-level validation errors and character counters on EditRequest including cleared fields and revision notes", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url: string) => {
          if (url.includes("/api/users/reviewers")) {
            return {
              ok: true,
              json: async () => ({ reviewers: mockReviewers }),
            } as any;
          }
          return {
            ok: true,
            json: async () => ({
              request: {
                id: 99,
                requestNumber: "PR-2026-00099",
                title: "Initial Valid Title",
                description: "Initial valid description",
                amount: "250.00",
                justification: "Initial valid justification",
                status: "DRAFT",
                requesterId: 1,
                reviewerId: 2,
                submittedAt: null,
                createdAt: "2026-11-28T00:00:00.000Z",
                updatedAt: "2026-11-28T00:00:00.000Z",
              },
            }),
          } as any;
        }),
      );

      render(
        <MemoryRouter initialEntries={["/requests/99/edit"]}>
          <Routes>
            <Route path="/requests/:id/edit" element={<EditRequest />} />
          </Routes>
        </MemoryRouter>,
      );

      const titleInput = await screen.findByLabelText(/request title/i);
      const amountInput = screen.getByLabelText(/estimated amount/i);
      const descInput = screen.getByLabelText(/description/i);
      const justInput = screen.getByLabelText(/business justification/i);
      const notesInput = screen.getByLabelText(/modification summary \/ revision notes/i);
      const saveDraftBtn = screen.getByRole("button", { name: /save draft/i });

      expect(screen.getByText("0 / 2000")).toBeTruthy();
      expect(saveDraftBtn.hasAttribute("disabled")).toBe(false);

      // Clearing pre-filled fields displays validation errors and invalid styling
      fireEvent.change(titleInput, { target: { value: "" } });
      fireEvent.change(amountInput, { target: { value: "" } });
      fireEvent.change(descInput, { target: { value: "" } });
      fireEvent.change(justInput, { target: { value: "" } });

      expect(titleInput.className).toContain("is-invalid");
      expect(amountInput.className).toContain("is-invalid");
      expect(descInput.className).toContain("is-invalid");
      expect(justInput.className).toContain("is-invalid");
      expect(screen.getByText(/title must be at least 3 characters/i)).toBeTruthy();
      expect(screen.getByText(/amount must be a positive number greater than 0.00/i)).toBeTruthy();
      expect(screen.getByText(/description is required and must not exceed 2000 characters/i)).toBeTruthy();
      expect(
        screen.getByText(/business justification is required and must not exceed 2000 characters/i),
      ).toBeTruthy();
      expect(saveDraftBtn.hasAttribute("disabled")).toBe(true);

      // Restore valid required fields, then exceed revision notes limit
      fireEvent.change(titleInput, { target: { value: "Valid Title" } });
      fireEvent.change(amountInput, { target: { value: "100.00" } });
      fireEvent.change(descInput, { target: { value: "Valid description" } });
      fireEvent.change(justInput, { target: { value: "Valid justification" } });
      expect(saveDraftBtn.hasAttribute("disabled")).toBe(false);

      fireEvent.change(notesInput, { target: { value: "N".repeat(2001) } });
      expect(notesInput.className).toContain("is-invalid");
      expect(screen.getByText("2001 / 2000")).toBeTruthy();
      expect(screen.getByText(/revision notes must not exceed 2000 characters/i)).toBeTruthy();
      expect(saveDraftBtn.hasAttribute("disabled")).toBe(true);
    });
  });

  describe("TEST-COMP-03: Review decision modal and mandatory reason enforcement (FEAT-07, FR-04, BR-05, AC-06)", () => {
    it("disables submit button on RETURN decision while reason is empty or whitespace", () => {
      render(<ReviewDecisionModal decision="RETURN" isOpen={true} />);

      const submitButton = screen.getByRole("button", { name: /confirm return/i });
      const reasonInput = screen.getByLabelText(/reason/i);

      expect(submitButton.hasAttribute("disabled")).toBe(true);

      // Typing whitespace keeps it disabled
      fireEvent.change(reasonInput, { target: { value: "    " } });
      expect(submitButton.hasAttribute("disabled")).toBe(true);

      // Providing valid reason enables submit
      fireEvent.change(reasonInput, {
        target: { value: "Item specification requires clarification." },
      });
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });

    it("disables submit button on REJECT decision while reason is empty", () => {
      render(<ReviewDecisionModal decision="REJECT" isOpen={true} />);

      const submitButton = screen.getByRole("button", { name: /confirm rejection/i });
      const reasonInput = screen.getByLabelText(/reason/i);

      expect(submitButton.hasAttribute("disabled")).toBe(true);

      fireEvent.change(reasonInput, {
        target: { value: "Budget exhausted for current fiscal quarter." },
      });
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });

    it("allows APPROVE decision without requiring a reason", () => {
      render(<ReviewDecisionModal decision="APPROVE" isOpen={true} />);

      const submitButton = screen.getByRole("button", { name: /confirm approval/i });
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });
  });

  describe("TEST-COMP-04: History timeline presentation (FEAT-09, FR-06, BR-08, AC-11)", () => {
    it("renders chronological entries with status badges, actor info, and decision notes", () => {
      const mockHistory = [
        {
          id: 1,
          requestId: 10,
          actorId: 1,
          action: "SUBMITTED" as const,
          fromStatus: null,
          toStatus: "PENDING_REVIEW",
          reason: "Initial submission",
          createdAt: "2026-11-06T10:00:00.000Z",
          actor: { id: 1, name: "Alice Requester", email: "alice@macau678.com", role: "REQUESTER" as const },
        },
        {
          id: 2,
          requestId: 10,
          actorId: 2,
          action: "RETURNED" as const,
          fromStatus: "PENDING_REVIEW",
          toStatus: "RETURNED",
          reason: "Please upload official vendor quotations.",
          createdAt: "2026-11-06T11:00:00.000Z",
          actor: { id: 2, name: "Bob Reviewer", email: "bob@macau678.com", role: "REVIEWER" as const },
        },
        {
          id: 3,
          requestId: 10,
          actorId: 2,
          action: "APPROVED" as const,
          fromStatus: "PENDING_REVIEW",
          toStatus: "APPROVED",
          reason: null,
          createdAt: "2026-11-06T12:00:00.000Z",
          actor: { id: 2, name: "Bob Reviewer", email: "bob@macau678.com", role: "REVIEWER" as const },
        },
      ];

      render(<RequestHistoryTimeline history={mockHistory} />);

      expect(screen.getByText("Alice Requester")).toBeTruthy();
      expect(screen.getByText("SUBMITTED")).toBeTruthy();
      expect(screen.getByText("RETURNED")).toBeTruthy();
      expect(screen.getByText("APPROVED")).toBeTruthy();
      expect(
        screen.getByText("Please upload official vendor quotations."),
      ).toBeTruthy();
    });

    it("renders WITHDRAWN status and history timeline badges (FR-05, FR-06, BR-08)", () => {
      const mockHistory = [
        {
          id: 5,
          requestId: 12,
          actorId: 1,
          action: "WITHDRAWN" as const,
          fromStatus: "PENDING_REVIEW",
          toStatus: "WITHDRAWN",
          reason: "Request withdrawn by requester",
          createdAt: "2026-11-27T10:00:00.000Z",
          actor: { id: 1, name: "Alice Requester", email: "alice@macau678.com", role: "REQUESTER" as const },
        },
      ];

      render(<RequestHistoryTimeline history={mockHistory} />);
      expect(screen.getByText("WITHDRAWN")).toBeTruthy();
      expect(screen.getByText("Request withdrawn by requester")).toBeTruthy();
    });

    it("renders empty state message when history array is empty", () => {
      render(<RequestHistoryTimeline history={[]} />);
      expect(screen.getByText(/no history entries recorded yet/i)).toBeTruthy();
    });
  });

  describe("EditRequest save and submit behavior (Draft, Pending Review, Returned)", () => {
    const baseReviewers = [
      { id: 2, name: "Bob Reviewer", email: "bob@macau678.com", role: "REVIEWER" as const },
    ];

    function makeRequest(status: "DRAFT" | "PENDING_REVIEW" | "RETURNED") {
      return {
        id: 42,
        requestNumber: "PR-2026-00042",
        title: "Office Monitor Upgrade",
        description: "Two 27-inch monitors for engineering workstation",
        amount: "600.00",
        justification: "Replaces flickering displays",
        status,
        requesterId: 1,
        reviewerId: 2,
        submittedAt: status === "DRAFT" ? null : "2026-11-27T09:00:00.000Z",
        createdAt: "2026-11-27T08:00:00.000Z",
        updatedAt: "2026-11-27T09:00:00.000Z",
      };
    }

    function renderEditRequest(requestId = 42) {
      return render(
        <MemoryRouter initialEntries={[`/requests/${requestId}/edit`]}>
          <Routes>
            <Route path="/requests/:id/edit" element={<EditRequest />} />
            <Route path="/requests/:id" element={<div>Request Detail Target</div>} />
          </Routes>
        </MemoryRouter>,
      );
    }

    it("saves and submits a DRAFT request when clicking Save & Submit for Review", async () => {
      const draftRequest = makeRequest("DRAFT");
      const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url === "/api/requests/42" && !init?.method) {
          return { ok: true, json: async () => ({ request: draftRequest }) };
        }
        if (url === "/api/users/reviewers") {
          return { ok: true, json: async () => ({ reviewers: baseReviewers }) };
        }
        if (url === "/api/requests/42" && init?.method === "PATCH") {
          return { ok: true, json: async () => ({ request: { ...draftRequest, amount: "650.00" } }) };
        }
        if (url === "/api/requests/42/submit" && init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({ request: { ...draftRequest, amount: "650.00", status: "PENDING_REVIEW" } }),
          };
        }
        throw new Error(`Unexpected fetch: ${init?.method || "GET"} ${url}`);
      });
      vi.stubGlobal("fetch", fetchMock);

      renderEditRequest();

      const submitBtn = await screen.findByRole("button", { name: "Save & Submit for Review" });
      fireEvent.change(screen.getByLabelText(/estimated amount/i), { target: { value: "650.00" } });
      fireEvent.click(submitBtn);

      expect(await screen.findByText("Request Detail Target")).toBeTruthy();

      const patchCalls = fetchMock.mock.calls.filter(
        ([url, init]) => url === "/api/requests/42" && init?.method === "PATCH",
      );
      const submitCalls = fetchMock.mock.calls.filter(
        ([url, init]) => url === "/api/requests/42/submit" && init?.method === "POST",
      );

      expect(patchCalls).toHaveLength(1);
      expect(submitCalls).toHaveLength(1);
      expect(JSON.parse(patchCalls[0][1].body)).toEqual(
        expect.objectContaining({
          title: "Office Monitor Upgrade",
          amount: 650,
          reviewerId: 2,
        }),
      );
    });

    it("updates a PENDING_REVIEW request without calling submit", async () => {
      const pendingRequest = makeRequest("PENDING_REVIEW");
      const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url === "/api/requests/42" && !init?.method) {
          return { ok: true, json: async () => ({ request: pendingRequest }) };
        }
        if (url === "/api/requests/42" && init?.method === "PATCH") {
          return {
            ok: true,
            json: async () => ({ request: { ...pendingRequest, amount: "700.00", status: "PENDING_REVIEW" } }),
          };
        }
        throw new Error(`Unexpected fetch: ${init?.method || "GET"} ${url}`);
      });
      vi.stubGlobal("fetch", fetchMock);

      renderEditRequest();

      const saveBtn = await screen.findByRole("button", { name: "Save Changes" });
      fireEvent.change(screen.getByLabelText(/estimated amount/i), { target: { value: "700.00" } });
      fireEvent.change(screen.getByLabelText(/modification summary/i), {
        target: { value: "Updated quote price" },
      });
      fireEvent.click(saveBtn);

      expect(await screen.findByText("Request Detail Target")).toBeTruthy();

      const patchCalls = fetchMock.mock.calls.filter(
        ([url, init]) => url === "/api/requests/42" && init?.method === "PATCH",
      );
      const submitCalls = fetchMock.mock.calls.filter(
        ([url, init]) => url === "/api/requests/42/submit" && init?.method === "POST",
      );

      expect(patchCalls).toHaveLength(1);
      expect(submitCalls).toHaveLength(0);
      expect(JSON.parse(patchCalls[0][1].body)).toEqual(
        expect.objectContaining({
          amount: 700,
          reason: "Updated quote price",
        }),
      );
    });

    it("saves and resubmits a RETURNED request when clicking Save & Resubmit for Review", async () => {
      const returnedRequest = makeRequest("RETURNED");
      const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url === "/api/requests/42" && !init?.method) {
          return { ok: true, json: async () => ({ request: returnedRequest }) };
        }
        if (url === "/api/users/reviewers") {
          return { ok: true, json: async () => ({ reviewers: baseReviewers }) };
        }
        if (url === "/api/requests/42" && init?.method === "PATCH") {
          return { ok: true, json: async () => ({ request: { ...returnedRequest, amount: "580.00" } }) };
        }
        if (url === "/api/requests/42/submit" && init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({ request: { ...returnedRequest, amount: "580.00", status: "PENDING_REVIEW" } }),
          };
        }
        throw new Error(`Unexpected fetch: ${init?.method || "GET"} ${url}`);
      });
      vi.stubGlobal("fetch", fetchMock);

      renderEditRequest();

      const resubmitBtn = await screen.findByRole("button", { name: "Save & Resubmit for Review" });
      fireEvent.change(screen.getByLabelText(/estimated amount/i), { target: { value: "580.00" } });
      fireEvent.change(screen.getByLabelText(/modification summary/i), {
        target: { value: "Attached vendor quote" },
      });
      fireEvent.click(resubmitBtn);

      expect(await screen.findByText("Request Detail Target")).toBeTruthy();

      const patchCalls = fetchMock.mock.calls.filter(
        ([url, init]) => url === "/api/requests/42" && init?.method === "PATCH",
      );
      const submitCalls = fetchMock.mock.calls.filter(
        ([url, init]) => url === "/api/requests/42/submit" && init?.method === "POST",
      );

      expect(patchCalls).toHaveLength(1);
      expect(submitCalls).toHaveLength(1);
      expect(JSON.parse(submitCalls[0][1].body)).toEqual({ reason: "Attached vendor quote" });
    });

    it("displays error feedback and stays on the edit page when submission fails", async () => {
      const draftRequest = makeRequest("DRAFT");
      const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url === "/api/requests/42" && !init?.method) {
          return { ok: true, json: async () => ({ request: draftRequest }) };
        }
        if (url === "/api/users/reviewers") {
          return { ok: true, json: async () => ({ reviewers: baseReviewers }) };
        }
        if (url === "/api/requests/42" && init?.method === "PATCH") {
          return { ok: true, json: async () => ({ request: draftRequest }) };
        }
        if (url === "/api/requests/42/submit" && init?.method === "POST") {
          return {
            ok: false,
            json: async () => ({ error: "Cannot submit request from current status" }),
          };
        }
        throw new Error(`Unexpected fetch: ${init?.method || "GET"} ${url}`);
      });
      vi.stubGlobal("fetch", fetchMock);

      renderEditRequest();

      const submitBtn = await screen.findByRole("button", { name: "Save & Submit for Review" });
      fireEvent.click(submitBtn);

      expect(await screen.findByText("Cannot submit request from current status")).toBeTruthy();
      expect(screen.queryByText("Request Detail Target")).toBeNull();
      expect(submitBtn.hasAttribute("disabled")).toBe(false);
    });

    it("prevents duplicate submissions on repeated clicks while saving", async () => {
      const draftRequest = makeRequest("DRAFT");
      let resolvePatch!: (value: any) => void;
      const patchPromise = new Promise((resolve) => {
        resolvePatch = resolve;
      });

      const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url === "/api/requests/42" && !init?.method) {
          return { ok: true, json: async () => ({ request: draftRequest }) };
        }
        if (url === "/api/users/reviewers") {
          return { ok: true, json: async () => ({ reviewers: baseReviewers }) };
        }
        if (url === "/api/requests/42" && init?.method === "PATCH") {
          return patchPromise;
        }
        if (url === "/api/requests/42/submit" && init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({ request: { ...draftRequest, status: "PENDING_REVIEW" } }),
          };
        }
        throw new Error(`Unexpected fetch: ${init?.method || "GET"} ${url}`);
      });
      vi.stubGlobal("fetch", fetchMock);

      renderEditRequest();

      const submitBtn = await screen.findByRole("button", { name: "Save & Submit for Review" });
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitBtn.hasAttribute("disabled")).toBe(true);
      });

      resolvePatch({ ok: true, json: async () => ({ request: draftRequest }) });

      expect(await screen.findByText("Request Detail Target")).toBeTruthy();

      const patchCalls = fetchMock.mock.calls.filter(
        ([url, init]) => url === "/api/requests/42" && init?.method === "PATCH",
      );
      const submitCalls = fetchMock.mock.calls.filter(
        ([url, init]) => url === "/api/requests/42/submit" && init?.method === "POST",
      );

      expect(patchCalls).toHaveLength(1);
      expect(submitCalls).toHaveLength(1);
    });
  });
});
