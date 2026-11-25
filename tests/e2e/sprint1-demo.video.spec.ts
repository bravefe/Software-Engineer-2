// import { expect, test, type Page } from "@playwright/test";
// import dotenv from "dotenv";
// import { resolve } from "node:path";

// dotenv.config({ path: resolve(process.cwd(), "server/.env") });

// import { disconnectPrisma, prisma } from "../../server/src/prisma";
// import { hashPassword } from "../../server/src/utils/auth";

// test.use({
//   viewport: { width: 1280, height: 720 },
//   launchOptions: {
//     slowMo: 350,
//   },
// });

// const defaultPassword = "Password123!";
// const runId = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
// const createdUserIds: number[] = [];

// let demoUsers: {
//   requester: { id: number; email: string; name: string; role: "REQUESTER" };
//   reviewer: { id: number; email: string; name: string; role: "REVIEWER" };
// };

// test.beforeAll(async () => {
//   const passwordHash = await hashPassword(defaultPassword);

//   const req = await prisma.user.create({
//     data: {
//       email: `requester-${runId}@macau678.com`,
//       name: "Alex Requester",
//       role: "REQUESTER",
//       passwordHash,
//       isActive: true,
//     },
//   });
//   createdUserIds.push(req.id);

//   const rev = await prisma.user.create({
//     data: {
//       email: `reviewer-${runId}@macau678.com`,
//       name: "Morgan Reviewer",
//       role: "REVIEWER",
//       passwordHash,
//       isActive: true,
//     },
//   });
//   createdUserIds.push(rev.id);

//   demoUsers = {
//     requester: {
//       id: req.id,
//       email: req.email,
//       name: req.name,
//       role: "REQUESTER",
//     },
//     reviewer: {
//       id: rev.id,
//       email: rev.email,
//       name: rev.name,
//       role: "REVIEWER",
//     },
//   };
// });

// test.afterAll(async () => {
//   try {
//     if (createdUserIds.length > 0) {
//       const requests = await prisma.purchaseRequest.findMany({
//         where: {
//           OR: [
//             { requesterId: { in: createdUserIds } },
//             { reviewerId: { in: createdUserIds } },
//           ],
//         },
//         select: { id: true },
//       });
//       const requestIds = requests.map((r) => r.id);

//       await prisma.requestHistory.deleteMany({
//         where: {
//           OR: [
//             { actorId: { in: createdUserIds } },
//             { requestId: { in: requestIds } },
//           ],
//         },
//       });

//       await prisma.purchaseRequest.deleteMany({
//         where: { id: { in: requestIds } },
//       });

//       await prisma.session.deleteMany({
//         where: { userId: { in: createdUserIds } },
//       });

//       await prisma.user.deleteMany({
//         where: { id: { in: createdUserIds } },
//       });
//     }
//   } finally {
//     await disconnectPrisma();
//   }
// });

// async function logIn(
//   page: Page,
//   user: { email: string; name: string; role: "REQUESTER" | "REVIEWER" },
// ) {
//   await page.goto("/login");
//   await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
//   await page.getByLabel("Email address").fill(user.email);
//   await page.getByLabel("Password").fill(defaultPassword);
//   await page.getByRole("button", { name: "Sign In" }).click();
//   await expect(page.getByText(`${user.name} (${user.role})`)).toBeVisible();
// }

// async function logOut(page: Page) {
//   await page.getByRole("button", { name: "Sign Out" }).click();
//   await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
// }

// async function expectStatus(page: Page, status: string) {
//   await expect(page.getByTestId(`status-badge-${status.toLowerCase()}`).first()).toBeVisible();
// }

// async function expectAction(page: Page, action: string) {
//   await expect(page.getByTestId(`action-badge-${action}`).first()).toBeVisible();
// }

// test("Sprint 1 Complete User Journey Demonstration Video", async ({ page }) => {
//   const req1Title = `Workstations for AI Research Pod ${runId}`;
//   const req2Title = `Standing Desks for Dev Team ${runId}`;

//   // =========================================================================
//   // ACT 1: Core Purchase Approval Lifecycle
//   // =========================================================================

//   // --- Step 1: Unauthenticated Route Guard (PATH-AUTH-08) ---
//   await page.goto("/requester/dashboard");
//   await expect(page).toHaveURL(/\/login$/);
//   await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();

