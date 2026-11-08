import { expect, test, type Page } from "@playwright/test";
import dotenv from "dotenv";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { resolve } from "node:path";

dotenv.config({ path: resolve(process.cwd(), "server/.env") });

import { prisma, disconnectPrisma } from "../../server/src/prisma";
import { hashPassword } from "../../server/src/utils/auth";

const password = "Password123!";
const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const createdUserIds: number[] = [];

let users: {
  requester1: { id: number; email: string; name: string; role: "REQUESTER" };
  requester2: { id: number; email: string; name: string; role: "REQUESTER" };
  reviewer1: { id: number; email: string; name: string; role: "REVIEWER" };
  reviewer2: { id: number; email: string; name: string; role: "REVIEWER" };
};
let selfReviewRequestId: number;
let screenshotIndex = 0;

async function workflowStep<T>(page: Page, name: string, action: () => Promise<T>): Promise<T> {
  return test.step(name, async () => {
    const result = await action();
    const screenshotPath = test.info().outputPath(
      "step-screenshots",
      `${String(++screenshotIndex).padStart(3, "0")}-${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.png`,
    );
    await mkdir(dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return result;
  });
}

test.beforeAll(async () => {
  const passwordHash = await hashPassword(password);
  const createUser = async (name: string, role: "REQUESTER" | "REVIEWER") => {
    const user = await prisma.user.create({
      data: {
        email: `${name.toLowerCase().replaceAll(" ", "-")}-${runId}@example.test`,
        name,
        role,
        passwordHash,
        isActive: true,
      },
    });
    createdUserIds.push(user.id);
    return user;
  };

  const requester1 = await createUser("Issue 6 Requester One", "REQUESTER");
  const requester2 = await createUser("Issue 6 Requester Two", "REQUESTER");
  const reviewer1 = await createUser("Issue 6 Reviewer One", "REVIEWER");
  const reviewer2 = await createUser("Issue 6 Reviewer Two", "REVIEWER");
  users = {
    requester1: {
      id: requester1.id,
      email: requester1.email,
      name: requester1.name,
      role: "REQUESTER",
    },
    requester2: {
      id: requester2.id,
      email: requester2.email,
      name: requester2.name,
      role: "REQUESTER",
    },
    reviewer1: {
      id: reviewer1.id,
      email: reviewer1.email,
      name: reviewer1.name,
      role: "REVIEWER",
    },
    reviewer2: {
      id: reviewer2.id,
      email: reviewer2.email,
      name: reviewer2.name,
      role: "REVIEWER",
    },
  };

  const selfReviewRequest = await prisma.purchaseRequest.create({
    data: {
      requestNumber: `PR-ISSUE6-${runId}-SELF`,
      title: "Issue 6 Self Review Boundary",
      description: "Request used to verify the self-review authorization boundary.",
      amount: "125.00",
      justification: "Integration test fixture.",
      status: "PENDING_REVIEW",
      requesterId: reviewer1.id,
      reviewerId: reviewer1.id,
      submittedAt: new Date(),
      history: {
        create: {
          actorId: reviewer1.id,
          action: "SUBMITTED",
          toStatus: "PENDING_REVIEW",
          reason: "Issue 6 test fixture",
        },
      },
    },
  });
  selfReviewRequestId = selfReviewRequest.id;
});

test.afterAll(async () => {
  try {
    if (createdUserIds.length > 0) {
      const requestIds = await prisma.purchaseRequest.findMany({
        where: {
          OR: [
            { requesterId: { in: createdUserIds } },
            { reviewerId: { in: createdUserIds } },
          ],
        },
        select: { id: true },
      });
      const requestIdList = requestIds.map(({ id }) => id);

      await prisma.requestHistory.deleteMany({
        where: {
          OR: [
            { actorId: { in: createdUserIds } },
            { requestId: { in: requestIdList } },
          ],
        },
      });
      await prisma.purchaseRequest.deleteMany({
        where: { id: { in: requestIdList } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
  } finally {
    await disconnectPrisma();
  }
});

async function signIn(
  page: Page,
  user: { email: string; name: string; role: "REQUESTER" | "REVIEWER" },
) {
  await workflowStep(page, `Sign in as ${user.role}`, async () => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText(`${user.name} (${user.role})`, { exact: true })).toBeVisible();
  });
}

async function signOut(page: Page) {
  await workflowStep(page, "Sign out", async () => {
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
  });
}

async function createRequest(
  page: Page,
  title: string,
  reviewerId: number,
  submitImmediately: boolean,
) {
  return workflowStep(page, "Create purchase request", async () => {
    await page.getByRole("link", { name: "New Request" }).click();
    await page.locator("#request-title").fill(title);
    await page.locator("#request-amount").fill("1500.00");
    await page.locator("#request-reviewer").selectOption(String(reviewerId));
    await page.locator("#request-description").fill("Issue 6 end-to-end integration test request.");
    await page.locator("#request-justification").fill("Verify the purchase approval workflow.");
    await page
      .getByRole("button", {
        name: submitImmediately ? "Submit for Review" : "Save as Draft",
      })
      .click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    return readRequestId(page);
  });
}

function readRequestId(page: Page): number {
  const requestId = new URL(page.url()).pathname.match(/^\/requests\/(\d+)$/)?.[1];
  if (!requestId) {
    throw new Error(`Expected a request detail URL, received ${page.url()}`);
  }
  return Number(requestId);
}

async function openQueueRequest(page: Page, title: string) {
  await workflowStep(page, "Open request from reviewer queue", async () => {
    await page.getByRole("link", { name: "Review Queue" }).click();
    const row = page.getByRole("row").filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Review Request" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });
}

async function expectStatus(page: Page, status: string) {
  await expect(page.getByTestId(`status-badge-${status}`).first()).toBeVisible();
}

test("TEST-E2E-01: draft to return to resubmit to approval, with persisted history", async ({
  page,
}) => {
  const title = `Issue 6 Approval Journey ${runId}`;

  await signIn(page, users.requester1);
  const requestId = await createRequest(page, title, users.reviewer1.id, false);
  await workflowStep(page, "Submit draft for review", async () => {
    await expectStatus(page, "draft");
    await page.getByRole("button", { name: "Submit for Review" }).click();
    await expectStatus(page, "pending_review");
  });
  await signOut(page);

  await signIn(page, users.reviewer1);
  await openQueueRequest(page, title);
  await workflowStep(page, "Return request with reason", async () => {
    await page.getByRole("button", { name: "Return", exact: true }).click();
    const returnDialog = page.getByRole("dialog");
    await returnDialog
      .getByLabel("Reason")
      .fill("Please attach the official quote before approval.");
    await returnDialog.getByRole("button", { name: "Confirm Return" }).click();
    await expectStatus(page, "returned");
    await expect(page.getByText("Please attach the official quote before approval.")).toBeVisible();
  });
  await signOut(page);

  await signIn(page, users.requester1);
  await workflowStep(page, "Edit and resubmit returned request", async () => {
    await page.goto(`/requests/${requestId}`);
    await page.getByRole("link", { name: "Edit & Resubmit" }).click();
    await page.locator("#edit-amount").fill("1450.00");
    await page.locator("#edit-notes").fill("Updated quote amount.");
    await page.getByRole("button", { name: "Save & Resubmit for Review" }).click();
    await expectStatus(page, "pending_review");
    await expect(page.getByTestId("action-badge-RESUBMITTED")).toBeVisible();
  });
  await signOut(page);

  await signIn(page, users.reviewer1);
  await openQueueRequest(page, title);
  await workflowStep(page, "Approve resubmitted request", async () => {
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm Approval" })
      .click();
    await expectStatus(page, "approved");
    await expect(page.getByTestId("action-badge-SUBMITTED")).toBeVisible();
    await expect(page.getByTestId("action-badge-RETURNED")).toBeVisible();
    await expect(page.getByTestId("action-badge-RESUBMITTED")).toBeVisible();
    await expect(page.getByTestId("action-badge-APPROVED")).toBeVisible();
  });

  const persistedRequest = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    include: { history: { orderBy: { createdAt: "asc" } } },
  });
  expect(persistedRequest?.status).toBe("APPROVED");
  expect(persistedRequest?.amount.toString()).toBe("1450");
  expect(persistedRequest?.history.map(({ action }) => action)).toEqual([
    "CREATED",
    "SUBMITTED",
    "RETURNED",
    "EDITED",
    "RESUBMITTED",
    "APPROVED",
  ]);
});

test("TEST-E2E-02: rejection requires a reason and remains terminal", async ({ page }) => {
  const title = `Issue 6 Rejection Journey ${runId}`;

  await signIn(page, users.requester1);
  const requestId = await createRequest(page, title, users.reviewer1.id, true);
  await signOut(page);

  await signIn(page, users.reviewer1);
  await openQueueRequest(page, title);
  await workflowStep(page, "Reject request with required reason", async () => {
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    const rejectDialog = page.getByRole("dialog");
    const confirmRejection = rejectDialog.getByRole("button", { name: "Confirm Rejection" });
    await expect(confirmRejection).toBeDisabled();
    await rejectDialog.getByLabel("Reason").fill("   ");
    await expect(confirmRejection).toBeDisabled();
    await rejectDialog.getByLabel("Reason").fill("Budget is unavailable this fiscal year.");
    await confirmRejection.click();
    await expectStatus(page, "rejected");
    await expect(page.getByText("Budget is unavailable this fiscal year.")).toBeVisible();
  });

  const secondDecision = await page.context().request.post(
    new URL(`/api/requests/${requestId}/review`, page.url()).toString(),
    { data: { decision: "APPROVE" } },
  );
  expect(secondDecision.status()).toBe(409);
  expect((await secondDecision.json()).code).toBe("INVALID_STATE_TRANSITION");
  await signOut(page);

  await signIn(page, users.requester1);
  await workflowStep(page, "Verify rejected request cannot be edited", async () => {
    await page.goto(`/requests/${requestId}`);
    await expectStatus(page, "rejected");
    await expect(page.getByRole("link", { name: "Edit & Resubmit" })).toHaveCount(0);
    await page.goto(`/requests/${requestId}/edit`);
    await expect(page.getByRole("heading", { name: "Editing Not Allowed" })).toBeVisible();
  });
});

test("TEST-E2E-03: direct routes, ownership, assignment, and self-review are blocked", async ({
  page,
}) => {
  await workflowStep(page, "Block unauthenticated direct route", async () => {
    await page.goto("/requester/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  await signIn(page, users.requester2);
  const title = `Issue 6 Authorization Boundary ${runId}`;
  const requestId = await createRequest(page, title, users.reviewer2.id, true);
  await signOut(page);

  await signIn(page, users.requester1);
  await workflowStep(page, "Block request access for another requester", async () => {
    await page.goto(`/requests/${requestId}`);
    await expect(page.getByRole("alert")).toContainText("Access denied");
  });
  await signOut(page);

  await signIn(page, users.reviewer1);
  await workflowStep(page, "Block access for unassigned reviewer", async () => {
    await page.goto(`/requests/${requestId}`);
    await expect(page.getByRole("alert")).toContainText("Access denied");

    const deniedReview = await page.context().request.post(
      new URL(`/api/requests/${requestId}/review`, page.url()).toString(),
      { data: { decision: "APPROVE" } },
    );
    expect(deniedReview.status()).toBe(403);
    expect((await deniedReview.json()).code).toBe("ACCESS_DENIED");
  });

  await workflowStep(page, "Block reviewer from approving own request", async () => {
    await page.goto(`/requests/${selfReviewRequestId}`);
    await expectStatus(page, "pending_review");
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm Approval" })
      .click();
    await expect(page.getByRole("alert")).toContainText("Cannot review or approve your own");
    await expectStatus(page, "pending_review");
  });
});

test.fixme(
  "TEST-E2E-04: multi-criteria filter and reports journey (outside Issue 6 scope)",
  async () => {},
);

test.fixme(
  "TEST-E2E-05: cross-viewport responsive design verification (outside Issue 6 scope)",
  async () => {},
);
