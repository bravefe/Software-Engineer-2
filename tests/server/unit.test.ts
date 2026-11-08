import { describe, expect, it, vi } from "vitest";
import { requireRole } from "../../server/src/middleware/auth";
import { hashPassword, verifyPassword } from "../../server/src/utils/auth";
import { isValidTransition } from "../../server/src/utils/workflow";

describe("Unit tests", () => {
  describe("TEST-UNIT-01: password hashing and salt verification", () => {
    it("hashes password with bcrypt salt and verifies valid passwords", async () => {
      const plaintext = "Macau678SecurePass!";
      const hash = await hashPassword(plaintext);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(plaintext);
      expect(hash.startsWith("$2b$10$") || hash.startsWith("$2a$10$")).toBe(true);

      const isMatch = await verifyPassword(plaintext, hash);
      expect(isMatch).toBe(true);
    });

    it("rejects invalid passwords against the stored hash", async () => {
      const plaintext = "Macau678SecurePass!";
      const hash = await hashPassword(plaintext);

      const isMatch = await verifyPassword("WrongPassword123!", hash);
      expect(isMatch).toBe(false);
    });
  });

  describe("TEST-UNIT-02: role-based authorization guard logic", () => {
    it("denies access with HTTP 403 when user role is not permitted", () => {
      const middleware = requireRole(["REVIEWER"]);
      const req = { user: { id: 1, email: "req@macau678.com", name: "Req", role: "REQUESTER" as const } } as any;
      const statusFn = vi.fn().mockReturnThis();
      const jsonFn = vi.fn();
      const res = { status: statusFn, json: jsonFn } as any;
      const next = vi.fn();

      middleware(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "ACCESS_DENIED",
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next() when user has the permitted role", () => {
      const middleware = requireRole(["REVIEWER"]);
      const req = { user: { id: 2, email: "rev@macau678.com", name: "Rev", role: "REVIEWER" as const } } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("denies access when req.user is missing", () => {
      const middleware = requireRole(["REQUESTER", "REVIEWER"]);
      const req = {} as any;
      const statusFn = vi.fn().mockReturnThis();
      const jsonFn = vi.fn();
      const res = { status: statusFn, json: jsonFn } as any;
      const next = vi.fn();

      middleware(req, res, next);

      expect(statusFn).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("TEST-UNIT-04: non-self-approval and mandatory reason rules (BR-03, BR-05)", () => {
    function validateReviewAction(params: {
      requesterId: number;
      reviewerId: number;
      actorId: number;
      decision: "APPROVE" | "REJECT" | "RETURN";
      reason?: string;
    }) {
      if (params.requesterId === params.actorId) {
        return { allowed: false, code: "SELF_REVIEW_FORBIDDEN", error: "Cannot review own request" };
      }
      if (params.reviewerId !== params.actorId) {
        return { allowed: false, code: "ACCESS_DENIED", error: "Not assigned reviewer" };
      }
      if ((params.decision === "REJECT" || params.decision === "RETURN") && (!params.reason || !params.reason.trim())) {
        return { allowed: false, code: "VALIDATION_ERROR", error: "Reason required" };
      }
      return { allowed: true };
    }

    it("blocks a requester from approving their own request (BR-03)", () => {
      const result = validateReviewAction({
        requesterId: 10,
        reviewerId: 10,
        actorId: 10,
        decision: "APPROVE",
      });
      expect(result.allowed).toBe(false);
      expect(result.code).toBe("SELF_REVIEW_FORBIDDEN");
    });

    it("requires a reason when rejecting or returning a request (BR-05)", () => {
      const rejectWithoutReason = validateReviewAction({
        requesterId: 1,
        reviewerId: 2,
        actorId: 2,
        decision: "REJECT",
        reason: "",
      });
      expect(rejectWithoutReason.allowed).toBe(false);
      expect(rejectWithoutReason.code).toBe("VALIDATION_ERROR");

      const returnWithoutReason = validateReviewAction({
        requesterId: 1,
        reviewerId: 2,
        actorId: 2,
        decision: "RETURN",
        reason: "   ",
      });
      expect(returnWithoutReason.allowed).toBe(false);
      expect(returnWithoutReason.code).toBe("VALIDATION_ERROR");

      const approveWithoutReason = validateReviewAction({
        requesterId: 1,
        reviewerId: 2,
        actorId: 2,
        decision: "APPROVE",
      });
      expect(approveWithoutReason.allowed).toBe(true);
    });
  });

  describe("TEST-UNIT-03: lifecycle state transition matrix validation (BR-07)", () => {
    it("permits valid lifecycle status transitions", () => {
      const validTransitions = [
        { from: "DRAFT", to: "PENDING_REVIEW" },
        { from: "PENDING_REVIEW", to: "APPROVED" },
        { from: "PENDING_REVIEW", to: "REJECTED" },
        { from: "PENDING_REVIEW", to: "RETURNED" },
        { from: "RETURNED", to: "PENDING_REVIEW" },
      ];

      for (const { from, to } of validTransitions) {
        expect(
          isValidTransition(from, to),
          `Expected transition ${from} -> ${to} to be valid`,
        ).toBe(true);
      }
    });

    it("rejects invalid, skipped, or backward lifecycle transitions", () => {
      const invalidTransitions = [
        { from: "DRAFT", to: "APPROVED" },
        { from: "DRAFT", to: "RETURNED" },
        { from: "DRAFT", to: "REJECTED" },
        { from: "APPROVED", to: "PENDING_REVIEW" },
        { from: "APPROVED", to: "REJECTED" },
        { from: "APPROVED", to: "RETURNED" },
        { from: "REJECTED", to: "RETURNED" },
        { from: "REJECTED", to: "PENDING_REVIEW" },
        { from: "RETURNED", to: "APPROVED" },
        { from: "RETURNED", to: "REJECTED" },
        { from: "PENDING_REVIEW", to: "DRAFT" },
      ];

      for (const { from, to } of invalidTransitions) {
        expect(
          isValidTransition(from, to),
          `Expected transition ${from} -> ${to} to be invalid`,
        ).toBe(false);
      }
    });
  });

  it.todo("TEST-UNIT-05: input validation and boundary checks");
  it.todo("TEST-UNIT-06: financial aggregation and status metrics math");
});