//   // --- Step 2: Requester Login & Role Navigation (PATH-AUTH-01) ---
//   await logIn(page, demoUsers.requester);
//   await expect(page.getByRole("link", { name: "My Requests" })).toBeVisible();
//   await expect(page.getByRole("link", { name: "New Request" })).toBeVisible();

//   // --- Step 3: Create Purchase Request as Draft (PATH-REQ-01, PATH-REQ-07) ---
//   await page.getByRole("link", { name: "New Request" }).click();
//   await expect(page.getByRole("heading", { name: "Create Purchase Request" })).toBeVisible();

//   await page.locator("#request-title").fill(req1Title);
//   await page.locator("#request-amount").fill("1500.00");
//   await page.locator("#request-reviewer").selectOption(String(demoUsers.reviewer.id));
//   await page.locator("#request-description").fill("2x high-performance multi-GPU workstations for engineering tasks.");
//   await page.locator("#request-justification").fill("Essential hardware required for Sprint 1 machine learning model verification.");

//   await page.getByRole("button", { name: "Save as Draft" }).click();

//   // Verify Draft Detail
//   await expect(page.getByRole("heading", { name: req1Title })).toBeVisible();
//   await expectStatus(page, "draft");
//   await expectAction(page, "CREATED");

//   const req1Url = page.url();
//   const req1Id = Number(req1Url.match(/\/requests\/(\d+)/)?.[1]);
//   expect(req1Id).toBeGreaterThan(0);

//   // --- Step 4: Submit Draft for Review (PATH-REQ-02) ---
//   await page.getByRole("button", { name: "Submit for Review" }).click();
//   await expectStatus(page, "pending_review");
//   await expectAction(page, "SUBMITTED");
//   await logOut(page);

//   // --- Step 5: Reviewer Login & Queue Scoping (PATH-AUTH-02, PATH-REV-01) ---
//   await logIn(page, demoUsers.reviewer);
//   await page.getByRole("link", { name: "Review Queue" }).click();
//   await expect(page.getByRole("heading", { name: "Reviewer Queue" })).toBeVisible();

//   const queueRow = page.getByRole("row").filter({ hasText: req1Title });
//   await expect(queueRow).toBeVisible();
//   await queueRow.getByRole("link", { name: "Review Request" }).click();
//   await expect(page.getByRole("heading", { name: req1Title })).toBeVisible();

//   // --- Step 6: Reviewer Returns Request with Reason (PATH-REV-05, PATH-REV-03, PATH-HIST-02) ---
//   await page.getByRole("button", { name: "Return", exact: true }).click();
//   const returnDialog = page.getByRole("dialog");
//   await expect(returnDialog).toBeVisible();

//   const confirmReturnBtn = returnDialog.getByRole("button", { name: "Confirm Return" });
//   await expect(confirmReturnBtn).toBeDisabled();

//   // Whitespace-only reason check (BR-05)
//   await returnDialog.getByLabel("Reason").fill("   ");
//   await expect(confirmReturnBtn).toBeDisabled();

//   // Valid Return Reason
//   const returnReasonText = "Please provide itemized supplier quotes and clarify 3-year warranty options before approval.";
//   await returnDialog.getByLabel("Reason").fill(returnReasonText);
//   await expect(confirmReturnBtn).toBeEnabled();
//   await confirmReturnBtn.click();

//   // Verify Returned state and history entry
//   await expectStatus(page, "returned");
//   await expect(page.getByText(returnReasonText)).toBeVisible();
//   await logOut(page);

//   // --- Step 7: Requester Edits Returned Request (PATH-MOD-01, PATH-MOD-02) ---
//   await logIn(page, demoUsers.requester);
//   await page.getByRole("link", { name: "My Requests" }).click();

//   const requesterRow = page.getByRole("row").filter({ hasText: req1Title });
//   await expect(requesterRow).toBeVisible();
//   await requesterRow.getByRole("link", { name: "Edit" }).click();

//   await expect(page.getByRole("heading", { name: "Edit Returned Request" })).toBeVisible();
//   await expect(page.locator("#edit-title")).toHaveValue(req1Title);

//   // Modify amount and add revision notes
//   await page.locator("#edit-amount").fill("1450.00");
//   const editNotesText = "Updated to Dell precision workstations with 3-year ProSupport warranty included.";
//   await page.locator("#edit-notes").fill(editNotesText);

//   // Resubmit
//   await page.getByRole("button", { name: "Save & Resubmit for Review" }).click();

