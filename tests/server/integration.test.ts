import { resolve } from "node:path";
import dotenv from "dotenv";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

dotenv.config({ path: resolve(process.cwd(), "server/.env") });

import { app } from "../../server/src/app";
import { disconnectPrisma, prisma } from "../../server/src/prisma";
import { COOKIE_NAME, createSessionToken, hashSessionToken } from "../../server/src/utils/auth";
import { resetAndSeedDatabase, type SeededTestRequests, type SeededTestUsers } from "../helpers/testDb";

describe("Integration and API tests: Authentication & Authorization", () => {
  let seededUsers: SeededTestUsers;
  let seededRequests: SeededTestRequests;

  beforeAll(async () => {
    const data = await resetAndSeedDatabase();
    seededUsers = data.users;
    seededRequests = data.requests;
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe("TEST-INT-01: User authentication, login, logout, and cookie lifecycle", () => {
    describe("A. Login Scenarios", () => {
      it("authenticates valid credentials, returns sanitized user, and sets HTTP-only cookie", async () => {
        const res = await request(app)
          .post("/api/auth/login")
          .send({
            email: seededUsers.requester1.email,
            password: seededUsers.requester1.password,
          });

        expect(res.status).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.id).toBe(seededUsers.requester1.id);
        expect(res.body.user.email).toBe(seededUsers.requester1.email);
        expect(res.body.user.role).toBe("REQUESTER");
        // Verify password hash is never exposed
        expect(res.body.user.passwordHash).toBeUndefined();
        expect(res.body.user.password).toBeUndefined();

        // Verify Set-Cookie header
        const setCookie = res.headers["set-cookie"];
        expect(setCookie).toBeDefined();
        const cookieString = Array.isArray(setCookie) ? setCookie[0] : setCookie;
        expect(cookieString).toContain(`${COOKIE_NAME}=`);
        expect(cookieString.toLowerCase()).toContain("httponly");
      });

      it("handles email case-insensitivity and whitespace trimming", async () => {
        const res = await request(app)
          .post("/api/auth/login")
          .send({
            email: `  ${seededUsers.requester1.email.toUpperCase()}  `,
            password: seededUsers.requester1.password,
          });

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(seededUsers.requester1.email);
      });

      it("rejects login with an incorrect password and does not issue a session cookie", async () => {
        const res = await request(app)
          .post("/api/auth/login")
          .send({
            email: seededUsers.requester1.email,
            password: "WrongPassword123!",
          });

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("INVALID_CREDENTIALS");
        expect(res.headers["set-cookie"]).toBeUndefined();
      });

      it("rejects login with an unknown email address", async () => {
        const res = await request(app)
          .post("/api/auth/login")
          .send({
            email: "nonexistent@macau678.com",
            password: "Password123!",
          });

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("INVALID_CREDENTIALS");
        expect(res.headers["set-cookie"]).toBeUndefined();
      });

      it("rejects login when required credentials are missing", async () => {
        const resNoPass = await request(app)
          .post("/api/auth/login")
          .send({ email: seededUsers.requester1.email });

        expect(resNoPass.status).toBe(400);
        expect(resNoPass.body.code).toBe("VALIDATION_ERROR");

        const resNoEmail = await request(app)
          .post("/api/auth/login")
          .send({ password: "Password123!" });

        expect(resNoEmail.status).toBe(400);
        expect(resNoEmail.body.code).toBe("VALIDATION_ERROR");
      });

      it("rejects login for inactive user accounts (Active User Validation)", async () => {
        const res = await request(app)
          .post("/api/auth/login")
          .send({
            email: seededUsers.inactiveUser.email,
            password: seededUsers.inactiveUser.password,
          });

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("INVALID_CREDENTIALS");
        expect(res.headers["set-cookie"]).toBeUndefined();
      });
    });

    describe("B. Logout Scenarios", () => {
      it("clears the session cookie on successful logout", async () => {
        const loginRes = await request(app)
          .post("/api/auth/login")
          .send({
            email: seededUsers.requester1.email,
            password: seededUsers.requester1.password,
          });
        const cookie = loginRes.headers["set-cookie"][0];

        const logoutRes = await request(app)
          .post("/api/auth/logout")
          .set("Cookie", cookie);

        expect(logoutRes.status).toBe(200);
        expect(logoutRes.body.message).toContain("Logged out");

        const clearedCookie = logoutRes.headers["set-cookie"][0];
        expect(clearedCookie).toContain(`${COOKIE_NAME}=;`);
      });

      it("allows logout without an active session (idempotent)", async () => {
        const res = await request(app).post("/api/auth/logout");
        expect(res.status).toBe(200);
      });

      it("prevents accessing protected endpoints using a cleared/logged-out session", async () => {
        const loginRes = await request(app)
          .post("/api/auth/login")
          .send({
            email: seededUsers.requester1.email,
            password: seededUsers.requester1.password,
          });
        const loginCookie = loginRes.headers["set-cookie"][0];

        const logoutRes = await request(app)
          .post("/api/auth/logout")
          .set("Cookie", loginCookie);
        const expiredCookie = logoutRes.headers["set-cookie"][0];

        const meRes = await request(app)
          .get("/api/auth/me")
          .set("Cookie", expiredCookie);

        expect(meRes.status).toBe(401);
      });
    });

    describe("C. Current User & Token Validation", () => {
      it("returns authenticated Requester profile with no sensitive data", async () => {
        const loginRes = await request(app)
          .post("/api/auth/login")
          .send({
            email: seededUsers.requester1.email,
            password: seededUsers.requester1.password,
          });
        const cookie = loginRes.headers["set-cookie"][0];

        const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.body.user).toEqual({
          id: seededUsers.requester1.id,
          name: seededUsers.requester1.name,
          email: seededUsers.requester1.email,
          role: "REQUESTER",
        });
        expect(res.body.user.passwordHash).toBeUndefined();
      });

      it("returns authenticated Reviewer profile", async () => {
        const loginRes = await request(app)
          .post("/api/auth/login")
          .send({
            email: seededUsers.reviewer1.email,
            password: seededUsers.reviewer1.password,
          });
        const cookie = loginRes.headers["set-cookie"][0];

        const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe("REVIEWER");
      });

      it("rejects invalid or malformed session tokens", async () => {
        const res = await request(app)
          .get("/api/auth/me")
          .set("Cookie", `${COOKIE_NAME}=malformed.jwt.token; Path=/`);

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("INVALID_AUTH");
      });

      it("rejects session tokens that are not stored in the database", async () => {
        const forgedToken = createSessionToken();
        const res = await request(app)
          .get("/api/auth/me")
          .set("Cookie", `${COOKIE_NAME}=${forgedToken}; Path=/`);

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("INVALID_AUTH");
      });

      it("rejects access if user is deactivated after token was issued (Active User Check on Request)", async () => {
        const tempUser = await prisma.user.create({
          data: {
            email: "temp.active@macau678.com",
            name: "Temp User",
            role: "REQUESTER",
            passwordHash: "dummyHash",
            isActive: true,
          },
        });

        const token = createSessionToken();
        await prisma.session.create({
          data: { id: hashSessionToken(token), userId: tempUser.id, expiresAt: new Date(Date.now() + 60_000) },
        });

        await prisma.user.update({
          where: { id: tempUser.id },
          data: { isActive: false },
        });

        const res = await request(app)
          .get("/api/auth/me")
          .set("Cookie", `${COOKIE_NAME}=${token}; Path=/`);

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("AUTH_REQUIRED");
      });
    });
  });

  describe("TEST-INT-02: Authentication guards and unauthenticated rejection", () => {
    it("rejects unauthenticated requests to protected endpoints with HTTP 401", async () => {
      const endpoints = [
        { method: "get", path: "/api/auth/me" },
        { method: "get", path: "/api/health/requester" },
        { method: "get", path: "/api/health/reviewer" },
        { method: "get", path: "/api/requests" },
        { method: "get", path: `/api/requests/${seededRequests.request1.id}` },
        { method: "post", path: `/api/requests/${seededRequests.request1.id}/review` },
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.path);
        expect(res.status, `Expected 401 for ${ep.method.toUpperCase()} ${ep.path}`).toBe(401);
        expect(res.body.code).toBe("AUTH_REQUIRED");
      }
    });

    it("allows each role to access its health endpoint and denies the other role", async () => {
      const requesterLogin = await request(app)
        .post("/api/auth/login")
        .send({
          email: seededUsers.requester1.email,
          password: seededUsers.requester1.password,
        });
      const requesterCookie = requesterLogin.headers["set-cookie"][0];
      const requesterHealth = await request(app)
        .get("/api/health/requester")
        .set("Cookie", requesterCookie);
      const requesterDenied = await request(app)
        .get("/api/health/reviewer")
        .set("Cookie", requesterCookie);

      expect(requesterHealth.status).toBe(200);
      expect(requesterHealth.body).toEqual({
        role: "REQUESTER",
        status: "ok",
        database: "connected",
      });
      expect(requesterDenied.status).toBe(403);
      expect(requesterDenied.body.code).toBe("ACCESS_DENIED");
      expect(requesterDenied.body.error).toBe(
        "Reviewer health endpoint is only accessible to users with the REVIEWER role.",
      );

      const reviewerLogin = await request(app)
        .post("/api/auth/login")
        .send({
          email: seededUsers.reviewer1.email,
          password: seededUsers.reviewer1.password,
        });
      const reviewerCookie = reviewerLogin.headers["set-cookie"][0];
      const reviewerHealth = await request(app)
        .get("/api/health/reviewer")
        .set("Cookie", reviewerCookie);
      const reviewerDenied = await request(app)
        .get("/api/health/requester")
        .set("Cookie", reviewerCookie);

      expect(reviewerHealth.status).toBe(200);
      expect(reviewerHealth.body).toEqual({
        role: "REVIEWER",
        status: "ok",
        database: "connected",
      });
      expect(reviewerDenied.status).toBe(403);
      expect(reviewerDenied.body.code).toBe("ACCESS_DENIED");
      expect(reviewerDenied.body.error).toBe(
        "Requester health endpoint is only accessible to users with the REQUESTER role.",
      );
    });
  });

  describe("TEST-INT-04: Requester data isolation and cross-access blocking (BR-09, AC-03, AC-10)", () => {
    it("allows a requester to view only their own requests", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app).get("/api/requests").set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.requests)).toBe(true);
      for (const reqItem of res.body.requests) {
        expect(reqItem.requesterId).toBe(seededUsers.requester1.id);
      }
    });

    it("blocks a requester from viewing another requester's request by ID (BR-09, AC-10)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .get(`/api/requests/${seededRequests.request2.id}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("ACCESS_DENIED");
    });
  });

  describe("TEST-INT-05: Reviewer queue scoping and assignment isolation (BR-04, AC-04, AC-09)", () => {
    it("allows a reviewer to view only requests assigned to their ID in queue", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app).get("/api/requests").set("Cookie", cookie);
      expect(res.status).toBe(200);
      for (const reqItem of res.body.requests) {
        expect(reqItem.reviewerId).toBe(seededUsers.reviewer1.id);
      }
    });

    it("blocks a reviewer from viewing requests assigned to another reviewer (BR-04, AC-09)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .get(`/api/requests/${seededRequests.request2.id}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("ACCESS_DENIED");
    });
  });

  describe("TEST-INT-06: Authorization rules and review decisions (BR-03, BR-04, BR-05, AC-05, AC-06, AC-08, AC-09)", () => {
    it("blocks a Requester from performing review operations (Role Boundary)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post(`/api/requests/${seededRequests.request1.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "APPROVE" });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("ACCESS_DENIED");
    });

    it("blocks a user from reviewing or approving their own purchase request (BR-03, AC-08)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post(`/api/requests/${seededRequests.selfReviewRequest.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "APPROVE" });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("SELF_REVIEW_FORBIDDEN");
    });

    it("blocks a Reviewer from reviewing requests assigned to a different reviewer (BR-04, AC-09)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post(`/api/requests/${seededRequests.request2.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "APPROVE" });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("ACCESS_DENIED");
    });

    it("rejects REJECT decision on the API when reason is missing or empty (BR-05, AC-06)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      // Missing reason
      const resNoReason = await request(app)
        .post(`/api/requests/${seededRequests.requestForReject.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "REJECT" });

      expect(resNoReason.status).toBe(400);
      expect(resNoReason.body.code).toBe("VALIDATION_ERROR");

      // Whitespace reason
      const resWhitespace = await request(app)
        .post(`/api/requests/${seededRequests.requestForReject.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "REJECT", reason: "   " });

      expect(resWhitespace.status).toBe(400);
      expect(resWhitespace.body.code).toBe("VALIDATION_ERROR");
    });

    it("rejects RETURN decision on the API when reason is missing or empty (BR-05, AC-06)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      // Missing reason
      const resNoReason = await request(app)
        .post(`/api/requests/${seededRequests.requestForReturn.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "RETURN" });

      expect(resNoReason.status).toBe(400);
      expect(resNoReason.body.code).toBe("VALIDATION_ERROR");

      // Whitespace reason
      const resWhitespace = await request(app)
        .post(`/api/requests/${seededRequests.requestForReturn.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "RETURN", reason: "   " });

      expect(resWhitespace.status).toBe(400);
      expect(resWhitespace.body.code).toBe("VALIDATION_ERROR");
    });

    it("allows assigned Reviewer to execute REJECT with valid reason and records history (AC-06)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post(`/api/requests/${seededRequests.requestForReject.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "REJECT", reason: "Budget exhausted for current fiscal year." });

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe("REJECTED");

      const history = await prisma.requestHistory.findFirst({
        where: { requestId: seededRequests.requestForReject.id, action: "REJECTED" },
      });
      expect(history).toBeDefined();
      expect(history?.reason).toBe("Budget exhausted for current fiscal year.");
      expect(history?.actorId).toBe(seededUsers.reviewer1.id);
    });

    it("allows assigned Reviewer to execute RETURN with valid reason and records history (AC-06)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post(`/api/requests/${seededRequests.requestForReturn.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "RETURN", reason: "Please upload official quote before approval." });

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe("RETURNED");

      const history = await prisma.requestHistory.findFirst({
        where: { requestId: seededRequests.requestForReturn.id, action: "RETURNED" },
      });
      expect(history).toBeDefined();
      expect(history?.reason).toBe("Please upload official quote before approval.");
      expect(history?.actorId).toBe(seededUsers.reviewer1.id);
    });

    it("allows assigned Reviewer to execute APPROVE without requiring a reason (AC-05)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post(`/api/requests/${seededRequests.request1.id}/review`)
        .set("Cookie", cookie)
        .send({ decision: "APPROVE" });

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe("APPROVED");

      const history = await prisma.requestHistory.findFirst({
        where: { requestId: seededRequests.request1.id, action: "APPROVED" },
      });
      expect(history).toBeDefined();
      expect(history?.actorId).toBe(seededUsers.reviewer1.id);
    });
  });

  describe("TEST-INT-03: Purchase request creation and reviewer assignment (FEAT-03, FEAT-04, FR-02, FR-07, BR-01, BR-02, BR-10, AC-02)", () => {
    it("allows authenticated requester to create and submit purchase request with reviewer assignment", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "Lab Equipment Renewal",
          description: "Precision multimeter and signal generator for lab benches",
          amount: 450.0,
          justification: "Existing equipment damaged and out of calibration",
          reviewerId: seededUsers.reviewer1.id,
          status: "PENDING_REVIEW",
        });

      expect(res.status).toBe(201);
      const reqData = res.body.request || res.body;
      expect(reqData.id).toBeDefined();
      expect(reqData.requestNumber).toMatch(/^PR-\d{4}-\d{5}$/);
      expect(reqData.status).toBe("PENDING_REVIEW");
      expect(reqData.requesterId).toBe(seededUsers.requester1.id);
      expect(reqData.reviewerId).toBe(seededUsers.reviewer1.id);

      const dbRecord = await prisma.purchaseRequest.findUnique({
        where: { id: reqData.id },
      });
      expect(dbRecord).toBeDefined();
      expect(dbRecord?.title).toBe("Lab Equipment Renewal");
      expect(dbRecord?.status).toBe("PENDING_REVIEW");

      const history = await prisma.requestHistory.findFirst({
        where: { requestId: reqData.id, action: "SUBMITTED" },
      });
      expect(history).toBeDefined();
      expect(history?.actorId).toBe(seededUsers.requester1.id);
      expect(history?.toStatus).toBe("PENDING_REVIEW");
    });

    it("allows saving a request as DRAFT without immediate submission", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "Draft Stationeries",
          description: "Notebooks and dry erase markers",
          amount: 75.5,
          justification: "Classroom lecture tools",
          reviewerId: seededUsers.reviewer1.id,
          status: "DRAFT",
        });

      expect(res.status).toBe(201);
      const reqData = res.body.request || res.body;
      expect(reqData.status).toBe("DRAFT");
      expect(reqData.submittedAt).toBeNull();

      const history = await prisma.requestHistory.findFirst({
        where: { requestId: reqData.id, action: "CREATED" },
      });
      expect(history).toBeDefined();
      expect(history?.toStatus).toBe("DRAFT");
    });

    it("retrieves active reviewers list via GET /api/users/reviewers", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app).get("/api/users/reviewers").set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reviewers)).toBe(true);
      expect(res.body.reviewers.length).toBeGreaterThanOrEqual(2);
      for (const rev of res.body.reviewers) {
        expect(rev.role).toBe("REVIEWER");
      }
    });

    it("rejects creation when assigned reviewer is invalid or inactive", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "Invalid Reviewer Request",
          description: "Testing invalid reviewer",
          amount: 100.0,
          justification: "Testing",
          reviewerId: 999999,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("rejects creation when required fields fail boundary validations", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      // Missing/short title (< 3 chars)
      const resShortTitle = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "AB",
          description: "Valid description",
          amount: 100.0,
          justification: "Valid justification",
          reviewerId: seededUsers.reviewer1.id,
        });
      expect(resShortTitle.status).toBe(400);

      // Non-positive amount
      const resZeroAmount = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "Valid Title",
          description: "Valid description",
          amount: 0,
          justification: "Valid justification",
          reviewerId: seededUsers.reviewer1.id,
        });
      expect(resZeroAmount.status).toBe(400);
    });
  });

  describe("TEST-INT-07: Request modification and resubmission enforcement (FEAT-08, FR-05, BR-06, BR-07, AC-07)", () => {
    it("blocks editing requests that are currently in PENDING_REVIEW status (BR-06)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .patch(`/api/requests/${seededRequests.request1.id}`)
        .set("Cookie", cookie)
        .send({ amount: 999.0 });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("INVALID_STATE_TRANSITION");
    });

    it("permits editing and resubmitting a RETURNED request", async () => {
      // 1. Create a request and submit it
      const requesterLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const requesterCookie = requesterLogin.headers["set-cookie"][0];

      const createRes = await request(app)
        .post("/api/requests")
        .set("Cookie", requesterCookie)
        .send({
          title: "Request for Quotation Edit",
          description: "Initial description",
          amount: 500.0,
          justification: "Initial justification",
          reviewerId: seededUsers.reviewer1.id,
          status: "PENDING_REVIEW",
        });
      expect(createRes.status).toBe(201);
      const targetReqId = (createRes.body.request || createRes.body).id;

      // 2. Reviewer returns the request
      const reviewerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const reviewerCookie = reviewerLogin.headers["set-cookie"][0];

      const returnRes = await request(app)
        .post(`/api/requests/${targetReqId}/review`)
        .set("Cookie", reviewerCookie)
        .send({ decision: "RETURN", reason: "Please upload vendor quotes" });
      expect(returnRes.status).toBe(200);
      expect(returnRes.body.request.status).toBe("RETURNED");

      // 3. Requester edits the RETURNED request
      const editRes = await request(app)
        .patch(`/api/requests/${targetReqId}`)
        .set("Cookie", requesterCookie)
        .send({
          amount: 550.0,
          justification: "Vendor quotation attached: $550",
          reason: "Updated amount based on revised quote",
        });

      expect(editRes.status).toBe(200);
      expect(editRes.body.request.status).toBe("RETURNED");

      // 4. Requester resubmits the request
      const submitRes = await request(app)
        .post(`/api/requests/${targetReqId}/submit`)
        .set("Cookie", requesterCookie)
        .send({ reason: "Resubmitting with attached quotation" });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.request.status).toBe("PENDING_REVIEW");

      // 5. Verify RequestHistory contains EDITED and RESUBMITTED
      const editHistory = await prisma.requestHistory.findFirst({
        where: { requestId: targetReqId, action: "EDITED" },
      });
      expect(editHistory).toBeDefined();

      const resubmitHistory = await prisma.requestHistory.findFirst({
        where: { requestId: targetReqId, action: "RESUBMITTED" },
      });
      expect(resubmitHistory).toBeDefined();
      expect(resubmitHistory?.toStatus).toBe("PENDING_REVIEW");
    });
  });

  describe("TEST-INT-08: Complete audit history persistence (FEAT-09, FR-06, BR-08, AC-11, NFR-04)", () => {
    it("retrieves full chronological audit history for an authorized user", async () => {
      const requesterLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const requesterCookie = requesterLogin.headers["set-cookie"][0];

      // Create a request with multiple lifecycle steps to verify history
      const createRes = await request(app)
        .post("/api/requests")
        .set("Cookie", requesterCookie)
        .send({
          title: "History Audit Test Request",
          description: "Full lifecycle tracking test",
          amount: 120.0,
          justification: "Audit verification",
          reviewerId: seededUsers.reviewer1.id,
          status: "PENDING_REVIEW",
        });
      const reqId = (createRes.body.request || createRes.body).id;

      // Reviewer approves request
      const reviewerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const reviewerCookie = reviewerLogin.headers["set-cookie"][0];

      await request(app)
        .post(`/api/requests/${reqId}/review`)
        .set("Cookie", reviewerCookie)
        .send({ decision: "APPROVE" });

      const res = await request(app)
        .get(`/api/requests/${reqId}/history`)
        .set("Cookie", requesterCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.history.length).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < res.body.history.length; i++) {
        const item = res.body.history[i];
        expect(item.action).toBeDefined();
        expect(item.actorId).toBeDefined();
        expect(item.createdAt).toBeDefined();
        if (i > 0) {
          const prevTime = new Date(res.body.history[i - 1].createdAt).getTime();
          const currTime = new Date(item.createdAt).getTime();
          expect(currTime).toBeGreaterThanOrEqual(prevTime);
        }
      }
    });

    it("blocks unauthorized users from viewing audit history (BR-09, AC-10)", async () => {
      // Requester 2 attempting to view history of Request 1 (owned by Requester 1)
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester2.email, password: seededUsers.requester2.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .get(`/api/requests/${seededRequests.request1.id}/history`)
        .set("Cookie", cookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("ACCESS_DENIED");
    });
  });

  // Sprint 2/3 reporting tests preserved as todo
  it.todo("TEST-INT-09: request filtering by status and date range");
  it.todo("TEST-INT-10: reporting summary aggregation endpoint");
});
