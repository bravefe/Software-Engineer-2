import { resolve } from "node:path";
import dotenv from "dotenv";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

dotenv.config({ path: resolve(process.cwd(), "server/.env") });

import { app } from "../../server/src/app";
import { disconnectPrisma, prisma } from "../../server/src/prisma";
import { COOKIE_NAME, createSessionToken, hashPassword, hashSessionToken } from "../../server/src/utils/auth";
import { resetAndSeedDatabase, type SeededTestRequests, type SeededTestUsers } from "../helpers/testDb";

describe("Integration and API tests: Authentication & Authorization", () => {
  let seededUsers: SeededTestUsers;
  let seededRequests: SeededTestRequests;

  beforeAll(async () => {
    const data = await resetAndSeedDatabase();
    seededUsers = data.users;
    seededRequests = data.requests;
  });

  async function createPendingRequest(title: string): Promise<number> {
    const requesterLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
    expect(requesterLogin.status).toBe(200);

    const response = await request(app)
      .post("/api/requests")
      .set("Cookie", requesterLogin.headers["set-cookie"][0])
      .send({
        title,
        description: "Integration test request",
        amount: 100,
        justification: "Isolated test fixture",
        reviewerId: seededUsers.reviewer1.id,
      });

    expect(response.status).toBe(201);
    const created = response.body.request || response.body;
    expect(created.status).toBe("PENDING_REVIEW");
    return created.id;
  }

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
      const missingReasonRequestId = await createPendingRequest("Reject Missing Reason");
      const whitespaceReasonRequestId = await createPendingRequest("Reject Whitespace Reason");

      // Missing reason
      const resNoReason = await request(app)
        .post(`/api/requests/${missingReasonRequestId}/review`)
        .set("Cookie", cookie)
        .send({ decision: "REJECT" });

      expect(resNoReason.status).toBe(400);
      expect(resNoReason.body.code).toBe("VALIDATION_ERROR");

      // Whitespace reason
      const resWhitespace = await request(app)
        .post(`/api/requests/${whitespaceReasonRequestId}/review`)
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
      const missingReasonRequestId = await createPendingRequest("Return Missing Reason");
      const whitespaceReasonRequestId = await createPendingRequest("Return Whitespace Reason");

      // Missing reason
      const resNoReason = await request(app)
        .post(`/api/requests/${missingReasonRequestId}/review`)
        .set("Cookie", cookie)
        .send({ decision: "RETURN" });

      expect(resNoReason.status).toBe(400);
      expect(resNoReason.body.code).toBe("VALIDATION_ERROR");

      // Whitespace reason
      const resWhitespace = await request(app)
        .post(`/api/requests/${whitespaceReasonRequestId}/review`)
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
      const requestId = await createPendingRequest("Valid Reject Reason");

      const res = await request(app)
        .post(`/api/requests/${requestId}/review`)
        .set("Cookie", cookie)
        .send({ decision: "REJECT", reason: "Budget exhausted for current fiscal year." });

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe("REJECTED");

      const history = await prisma.requestHistory.findFirst({
        where: { requestId, action: "REJECTED" },
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
      const requestId = await createPendingRequest("Valid Return Reason");

      const res = await request(app)
        .post(`/api/requests/${requestId}/review`)
        .set("Cookie", cookie)
        .send({ decision: "RETURN", reason: "Please upload official quote before approval." });

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe("RETURNED");

      const history = await prisma.requestHistory.findFirst({
        where: { requestId, action: "RETURNED" },
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
      const requestId = await createPendingRequest("Valid Approval");

      const res = await request(app)
        .post(`/api/requests/${requestId}/review`)
        .set("Cookie", cookie)
        .send({ decision: "APPROVE" });

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe("APPROVED");

      const history = await prisma.requestHistory.findFirst({
        where: { requestId, action: "APPROVED" },
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

      const requesterHistory = await request(app)
        .get(`/api/requests/${reqData.id}/history`)
        .set("Cookie", cookie);
      expect(requesterHistory.body.history.map(({ action }: { action: string }) => action)).toEqual(["CREATED", "SUBMITTED"]);
      expect(requesterHistory.body.history[0].toStatus).toBeNull();

      const reviewerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const reviewerHistory = await request(app)
        .get(`/api/requests/${reqData.id}/history`)
        .set("Cookie", reviewerLogin.headers["set-cookie"][0]);
      expect(reviewerHistory.body.history.map(({ action }: { action: string }) => action)).toEqual(["SUBMITTED"]);
      expect(reviewerHistory.body.history[0].fromStatus).toBeNull();
      expect(reviewerHistory.body.history[0].toStatus).toBe("PENDING_REVIEW");
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

    it("keeps drafts private to the requester in lists, detail, and history", async () => {
      const requesterCookie = (await request(app).post("/api/auth/login").send({
        email: seededUsers.requester1.email, password: seededUsers.requester1.password,
      })).headers["set-cookie"][0];
      const assignedCookie = (await request(app).post("/api/auth/login").send({
        email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password,
      })).headers["set-cookie"][0];
      const unassignedCookie = (await request(app).post("/api/auth/login").send({
        email: seededUsers.reviewer2.email, password: seededUsers.reviewer2.password,
      })).headers["set-cookie"][0];
      const created = await request(app).post("/api/requests").set("Cookie", requesterCookie).send({
        title: "Private Draft Visibility", description: "Draft detail", amount: 10,
        justification: "Draft justification", reviewerId: seededUsers.reviewer1.id, status: "DRAFT",
      });
      const draftId = created.body.request.id;

      const requesterList = await request(app).get("/api/requests").set("Cookie", requesterCookie);
      expect(requesterList.body.requests.some((item: { id: number }) => item.id === draftId)).toBe(true);
      for (const cookie of [assignedCookie, unassignedCookie]) {
        const list = await request(app).get("/api/requests").set("Cookie", cookie);
        expect(list.body.requests.some((item: { id: number }) => item.id === draftId)).toBe(false);
        const detail = await request(app).get(`/api/requests/${draftId}`).set("Cookie", cookie);
        expect(detail.status).toBe(403);
        expect(detail.body.code).toBe("ACCESS_DENIED");
        const history = await request(app).get(`/api/requests/${draftId}/history`).set("Cookie", cookie);
        expect(history.status).toBe(403);
      }

      const requesterHistory = await request(app).get(`/api/requests/${draftId}/history`).set("Cookie", requesterCookie);
      expect(requesterHistory.status).toBe(200);
      expect(requesterHistory.body.history.map(({ action }: { action: string }) => action)).toEqual(["CREATED"]);
    });

    it("shows reviewers SUBMITTED but not CREATED after a draft is submitted", async () => {
      const requesterCookie = (await request(app).post("/api/auth/login").send({
        email: seededUsers.requester1.email, password: seededUsers.requester1.password,
      })).headers["set-cookie"][0];
      const reviewerCookie = (await request(app).post("/api/auth/login").send({
        email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password,
      })).headers["set-cookie"][0];
      const created = await request(app).post("/api/requests").set("Cookie", requesterCookie).send({
        title: "Submitted Draft Timeline", description: "Timeline detail", amount: 10,
        justification: "Timeline justification", reviewerId: seededUsers.reviewer1.id, status: "DRAFT",
      });
      const draftId = created.body.request.id;
      await request(app).post(`/api/requests/${draftId}/submit`).set("Cookie", requesterCookie).send({});

      const reviewerHistory = await request(app).get(`/api/requests/${draftId}/history`).set("Cookie", reviewerCookie);
      expect(reviewerHistory.status).toBe(200);
      expect(reviewerHistory.body.history.map(({ action }: { action: string }) => action)).toEqual(["SUBMITTED"]);
      expect(reviewerHistory.body.history[0].fromStatus).toBeNull();
      expect(reviewerHistory.body.history[0].toStatus).toBe("PENDING_REVIEW");

      const requesterHistory = await request(app).get(`/api/requests/${draftId}/history`).set("Cookie", requesterCookie);
      expect(requesterHistory.body.history.map(({ action }: { action: string }) => action)).toEqual(["CREATED", "SUBMITTED"]);
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
      expect(resShortTitle.body.fieldErrors?.title).toBeDefined();

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
      expect(resZeroAmount.body.fieldErrors?.amount).toBeDefined();

      const resOverTitle = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "T".repeat(151),
          description: "Valid description",
          amount: 100.0,
          justification: "Valid justification",
          reviewerId: seededUsers.reviewer1.id,
        });
      expect(resOverTitle.status).toBe(400);
      expect(resOverTitle.body.fieldErrors?.title).toBeDefined();

      const resOverText = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "Valid Title",
          description: "D".repeat(2001),
          amount: 100.0,
          justification: "Valid justification",
          reviewerId: seededUsers.reviewer1.id,
        });
      expect(resOverText.status).toBe(400);
      expect(resOverText.body.fieldErrors?.description).toBeDefined();

      const resOverJustification = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "Valid Title",
          description: "Valid description",
          amount: 100.0,
          justification: "J".repeat(2001),
          reviewerId: seededUsers.reviewer1.id,
        });
      expect(resOverJustification.status).toBe(400);
      expect(resOverJustification.body.fieldErrors?.justification).toBeDefined();

      const resInvalidDecimal = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "Valid Title",
          description: "Valid description",
          amount: "450.001",
          justification: "Valid justification",
          reviewerId: seededUsers.reviewer1.id,
        });
      expect(resInvalidDecimal.status).toBe(400);
      expect(resInvalidDecimal.body.fieldErrors?.amount).toBeDefined();

      const resNegativeAmount = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "Valid Title",
          description: "Valid description",
          amount: -10.5,
          justification: "Valid justification",
          reviewerId: seededUsers.reviewer1.id,
        });
      expect(resNegativeAmount.status).toBe(400);
      expect(resNegativeAmount.body.fieldErrors?.amount).toBeDefined();

      const resOverMaxAmount = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "Valid Title",
          description: "Valid description",
          amount: "10000000000.00",
          justification: "Valid justification",
          reviewerId: seededUsers.reviewer1.id,
        });
      expect(resOverMaxAmount.status).toBe(400);
      expect(resOverMaxAmount.body.fieldErrors?.amount).toBeDefined();
    });

    it("accepts title, text, and amount boundary values and enforces bounds on PATCH edit", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const cookie = loginRes.headers["set-cookie"][0];

      const res = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "T".repeat(150),
          description: "D".repeat(2000),
          amount: "0.01",
          justification: "J".repeat(2000),
          reviewerId: seededUsers.reviewer1.id,
          status: "DRAFT",
        });

      expect(res.status).toBe(201);
      expect(res.body.request?.title).toHaveLength(150);
      expect(res.body.request?.description).toHaveLength(2000);
      expect(res.body.request?.justification).toHaveLength(2000);

      // Minimum title (3 chars) and maximum amount (9999999999.99)
      const minTitleMaxAmountRes = await request(app)
        .post("/api/requests")
        .set("Cookie", cookie)
        .send({
          title: "ABC",
          description: "D",
          amount: "9999999999.99",
          justification: "J",
          reviewerId: seededUsers.reviewer1.id,
          status: "DRAFT",
        });
      expect(minTitleMaxAmountRes.status).toBe(201);
      const draftId = (minTitleMaxAmountRes.body.request || minTitleMaxAmountRes.body).id;
      expect(minTitleMaxAmountRes.body.request?.title).toBe("ABC");
      expect(minTitleMaxAmountRes.body.request?.amount).toBe("9999999999.99");

      // PATCH validation boundary checks
      const patchBadTitle = await request(app)
        .patch(`/api/requests/${draftId}`)
        .set("Cookie", cookie)
        .send({ title: "T".repeat(151) });
      expect(patchBadTitle.status).toBe(400);
      expect(patchBadTitle.body.fieldErrors?.title).toBeDefined();

      const patchBadAmount = await request(app)
        .patch(`/api/requests/${draftId}`)
        .set("Cookie", cookie)
        .send({ amount: "10000000000.00" });
      expect(patchBadAmount.status).toBe(400);
      expect(patchBadAmount.body.fieldErrors?.amount).toBeDefined();

      const patchBadDesc = await request(app)
        .patch(`/api/requests/${draftId}`)
        .set("Cookie", cookie)
        .send({ description: "D".repeat(2001) });
      expect(patchBadDesc.status).toBe(400);
      expect(patchBadDesc.body.fieldErrors?.description).toBeDefined();

      const patchBadReason = await request(app)
        .patch(`/api/requests/${draftId}`)
        .set("Cookie", cookie)
        .send({ title: "Valid Updated Title", reason: "R".repeat(2001) });
      expect(patchBadReason.status).toBe(400);
      expect(patchBadReason.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("TEST-INT-07: Request modification, withdrawal & resubmission enforcement (FEAT-08, FR-05, FR-06, BR-06, BR-07, AC-07, AC-13)", () => {
    it("permits owning Requester to edit a PENDING_REVIEW request, keeping status PENDING_REVIEW and recording history visible to Requester and Reviewer (FR-05, BR-06, AC-13)", async () => {
      const requesterLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const requesterCookie = requesterLogin.headers["set-cookie"][0];
      const pendingRequestId = await createPendingRequest("Pending Edit Success Test");

      const editRes = await request(app)
        .patch(`/api/requests/${pendingRequestId}`)
        .set("Cookie", requesterCookie)
        .send({
          title: "Updated Pending Title",
          amount: 850.0,
          justification: "Updated justification for pending request",
          reason: "Revised scope and attached updated budget",
        });

      expect(editRes.status).toBe(200);
      expect(editRes.body.request.status).toBe("PENDING_REVIEW");
      expect(editRes.body.request.title).toBe("Updated Pending Title");
      expect(Number(editRes.body.request.amount)).toBe(850.0);

      // Requester fetches details and history
      const reqDetail = await request(app)
        .get(`/api/requests/${pendingRequestId}`)
        .set("Cookie", requesterCookie);
      expect(reqDetail.status).toBe(200);
      expect(reqDetail.body.request.status).toBe("PENDING_REVIEW");
      expect(reqDetail.body.request.title).toBe("Updated Pending Title");

      const reqHistory = await request(app)
        .get(`/api/requests/${pendingRequestId}/history`)
        .set("Cookie", requesterCookie);
      expect(reqHistory.status).toBe(200);
      const editEntry = reqHistory.body.history.find(
        (h: any) => h.action === "EDITED" && h.fromStatus === "PENDING_REVIEW",
      );
      expect(editEntry).toBeDefined();
      expect(editEntry.reason).toBe("Revised scope and attached updated budget");
      expect(editEntry.actorId).toBe(seededUsers.requester1.id);
      expect(editEntry.toStatus).toBe("PENDING_REVIEW");

      // Assigned reviewer fetches details and history
      const reviewerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const reviewerCookie = reviewerLogin.headers["set-cookie"][0];

      const revDetail = await request(app)
        .get(`/api/requests/${pendingRequestId}`)
        .set("Cookie", reviewerCookie);
      expect(revDetail.status).toBe(200);
      expect(revDetail.body.request.title).toBe("Updated Pending Title");
      expect(Number(revDetail.body.request.amount)).toBe(850.0);

      const revHistory = await request(app)
        .get(`/api/requests/${pendingRequestId}/history`)
        .set("Cookie", reviewerCookie);
      expect(revHistory.status).toBe(200);
      const revEditEntry = revHistory.body.history.find(
        (h: any) => h.action === "EDITED" && h.fromStatus === "PENDING_REVIEW",
      );
      expect(revEditEntry).toBeDefined();
      expect(revEditEntry.reason).toBe("Revised scope and attached updated budget");

      // Unassigned reviewer cannot view request or history
      const unassignedLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer2.email, password: seededUsers.reviewer2.password });
      const unassignedCookie = unassignedLogin.headers["set-cookie"][0];

      const unassignedDetail = await request(app)
        .get(`/api/requests/${pendingRequestId}`)
        .set("Cookie", unassignedCookie);
      expect(unassignedDetail.status).toBe(403);
      expect(unassignedDetail.body.code).toBe("ACCESS_DENIED");

      const unassignedHistory = await request(app)
        .get(`/api/requests/${pendingRequestId}/history`)
        .set("Cookie", unassignedCookie);
      expect(unassignedHistory.status).toBe(403);
      expect(unassignedHistory.body.code).toBe("ACCESS_DENIED");
    });

    it("blocks unauthorized users from editing another requester's request (BR-06, BR-09, AC-10)", async () => {
      const pendingRequestId = await createPendingRequest("Unauthorized Edit Guard Test");

      const requester2Login = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester2.email, password: seededUsers.requester2.password });
      const requester2Cookie = requester2Login.headers["set-cookie"][0];

      const resOtherRequester = await request(app)
        .patch(`/api/requests/${pendingRequestId}`)
        .set("Cookie", requester2Cookie)
        .send({ amount: 999.0 });
      expect(resOtherRequester.status).toBe(403);
      expect(resOtherRequester.body.code).toBe("ACCESS_DENIED");

      const reviewerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const reviewerCookie = reviewerLogin.headers["set-cookie"][0];

      const resReviewer = await request(app)
        .patch(`/api/requests/${pendingRequestId}`)
        .set("Cookie", reviewerCookie)
        .send({ amount: 999.0 });
      expect(resReviewer.status).toBe(403);
      expect(resReviewer.body.code).toBe("ACCESS_DENIED");
    });

    it("permits owning Requester to withdraw a PENDING_REVIEW request, transitioning to WITHDRAWN and recording audit history (FR-05, BR-07, AD-10, AC-13)", async () => {
      const pendingRequestId = await createPendingRequest("Pending Withdrawal Success Test");

      // Unauthorized withdrawal attempts
      const requester2Login = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester2.email, password: seededUsers.requester2.password });
      const resReq2 = await request(app)
        .post(`/api/requests/${pendingRequestId}/withdraw`)
        .set("Cookie", requester2Login.headers["set-cookie"][0]);
      expect(resReq2.status).toBe(403);
      expect(resReq2.body.code).toBe("ACCESS_DENIED");

      const reviewerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const resRev = await request(app)
        .post(`/api/requests/${pendingRequestId}/withdraw`)
        .set("Cookie", reviewerLogin.headers["set-cookie"][0]);
      expect(resRev.status).toBe(403);
      expect(resRev.body.code).toBe("ACCESS_DENIED");

      // Owning requester withdraws
      const requesterLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const requesterCookie = requesterLogin.headers["set-cookie"][0];

      const withdrawRes = await request(app)
        .post(`/api/requests/${pendingRequestId}/withdraw`)
        .set("Cookie", requesterCookie);
      expect(withdrawRes.status).toBe(200);
      expect(withdrawRes.body.request.status).toBe("WITHDRAWN");

      // Verify audit history for requester
      const reqHistory = await request(app)
        .get(`/api/requests/${pendingRequestId}/history`)
        .set("Cookie", requesterCookie);
      expect(reqHistory.status).toBe(200);
      const withdrawEntry = reqHistory.body.history.find((h: any) => h.action === "WITHDRAWN");
      expect(withdrawEntry).toBeDefined();
      expect(withdrawEntry.fromStatus).toBe("PENDING_REVIEW");
      expect(withdrawEntry.toStatus).toBe("WITHDRAWN");
      expect(withdrawEntry.actorId).toBe(seededUsers.requester1.id);

      // Verify audit history for assigned reviewer
      const revHistory = await request(app)
        .get(`/api/requests/${pendingRequestId}/history`)
        .set("Cookie", reviewerLogin.headers["set-cookie"][0]);
      expect(revHistory.status).toBe(200);
      const revWithdrawEntry = revHistory.body.history.find((h: any) => h.action === "WITHDRAWN");
      expect(revWithdrawEntry).toBeDefined();
      expect(revWithdrawEntry.toStatus).toBe("WITHDRAWN");
    });

    it("enforces WITHDRAWN as a terminal status blocking subsequent edit, review, or withdrawal attempts (FR-05, BR-07, AC-13)", async () => {
      const requesterLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const requesterCookie = requesterLogin.headers["set-cookie"][0];
      const pendingRequestId = await createPendingRequest("Terminal Withdrawn Action Guard");

      const withdrawRes = await request(app)
        .post(`/api/requests/${pendingRequestId}/withdraw`)
        .set("Cookie", requesterCookie);
      expect(withdrawRes.status).toBe(200);
      expect(withdrawRes.body.request.status).toBe("WITHDRAWN");

      // Requester edit blocked
      const editRes = await request(app)
        .patch(`/api/requests/${pendingRequestId}`)
        .set("Cookie", requesterCookie)
        .send({ amount: 999.0 });
      expect(editRes.status).toBe(409);
      expect(editRes.body.code).toBe("INVALID_STATE_TRANSITION");

      // Requester repeat withdraw blocked
      const repeatWithdraw = await request(app)
        .post(`/api/requests/${pendingRequestId}/withdraw`)
        .set("Cookie", requesterCookie);
      expect(repeatWithdraw.status).toBe(409);
      expect(repeatWithdraw.body.code).toBe("INVALID_STATE_TRANSITION");

      // Requester resubmit blocked
      const submitRes = await request(app)
        .post(`/api/requests/${pendingRequestId}/submit`)
        .set("Cookie", requesterCookie)
        .send({ reason: "Attempting to resubmit withdrawn" });
      expect(submitRes.status).toBe(409);
      expect(submitRes.body.code).toBe("INVALID_STATE_TRANSITION");

      // Reviewer actions blocked
      const reviewerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const reviewerCookie = reviewerLogin.headers["set-cookie"][0];

      const approveRes = await request(app)
        .post(`/api/requests/${pendingRequestId}/review`)
        .set("Cookie", reviewerCookie)
        .send({ decision: "APPROVE" });
      expect(approveRes.status).toBe(409);
      expect(approveRes.body.code).toBe("INVALID_STATE_TRANSITION");

      const rejectRes = await request(app)
        .post(`/api/requests/${pendingRequestId}/review`)
        .set("Cookie", reviewerCookie)
        .send({ decision: "REJECT", reason: "Attempt reject withdrawn" });
      expect(rejectRes.status).toBe(409);
      expect(rejectRes.body.code).toBe("INVALID_STATE_TRANSITION");

      const returnRes = await request(app)
        .post(`/api/requests/${pendingRequestId}/review`)
        .set("Cookie", reviewerCookie)
        .send({ decision: "RETURN", reason: "Attempt return withdrawn" });
      expect(returnRes.status).toBe(409);
      expect(returnRes.body.code).toBe("INVALID_STATE_TRANSITION");
    });

    it("blocks withdrawal of non-pending requests and protects terminal states (FR-05, BR-06, BR-07, AC-13)", async () => {
      const requesterLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const requesterCookie = requesterLogin.headers["set-cookie"][0];

      // DRAFT request: withdrawal blocked, edit allowed
      const draftRes = await request(app)
        .post("/api/requests")
        .set("Cookie", requesterCookie)
        .send({
          title: "Draft State Guard Test",
          description: "Draft request description",
          amount: 250.0,
          justification: "Draft test justification",
          reviewerId: seededUsers.reviewer1.id,
          status: "DRAFT",
        });
      expect(draftRes.status).toBe(201);
      const draftId = (draftRes.body.request || draftRes.body).id;

      const withdrawDraft = await request(app)
        .post(`/api/requests/${draftId}/withdraw`)
        .set("Cookie", requesterCookie);
      expect(withdrawDraft.status).toBe(409);
      expect(withdrawDraft.body.code).toBe("INVALID_STATE_TRANSITION");

      const editDraft = await request(app)
        .patch(`/api/requests/${draftId}`)
        .set("Cookie", requesterCookie)
        .send({ amount: 350.0 });
      expect(editDraft.status).toBe(200);
      expect(editDraft.body.request.status).toBe("DRAFT");

      // APPROVED request: edit and withdraw blocked
      const approvedReqId = await createPendingRequest("Approved Guard Test");
      const reviewerLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      const reviewerCookie = reviewerLogin.headers["set-cookie"][0];

      await request(app)
        .post(`/api/requests/${approvedReqId}/review`)
        .set("Cookie", reviewerCookie)
        .send({ decision: "APPROVE" });

      const editApproved = await request(app)
        .patch(`/api/requests/${approvedReqId}`)
        .set("Cookie", requesterCookie)
        .send({ amount: 999.0 });
      expect(editApproved.status).toBe(409);
      expect(editApproved.body.code).toBe("INVALID_STATE_TRANSITION");

      const withdrawApproved = await request(app)
        .post(`/api/requests/${approvedReqId}/withdraw`)
        .set("Cookie", requesterCookie);
      expect(withdrawApproved.status).toBe(409);
      expect(withdrawApproved.body.code).toBe("INVALID_STATE_TRANSITION");

      // REJECTED request: edit and withdraw blocked
      const rejectedReqId = await createPendingRequest("Rejected Guard Test");
      await request(app)
        .post(`/api/requests/${rejectedReqId}/review`)
        .set("Cookie", reviewerCookie)
        .send({ decision: "REJECT", reason: "Budget cut" });

      const editRejected = await request(app)
        .patch(`/api/requests/${rejectedReqId}`)
        .set("Cookie", requesterCookie)
        .send({ amount: 999.0 });
      expect(editRejected.status).toBe(409);
      expect(editRejected.body.code).toBe("INVALID_STATE_TRANSITION");

      const withdrawRejected = await request(app)
        .post(`/api/requests/${rejectedReqId}/withdraw`)
        .set("Cookie", requesterCookie);
      expect(withdrawRejected.status).toBe(409);
      expect(withdrawRejected.body.code).toBe("INVALID_STATE_TRANSITION");
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

      // 3. Requester makes several saves before resubmitting.
      const editNotes = [
        { amount: 500.0, reason: "No changes in this save" },
        { justification: "Initial justification", reason: "Still no changes" },
        { amount: 550.0, justification: "Vendor quotation attached: $550", reason: "Updated amount based on revised quote" },
      ];
      for (const edit of editNotes) {
        const editRes = await request(app)
          .patch(`/api/requests/${targetReqId}`)
          .set("Cookie", requesterCookie)
          .send(edit);
        expect(editRes.status).toBe(200);
        expect(editRes.body.request.status).toBe("RETURNED");
      }

      // 4. Requester resubmits the request
      const submitRes = await request(app)
        .post(`/api/requests/${targetReqId}/submit`)
        .set("Cookie", requesterCookie)
        .send({ reason: "Updated amount based on revised quote" });

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
      expect(resubmitHistory?.reason).toContain("No changes in this save");
      expect(resubmitHistory?.reason).toContain("Still no changes");
      expect(resubmitHistory?.reason).toContain("Updated amount based on revised quote");
      expect(resubmitHistory?.reason?.match(/Updated amount based on revised quote/g)).toHaveLength(1);

      const requesterHistory = await request(app)
        .get(`/api/requests/${targetReqId}/history`)
        .set("Cookie", requesterCookie);
      const requesterEdits = requesterHistory.body.history.filter(({ action }: { action: string }) => action === "EDITED");
      expect(requesterEdits).toHaveLength(3);
      const requesterEdit = requesterEdits[2];
      expect(requesterEdit.actorId).toBe(seededUsers.requester1.id);
      expect(requesterEdit.createdAt).toBeDefined();
      expect(requesterEdit.fromStatus).toBe("RETURNED");
      expect(requesterEdit.toStatus).toBe("RETURNED");
      expect(requesterEdit.reason).toBe("Updated amount based on revised quote");
      const reviewerHistory = await request(app)
        .get(`/api/requests/${targetReqId}/history`)
        .set("Cookie", reviewerCookie);
      expect(reviewerHistory.body.history.some(({ action }: { action: string }) => action === "EDITED")).toBe(false);
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

  describe("TEST-INT-09: Request filtering and search (FEAT-10, FR-08, AC-12)", () => {
    let requester1Cookie: string;
    let requester2Cookie: string;
    let reviewer1Cookie: string;
    let reviewer2Cookie: string;

    let filterReqApproved: any;
    let filterReqDraft: any;
    let filterReqRejected: any;
    let filterReqOtherUser: any;

    beforeAll(async () => {
      // Log in users
      const req1Login = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      requester1Cookie = req1Login.headers["set-cookie"][0];

      const req2Login = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester2.email, password: seededUsers.requester2.password });
      requester2Cookie = req2Login.headers["set-cookie"][0];

      const rev1Login = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer1.email, password: seededUsers.reviewer1.password });
      reviewer1Cookie = rev1Login.headers["set-cookie"][0];

      const rev2Login = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.reviewer2.email, password: seededUsers.reviewer2.password });
      reviewer2Cookie = rev2Login.headers["set-cookie"][0];

      // Create dedicated test requests with explicit dates and statuses
      filterReqApproved = await prisma.purchaseRequest.create({
        data: {
          requestNumber: "PR-2026-FIL01",
          title: "Special Filtering Alpha Laptop",
          description: "MacBook Pro for development",
          amount: "2499.00",
          justification: "High-spec machine",
          status: "APPROVED",
          requesterId: seededUsers.requester1.id,
          reviewerId: seededUsers.reviewer1.id,
          createdAt: new Date("2026-01-15T10:00:00.000Z"),
          updatedAt: new Date("2026-01-15T10:00:00.000Z"),
        },
      });

      filterReqDraft = await prisma.purchaseRequest.create({
        data: {
          requestNumber: "PR-2026-FIL02",
          title: "Special Filtering Beta Standing Desk",
          description: "Electric height adjustable desk",
          amount: "650.00",
          justification: "Ergonomics",
          status: "DRAFT",
          requesterId: seededUsers.requester1.id,
          reviewerId: seededUsers.reviewer1.id,
          createdAt: new Date("2026-02-15T10:00:00.000Z"),
          updatedAt: new Date("2026-02-15T10:00:00.000Z"),
        },
      });

      filterReqRejected = await prisma.purchaseRequest.create({
        data: {
          requestNumber: "PR-2026-FIL03",
          title: "Special Filtering Gamma Gaming Monitor",
          description: "Ultra-wide curved display",
          amount: "899.00",
          justification: "Visual design work",
          status: "REJECTED",
          requesterId: seededUsers.requester1.id,
          reviewerId: seededUsers.reviewer1.id,
          createdAt: new Date("2026-03-15T10:00:00.000Z"),
          updatedAt: new Date("2026-03-15T10:00:00.000Z"),
        },
      });

      // Request belonging to Requester 2 and assigned to Reviewer 2
      filterReqOtherUser = await prisma.purchaseRequest.create({
        data: {
          requestNumber: "PR-2026-FIL04",
          title: "Special Filtering Alpha Laptop Other User",
          description: "Laptop for second user",
          amount: "2100.00",
          justification: "Project work",
          status: "APPROVED",
          requesterId: seededUsers.requester2.id,
          reviewerId: seededUsers.reviewer2.id,
          createdAt: new Date("2026-01-15T10:00:00.000Z"),
          updatedAt: new Date("2026-01-15T10:00:00.000Z"),
        },
      });
    });

    afterAll(async () => {
      // Clean up dedicated filter requests
      await prisma.purchaseRequest.deleteMany({
        where: {
          id: {
            in: [
              filterReqApproved.id,
              filterReqDraft.id,
              filterReqRejected.id,
              filterReqOtherUser.id,
            ],
          },
        },
      });
    });

    it("filters requests by status correctly", async () => {
      const res = await request(app)
        .get("/api/requests?status=APPROVED")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.requests)).toBe(true);
      expect(res.body.requests.length).toBeGreaterThanOrEqual(1);
      for (const r of res.body.requests) {
        expect(r.status).toBe("APPROVED");
        expect(r.requesterId).toBe(seededUsers.requester1.id);
      }
      const found = res.body.requests.find((r: any) => r.id === filterReqApproved.id);
      expect(found).toBeDefined();
    });

    it("filters requests by startDate correctly", async () => {
      const res = await request(app)
        .get("/api/requests?startDate=2026-02-01")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      for (const r of res.body.requests) {
        expect(new Date(r.createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date("2026-02-01T00:00:00.000Z").getTime(),
        );
      }
      const ids = res.body.requests.map((r: any) => r.id);
      expect(ids).toContain(filterReqDraft.id);
      expect(ids).toContain(filterReqRejected.id);
      expect(ids).not.toContain(filterReqApproved.id);
    });

    it("filters requests by endDate correctly", async () => {
      const res = await request(app)
        .get("/api/requests?endDate=2026-01-31")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      for (const r of res.body.requests) {
        expect(new Date(r.createdAt).getTime()).toBeLessThanOrEqual(
          new Date("2026-01-31T23:59:59.999Z").getTime(),
        );
      }
      const ids = res.body.requests.map((r: any) => r.id);
      expect(ids).toContain(filterReqApproved.id);
      expect(ids).not.toContain(filterReqDraft.id);
      expect(ids).not.toContain(filterReqRejected.id);
    });

    it("filters requests by date range (startDate and endDate)", async () => {
      const res = await request(app)
        .get("/api/requests?startDate=2026-02-01&endDate=2026-02-28")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      const ids = res.body.requests.map((r: any) => r.id);
      expect(ids).toContain(filterReqDraft.id);
      expect(ids).not.toContain(filterReqApproved.id);
      expect(ids).not.toContain(filterReqRejected.id);
    });

    it("searches requests by title keyword (case-insensitive)", async () => {
      const res = await request(app)
        .get("/api/requests?search=standing%20desk")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      const ids = res.body.requests.map((r: any) => r.id);
      expect(ids).toContain(filterReqDraft.id);
      expect(ids).not.toContain(filterReqApproved.id);
      expect(ids).not.toContain(filterReqRejected.id);
    });

    it("searches requests by requestNumber keyword", async () => {
      const res = await request(app)
        .get("/api/requests?search=FIL03")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.requests.length).toBe(1);
      expect(res.body.requests[0].id).toBe(filterReqRejected.id);
    });

    it("combines multiple filters (status, search, date range)", async () => {
      const res = await request(app)
        .get("/api/requests?status=APPROVED&search=Laptop&startDate=2026-01-01&endDate=2026-01-31")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.requests.length).toBe(1);
      expect(res.body.requests[0].id).toBe(filterReqApproved.id);
    });

    it("returns empty array with 200 when no requests match the filter criteria", async () => {
      const res = await request(app)
        .get("/api/requests?search=NonExistentKeywordXYZ12345")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.requests)).toBe(true);
      expect(res.body.requests.length).toBe(0);
    });

    it("clearing filters restores full authorized list", async () => {
      const filteredRes = await request(app)
        .get("/api/requests?status=DRAFT")
        .set("Cookie", requester1Cookie);

      const unfilteredRes = await request(app)
        .get("/api/requests")
        .set("Cookie", requester1Cookie);

      expect(filteredRes.status).toBe(200);
      expect(unfilteredRes.status).toBe(200);
      expect(unfilteredRes.body.requests.length).toBeGreaterThan(filteredRes.body.requests.length);
      const allIds = unfilteredRes.body.requests.map((r: any) => r.id);
      expect(allIds).toContain(filterReqApproved.id);
      expect(allIds).toContain(filterReqDraft.id);
      expect(allIds).toContain(filterReqRejected.id);
    });

    it("strictly preserves requester ownership boundaries during search and filtering (BR-09, AC-10)", async () => {
      // Requester 1 searches with a keyword matching Requester 2's request
      const res = await request(app)
        .get("/api/requests?search=Other%20User")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.requests.length).toBe(0);

      // Verify Requester 2 can find their own request
      const req2Res = await request(app)
        .get("/api/requests?search=Other%20User")
        .set("Cookie", requester2Cookie);

      expect(req2Res.status).toBe(200);
      expect(req2Res.body.requests.length).toBe(1);
      expect(req2Res.body.requests[0].id).toBe(filterReqOtherUser.id);
    });

    it("strictly preserves reviewer assignment boundaries during search and filtering (BR-04, AC-09)", async () => {
      // Reviewer 1 searches for approved requests
      const rev1Res = await request(app)
        .get("/api/requests?status=APPROVED&search=Special%20Filtering")
        .set("Cookie", reviewer1Cookie);

      expect(rev1Res.status).toBe(200);
      const rev1Ids = rev1Res.body.requests.map((r: any) => r.id);
      expect(rev1Ids).toContain(filterReqApproved.id);
      // Reviewer 1 must NOT see request assigned to Reviewer 2
      expect(rev1Ids).not.toContain(filterReqOtherUser.id);

      // Reviewer 2 searches for approved requests
      const rev2Res = await request(app)
        .get("/api/requests?status=APPROVED&search=Special%20Filtering")
        .set("Cookie", reviewer2Cookie);

      expect(rev2Res.status).toBe(200);
      const rev2Ids = rev2Res.body.requests.map((r: any) => r.id);
      expect(rev2Ids).toContain(filterReqOtherUser.id);
      expect(rev2Ids).not.toContain(filterReqApproved.id);
    });

    it("rejects invalid status filter with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .get("/api/requests?status=INVALID_STATUS")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.error).toContain("Invalid status filter");
    });

    it("rejects invalid startDate format with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .get("/api/requests?startDate=not-a-date")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.error).toContain("Invalid startDate format");
    });

    it("rejects invalid endDate format with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .get("/api/requests?endDate=not-a-date")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.error).toContain("Invalid endDate format");
    });

    it("rejects invalid date range where startDate > endDate with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .get("/api/requests?startDate=2026-05-01&endDate=2026-04-01")
        .set("Cookie", requester1Cookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.error).toContain("startDate must not be after endDate");
    });
  });

  describe("TEST-INT-10: Reporting summary aggregation endpoint", () => {
    const reportPassword = "ReportTestPassword123!";
    const requestPrefix = `PR-REPORT-${Date.now()}`;
    let reportReviewer: { id: number; email: string };
    let reportReviewerCookie: string;
    let reportRequests: { id: number }[] = [];

    beforeAll(async () => {
      const passwordHash = await hashPassword(reportPassword);
      reportReviewer = await prisma.user.create({
        data: {
          email: `report-reviewer-${Date.now()}@macau678.com`,
          name: "Report Test Reviewer",
          role: "REVIEWER",
          passwordHash,
          isActive: true,
        },
      });

      const amounts = ["500.00", "200.00", "300.00", "150.00", "100.00"];
      const statuses = ["APPROVED", "APPROVED", "APPROVED", "PENDING_REVIEW", "REJECTED"] as const;
      reportRequests = await Promise.all(
        amounts.map((amount, index) =>
          prisma.purchaseRequest.create({
            data: {
              requestNumber: `${requestPrefix}-${index}`,
              title: `Reporting Summary Fixture ${index}`,
              description: "Test report metrics and filtering.",
              amount,
              justification: "Integration test fixture.",
              status: statuses[index],
              requesterId: seededUsers.requester1.id,
              reviewerId: reportReviewer.id,
              createdAt: new Date("2026-04-15T10:00:00.000Z"),
              updatedAt: new Date("2026-04-15T10:00:00.000Z"),
            },
          }),
        ),
      );

      await prisma.purchaseRequest.create({
        data: {
          requestNumber: `${requestPrefix}-other-reviewer`,
          title: "Reporting Fixture Assigned Elsewhere",
          description: "Must not appear in this reviewer's report.",
          amount: "9999.99",
          justification: "Integration test fixture.",
          status: "APPROVED",
          requesterId: seededUsers.requester1.id,
          reviewerId: seededUsers.reviewer2.id,
          createdAt: new Date("2026-04-15T10:00:00.000Z"),
          updatedAt: new Date("2026-04-15T10:00:00.000Z"),
        },
      });

      const login = await request(app)
        .post("/api/auth/login")
        .send({ email: reportReviewer.email, password: reportPassword });
      expect(login.status).toBe(200);
      reportReviewerCookie = login.headers["set-cookie"][0];
    });

    afterAll(async () => {
      await prisma.purchaseRequest.deleteMany({
        where: { requestNumber: { startsWith: requestPrefix } },
      });
      if (reportReviewer?.id) {
        await prisma.user.delete({ where: { id: reportReviewer.id } });
      }
    });

    it("returns exact total, all status counts, and only the authenticated reviewer's requests", async () => {
      const res = await request(app)
        .get("/api/reports/summary")
        .set("Cookie", reportReviewerCookie);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalCount: 5,
        statusCounts: {
          DRAFT: 0,
          PENDING_REVIEW: 1,
          APPROVED: 3,
          REJECTED: 1,
          RETURNED: 0,
          WITHDRAWN: 0,
        },
        statusAmounts: {
          DRAFT: "0.00",
          PENDING_REVIEW: "150.00",
          APPROVED: "1000.00",
          REJECTED: "100.00",
          RETURNED: "0.00",
          WITHDRAWN: "0.00",
        },
        totalAmount: "1250.00",
      });

      const requestsRes = await request(app)
        .get("/api/reports/requests")
        .set("Cookie", reportReviewerCookie);
      expect(requestsRes.status).toBe(200);
      expect(requestsRes.body.requests).toHaveLength(5);
      expect(requestsRes.body.requests.every((item: { id: number }) =>
        reportRequests.some((reportRequest) => reportRequest.id === item.id),
      )).toBe(true);
    });

    it("applies status and date filters to both results and summary metrics", async () => {
      const query = "?status=APPROVED&startDate=2026-04-01&endDate=2026-04-30";
      const summaryRes = await request(app)
        .get(`/api/reports/summary${query}`)
        .set("Cookie", reportReviewerCookie);
      const requestsRes = await request(app)
        .get(`/api/reports/requests${query}`)
        .set("Cookie", reportReviewerCookie);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body).toEqual({
        totalCount: 3,
        statusCounts: {
          DRAFT: 0,
          PENDING_REVIEW: 0,
          APPROVED: 3,
          REJECTED: 0,
          RETURNED: 0,
          WITHDRAWN: 0,
        },
        statusAmounts: {
          DRAFT: "0.00",
          PENDING_REVIEW: "0.00",
          APPROVED: "1000.00",
          REJECTED: "0.00",
          RETURNED: "0.00",
          WITHDRAWN: "0.00",
        },
        totalAmount: "1000.00",
      });
      expect(requestsRes.status).toBe(200);
      expect(requestsRes.body.requests).toHaveLength(3);
      expect(requestsRes.body.requests.every((item: { status: string }) => item.status === "APPROVED")).toBe(true);
    });

    it("returns a zero-valued summary and empty request list when no records match", async () => {
      const summaryRes = await request(app)
        .get("/api/reports/summary?startDate=2099-01-01")
        .set("Cookie", reportReviewerCookie);
      const requestsRes = await request(app)
        .get("/api/reports/requests?startDate=2099-01-01")
        .set("Cookie", reportReviewerCookie);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.totalCount).toBe(0);
      expect(summaryRes.body.totalAmount).toBe("0.00");
      expect(summaryRes.body.statusCounts).toEqual({
        DRAFT: 0,
        PENDING_REVIEW: 0,
        APPROVED: 0,
        REJECTED: 0,
        RETURNED: 0,
        WITHDRAWN: 0,
      });
      expect(summaryRes.body.statusAmounts).toEqual({
        DRAFT: "0.00",
        PENDING_REVIEW: "0.00",
        APPROVED: "0.00",
        REJECTED: "0.00",
        RETURNED: "0.00",
        WITHDRAWN: "0.00",
      });
      expect(requestsRes.status).toBe(200);
      expect(requestsRes.body.requests).toEqual([]);
    });

    it("rejects requester access to reviewer reports", async () => {
      const login = await request(app)
        .post("/api/auth/login")
        .send({ email: seededUsers.requester1.email, password: seededUsers.requester1.password });
      const res = await request(app)
        .get("/api/reports/summary")
        .set("Cookie", login.headers["set-cookie"][0]);

      expect(login.status).toBe(200);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("ACCESS_DENIED");
    });
  });
});