//   // --- Step 8: Requester Verifies Resubmitted State & History (PATH-HIST-01) ---
//   await expect(page.getByRole("heading", { name: req1Title })).toBeVisible();
//   await expectStatus(page, "pending_review");
//   await expect(page.getByText("$1450.00")).toBeVisible();
//   await expectAction(page, "EDITED");
//   await expectAction(page, "RESUBMITTED");
//   await logOut(page);

//   // --- Step 9: Reviewer Approves Request (PATH-REV-02, PATH-HIST-01) ---
//   await logIn(page, demoUsers.reviewer);
//   await page.getByRole("link", { name: "Review Queue" }).click();
//   await page.getByRole("row").filter({ hasText: req1Title }).getByRole("link", { name: "Review Request" }).click();

//   await page.getByRole("button", { name: "Approve", exact: true }).click();
//   const approveDialog = page.getByRole("dialog");
//   await expect(approveDialog).toBeVisible();
//   await approveDialog.getByRole("button", { name: "Confirm Approval" }).click();

//   // Final Terminal Approved State & Full Audit Chain
//   await expectStatus(page, "approved");
//   await expectAction(page, "CREATED");
//   await expectAction(page, "SUBMITTED");
//   await expectAction(page, "RETURNED");
//   await expectAction(page, "EDITED");
//   await expectAction(page, "RESUBMITTED");
//   await expectAction(page, "APPROVED");
//   await logOut(page);

//   // =========================================================================
//   // ACT 2: Governance, Rejection & State Machine Constraints
//   // =========================================================================

//   // --- Step 10: Requester Direct Submission for 2nd Request (PATH-REQ-03) ---
//   await logIn(page, demoUsers.requester);
//   await page.getByRole("link", { name: "New Request" }).click();

//   await page.locator("#request-title").fill(req2Title);
//   await page.locator("#request-amount").fill("500.00");
//   await page.locator("#request-reviewer").selectOption(String(demoUsers.reviewer.id));
//   await page.locator("#request-description").fill("2x motorized sit-stand desks for workstation ergonomics.");
//   await page.locator("#request-justification").fill("Staff health and workplace ergonomics initiative.");

//   await page.getByRole("button", { name: "Submit for Review" }).click();
//   await expectStatus(page, "pending_review");

//   const req2Url = page.url();
//   const req2Id = Number(req2Url.match(/\/requests\/(\d+)/)?.[1]);
//   expect(req2Id).toBeGreaterThan(0);
//   await logOut(page);

//   // --- Step 11: Reviewer Rejection with Mandatory Reason (PATH-REV-04, PATH-REV-05) ---
//   await logIn(page, demoUsers.reviewer);
//   await page.getByRole("link", { name: "Review Queue" }).click();
//   await page.getByRole("row").filter({ hasText: req2Title }).getByRole("link", { name: "Review Request" }).click();

//   await page.getByRole("button", { name: "Reject", exact: true }).click();
//   const rejectDialog = page.getByRole("dialog");
//   await expect(rejectDialog).toBeVisible();

//   const confirmRejectBtn = rejectDialog.getByRole("button", { name: "Confirm Rejection" });
//   await expect(confirmRejectBtn).toBeDisabled();

//   const rejectionReasonText = "Quarterly departmental furniture budget is fully utilized. Resubmit in Q1 next year.";
//   await rejectDialog.getByLabel("Reason").fill(rejectionReasonText);
//   await expect(confirmRejectBtn).toBeEnabled();
//   await confirmRejectBtn.click();

//   await expectStatus(page, "rejected");
//   await expect(page.getByText(rejectionReasonText)).toBeVisible();
//   await logOut(page);

//   // --- Step 12: Terminal State Lock & Editing Blocked (PATH-MOD-03) ---
//   await logIn(page, demoUsers.requester);
//   await page.goto(`/requests/${req2Id}/edit`);

//   // Verify the "Editing Not Allowed" warning card renders
//   await expect(page.getByRole("heading", { name: "Editing Not Allowed" })).toBeVisible();
//   await expect(page.getByText("Only requests in RETURNED status can be edited")).toBeVisible();
//   await expectStatus(page, "rejected");

//   // Return safely to dashboard and sign out
//   await page.getByRole("button", { name: "View Request Details" }).click();
//   await expect(page.getByRole("heading", { name: req2Title })).toBeVisible();
//   await logOut(page);
// });
