# Sprint 1 UAT Test Cases and Handoff

**Project:** Macau678 Purchase Approval System  
**Branch:** `docs/1-uat`  
**Release Commit:** `f9d6538` — "deploy-proof make visible change in home page"  
**Application Version:** Version 0.2 (displayed on home page)  
**Prepared by:** Macau678 Development Team  
**Date:** 2026-11-19

---

## 1. Sprint 1 UAT Scope

This UAT covers the **Sprint 1** delivered requirements only.

### In Scope (Sprint 1 — FEAT-01 to FEAT-09)

| Feature | Description                                          | SRS Reference                                       |
| ------- | ---------------------------------------------------- | --------------------------------------------------- |
| FEAT-01 | User authentication (sign in / sign out)             | FR-01, AC-01                                        |
| FEAT-02 | Role-based access control (REQUESTER / REVIEWER)     | FR-01, AC-01                                        |
| FEAT-03 | Submit new purchase request                          | FR-02 Request Submission, AC-02                     |
| FEAT-04 | Reviewer: Approve purchase request                   | FR-04, AC-05                                        |
| FEAT-05 | Reviewer: Return purchase request with reason        | FR-04 Request Review, AC-06                         |
| FEAT-06 | Requester: Edit and resubmit returned request        | FR-05 Request Updates, FR-06 Request History, AC-07 |
| FEAT-07 | Requester: View own requests (dashboard)             | FR-03 Request Viewing, AC-03                        |
| FEAT-08 | Reviewer: View assigned requests (dashboard)         | FR-03 Request Viewing, FR-07 Request Assignment     |
| FEAT-09 | Reject purchase request with reason (terminal state) | FR-04, AC-05, AC-06, BR-07                          |

### Acceptance Criteria in Scope (AC-01 to AC-11)

| AC    | Description                                                               |
| ----- | ------------------------------------------------------------------------- |
| AC-01 | A user can log in and access features according to their role             |
| AC-02 | A Requester can create and submit a purchase request                      |
| AC-03 | A Requester can view their own requests and their current statuses        |
| AC-04 | An assigned Reviewer can view and review a purchase request               |
| AC-05 | A Reviewer can approve a request                                          |
| AC-06 | A Reviewer must provide a reason to reject or return a request            |
| AC-07 | A Requester can edit and resubmit a returned request                      |
| AC-08 | A Requester cannot approve their own request                              |
| AC-09 | A Reviewer cannot review a request assigned to another Reviewer           |
| AC-10 | Users cannot access requests they are not authorized to view              |
| AC-11 | The system records review decisions and status changes in request history |

The feature and acceptance-criteria references follow the current [SRS](../srs.md): FR-02 Request Submission, FR-03 Request Viewing, FR-04 Request Review, FR-05 Request Updates, FR-06 Request History, and FR-07 Request Assignment.

### Out of Scope (Sprint 2 / Sprint 3)

- FR-08 / AC-12: Email notifications (planned Sprint 2)
- FEAT-10, FEAT-11: Advanced filtering and reporting (Sprint 2/3)

---

## 2. Deployed Application

| Field                  | Value                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **Application URL**    | https://macau678-purchase-approval-gfn7poakkq-as.a.run.app/ |
| **Release Commit**     | `f9d6538`                                                   |
| **Version Identifier** | "Macau678 Purchase Approval System Version 0.2"             |
| **Hosting Platform**   | Google Cloud Run (GCP)                                      |

---

## 3. Test Accounts

Credentials for the following accounts will be shared **privately** with the partner UAT team (not documented here per security policy).

| Label                | Email                     | Role        | Use For                          |
| -------------------- | ------------------------- | ----------- | -------------------------------- |
| **UAT-REQUESTER-01** | `requester1@macau678.com` | `REQUESTER` | Submit, edit, resubmit requests  |
| **UAT-REVIEWER-01**  | `reviewer1@macau678.com`  | `REVIEWER`  | Approve, reject, return requests |

---

## 4. Synthetic Test Data

The database is pre-seeded with:

- One REQUESTER account (`requester1@macau678.com`)
- One REVIEWER account (`reviewer1@macau678.com`)
- Both accounts are linked so the reviewer can see the requester's submitted requests

### Data Notes

- **Test data accumulates** as UAT is performed — each test creates new requests.
- Accumulated requests do not affect login or access control tests.
- For a clean slate (optional), the development team can re-run the seed script.

### Data Reset (if requested)

Contact the development team to reset the database to its initial seed state:

```bash
# Run by the development team on the server if needed:
npm run db:seed
```

This restores both seed accounts and clears accumulated test requests.

---

## 5. Pre-Test Setup Checklist

Before executing any test case, verify the following:

- [ ] You have received the **application URL** and **account credentials** from the team.
- [ ] You can open the application URL in a modern browser (Chrome, Firefox, or Edge — latest version).
- [ ] You can reach the sign-in page (a login form is visible).
- [ ] No prior session is active — open an Incognito/Private window for each role switch.
- [ ] You have the email addresses for both UAT-REQUESTER-01 and UAT-REVIEWER-01.

---

## 6. UAT Test Cases

### UAT-TC-01 — Normal Domain Journey: Complete Purchase Approval Lifecycle

| Field              | Detail                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Test Case ID**   | UAT-TC-01                                                                                                                                        |
| **Category**       | Normal Domain Journey                                                                                                                            |
| **Purpose**        | Verify the end-to-end happy-path flow: a Requester submits a purchase request and a Reviewer approves it, with the full audit history preserved. |
| **User Roles**     | REQUESTER (UAT-REQUESTER-01), REVIEWER (UAT-REVIEWER-01)                                                                                         |
| **SRS References** | FR-02 Request Submission, FR-03 Request Viewing, FR-04 Request Review, FR-06 Request History, AC-02, AC-03, AC-04, AC-05, AC-11                  |
| **Preconditions**  | Both accounts are active. No prior session.                                                                                                      |

**Synthetic Inputs:**

| Website field          | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| Request Title          | `Office Chair - Ergonomic`                              |
| Description            | `Quantity: 2`                                           |
| Estimated Amount ($)   | `12500`                                                 |
| Business Justification | `Required for the new team members joining next month.` |
| Assign Reviewer        | UAT-REVIEWER-01                                         |
| Approval Reason        | _(none required for Approve action)_                    |

**Steps:**

1. Open the application URL in an Incognito browser window.
2. Sign in as **UAT-REQUESTER-01** (`requester1@macau678.com`).
3. Verify the dashboard is displayed and your role is shown as `REQUESTER`.
4. Click **"+ New Request"** to open the request creation form.
5. Fill in the form with the synthetic inputs above.
6. Click **"Submit for Review"**.
7. Verify that the new request appears on the Requester dashboard with the status **Pending Review**.
8. Note the **Request ID** (visible in the URL or on the card/row).
9. Sign out from UAT-REQUESTER-01.
10. Open a **new Incognito window** and sign in as **UAT-REVIEWER-01** (`reviewer1@macau678.com`).
11. Verify the request is in the Reviewer's queue. DRAFT requests must not appear there.
12. Click on the request to open its detail page.
13. Verify the status badge shows **Pending Review** and all submitted fields are correct.
14. Click **"Approve"**.
15. Verify the displayed status changes to **Approved** on the detail page.
16. Scroll down to the **Audit History / Timeline** section.
17. Verify the Reviewer timeline shows `SUBMITTED` (`None → Pending Review`) followed by `APPROVED`, with timestamps and actor names. It must not show `CREATED` or Requester-generated `EDITED` entries.
18. Sign out, sign back in as **UAT-REQUESTER-01**, and reopen the request. Verify the Requester timeline includes `CREATED`, `SUBMITTED`, and `APPROVED` with their actors and timestamps.

**Expected Results:**

- Requester can log in and access the dashboard.
- Request is created and its displayed status is Pending Review.
- Reviewer sees the request and can Approve it.
- Status changes to APPROVED.
- Requester history shows `CREATED`, `SUBMITTED` (`None → Pending Review`), and `APPROVED`. Reviewer history shows `SUBMITTED` and `APPROVED`, but not `CREATED` or Requester-generated `EDITED` entries.

---

### UAT-TC-02 — Business Rule / Boundary: Mandatory Reason Enforcement

| Field              | Detail                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test Case ID**   | UAT-TC-02                                                                                                                                                         |
| **Category**       | Business-Rule / Boundary Case                                                                                                                                     |
| **Purpose**        | Verify that a Reviewer cannot Reject or Return a request without providing a non-empty reason. The submit action must be blocked until a valid reason is entered. |
| **User Roles**     | REQUESTER (UAT-REQUESTER-01), REVIEWER (UAT-REVIEWER-01)                                                                                                          |
| **SRS References** | AC-06, FR-04 Request Review                                                                                                                                       |
| **Preconditions**  | A request with the displayed status **Pending Review** exists (create one using UAT-TC-01 steps 1–7, or use an existing one).                                     |

**Synthetic Inputs:**

| Field                            | Value                                           |
| -------------------------------- | ----------------------------------------------- |
| Reject/Return Reason (attempt 1) | _(empty — do not type anything)_                |
| Reject/Return Reason (attempt 2) | `   ` _(whitespace only — press Space 3 times)_ |
| Reject/Return Reason (valid)     | `Budget exceeded for this quarter.`             |

**Steps:**

1. Sign in as **UAT-REVIEWER-01** in an Incognito window.
2. Open a request whose displayed status is **Pending Review**.
3. Click the **"Reject"** button (or equivalent action button).
4. Observe whether a reason input field or dialog appears.
5. **Boundary test 1:** Leave the reason field empty and attempt to confirm/submit the rejection.
6. Verify that the action is **blocked** (button is disabled OR an error message is shown — the rejection does not proceed).
7. **Boundary test 2:** Type only whitespace (spaces) into the reason field and attempt to confirm.
8. Verify the action is still **blocked**.
9. **Valid input test:** Clear the field and type `Budget exceeded for this quarter.`
10. Confirm/submit the rejection.
11. Verify the displayed status changes to **Rejected**.

**Repeat with the Return action:**

12. Find (or create) another request with displayed status **Pending Review**.
13. Click **"Return"** on that request.
14. Attempt to submit with an empty reason → verify blocked.
15. Enter a valid reason → confirm → verify the displayed status changes to **Returned**.

**Expected Results:**

- Empty reason → action is blocked (button disabled or validation error shown).
- Whitespace-only reason → action is blocked.
- Valid non-empty reason → Reject succeeds, status becomes `REJECTED`.
- Valid non-empty reason → Return succeeds, status becomes `RETURNED`.

---

### UAT-TC-03 — Forbidden Role / Ownership: Cross-User Access Denied

| Field              | Detail                                                                                                                                                                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test Case ID**   | UAT-TC-03                                                                                                                                                                                                                                                                               |
| **Category**       | Forbidden Role / Ownership Case                                                                                                                                                                                                                                                         |
| **Purpose**        | Verify that users cannot access requests that do not belong to them or that they are not authorized to review. Direct URL manipulation must be denied.                                                                                                                                  |
| **User Roles**     | REQUESTER 01/02 (`requester1@macau678.com`, `requester2@macau678.com`), REVIEWER 01/02 (`reviewer1@macau678.com`, `reviewer2@macau678.com`)                                                                                                                                             |
| **SRS References** | FR-03 Request Viewing, FR-07 Request Assignment, AC-09, AC-10                                                                                                                                                                                                                           |
| **Preconditions**  | One request owned by UAT-REQUESTER-01 and two requester accounts plus two reviewer accounts must exist. Seed credentials are `requester1@`, `requester2@`, `reviewer1@`, and `reviewer2@` with the `@macau678.com` domain. Note the Request ID (from the URL, e.g. `/requests/abc123`). |

**Synthetic Inputs:**

| Field      | Value                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Target URL | The direct URL of a request owned by UAT-REQUESTER-01 (e.g. `https://<app-url>/requests/<id>`) |

**Steps — Part A: Reviewer access to a Requester's draft**

1. Sign in as **UAT-REQUESTER-01** and save a request as **DRAFT** without submitting it. Note its Request ID.
2. Sign out, then sign in as the assigned Reviewer, **UAT-REVIEWER-01**.
3. Verify the DRAFT is absent from the Reviewer queue.
4. Enter the DRAFT request URL directly in the address bar.
5. Verify access is denied or the application redirects away from the request. The Reviewer must not see the request details or its history.
6. Sign out and sign in as the unassigned Reviewer, **UAT-REVIEWER-02** (`reviewer2@macau678.com`).
7. Verify the DRAFT is absent from this Reviewer's queue as well.
8. Enter the same DRAFT request URL directly.
9. Verify access is denied or the application redirects away from the request details and history.
10. Sign out and sign in again as **UAT-REQUESTER-01**. Verify the owner can still see and open the DRAFT.

**Steps — Part B: Requester attempting to access another user's request**

5. Sign out from UAT-REVIEWER-02.
6. Sign in as **UAT-REQUESTER-02** (`requester2@macau678.com`) in a new Incognito window.
7. Manually construct a URL for the request ID owned by UAT-REQUESTER-01 (`requester1@macau678.com`).
8. Navigate to that URL directly.
9. Verify an **access denied** message or redirect occurs.

**Steps — Part C: Requester cannot perform Reviewer actions**

10. While signed in as **UAT-REQUESTER-01**, open one of your own requests with status **Pending Review**.
11. Verify that **no Approve, Reject, or Return buttons** are visible or accessible.
12. Attempt to access the reviewer action URL directly (if known) — verify it is blocked.

**Expected Results:**

- DRAFT requests do not appear in either Reviewer's queue.
- Assigned and unassigned Reviewers are both denied direct access to the DRAFT details and history.
- The Requester who owns the DRAFT can see and open it.
- Requester cannot access another user's request via direct URL.
- Requester does not see Approve/Reject/Return controls on any request.
- All unauthorized access attempts result in an access-denied response or redirect.

---

### UAT-TC-04 — State / History / Persistence: Return → Edit → Resubmit Cycle

| Field              | Detail                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test Case ID**   | UAT-TC-04                                                                                                                                                             |
| **Category**       | State, History, and Persistence Case                                                                                                                                  |
| **Purpose**        | Verify the full return-edit-resubmit lifecycle, including that the audit timeline accurately records every state transition and that edited fields persist correctly. |
| **User Roles**     | REQUESTER (UAT-REQUESTER-01), REVIEWER (UAT-REVIEWER-01)                                                                                                              |
| **SRS References** | FR-04 Request Review, FR-05 Request Updates, FR-06 Request History, AC-06, AC-07, AC-11                                                                               |
| **Preconditions**  | A request with displayed status **Pending Review** exists (create one first if needed — see UAT-TC-01 steps 1–7).                                                     |

**Synthetic Inputs:**

| Website field          | Original Value                                          | Edited Value                                                                 |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Request Title          | `Office Chair - Ergonomic`                              | `Office Chair - Ergonomic (Updated)`                                         |
| Description            | `Quantity: 2`                                           | `Quantity: 3`                                                                |
| Estimated Amount ($)   | `12500`                                                 | `18750`                                                                      |
| Business Justification | `Required for the new team members joining next month.` | `Updated: Required for 3 new team members joining next month. Cost revised.` |
| Return Reason          | _(N/A)_                                                 | `Please revise the quantity and cost estimate.`                              |

**Steps:**

1. Sign in as **UAT-REVIEWER-01** in an Incognito window.
2. Open the Pending Review request created in the precondition step.
3. Click **"Return"** and enter the return reason: `Please revise the quantity and cost estimate.`
4. Confirm the Return action.
5. Verify the displayed status changes to **Returned**.
6. Sign out from UAT-REVIEWER-01.
7. Sign in as **UAT-REQUESTER-01** in a new Incognito window.
8. Navigate to the RETURNED request on your dashboard.
9. Verify the displayed status is **Returned** and the return reason is visible.
10. Click **"Edit"** (or the edit action button on the returned request).
11. Verify the edit form is pre-populated with the original field values.
12. Update the fields with the **Edited Values** in the table above.
13. Click **"Resubmit"** (or **"Save and Resubmit"**).
14. Verify the request status changes to **Pending Review**.
15. Scroll to the **Audit History / Timeline** section while signed in as the Requester. Verify the entries appear in order: `CREATED`, `SUBMITTED` (`None → Pending Review`), `RETURNED`, one or more `EDITED` entries, and `RESUBMITTED`. Each Requester edit entry should retain its actor, timestamp, `Returned → Returned` status transition, and note/reason.
16. Sign out and sign in as the assigned Reviewer. Open the resubmitted request and verify the status is **Pending Review**. The Reviewer timeline must not show `CREATED` or Requester-generated `EDITED` entries. It must show `RESUBMITTED` and include the Requester's saved edit notes together, in order, in the resubmission reason.
17. Verify the edited field values are saved correctly on the request detail page.

**Expected Results:**

- Reviewer can return a submitted request with a reason.
- Requester can edit a returned request.
- Edit form is pre-populated with existing values.
- Requester can resubmit; the displayed status returns to Pending Review.
- Requester history shows the complete chain, including `CREATED`, `SUBMITTED`, `RETURNED`, all `EDITED` entries, and `RESUBMITTED`.
- Reviewer history shows the submission and review events, but hides `CREATED` and Requester-generated `EDITED` entries. The `RESUBMITTED` reason summarizes all edit notes since the latest return.
- Updated field values are persisted correctly.

---

### UAT-TC-05 — Terminal State Immutability: Rejected Request Cannot Be Edited

| Field              | Detail                                                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test Case ID**   | UAT-TC-05                                                                                                                                                                        |
| **Category**       | Business Rule / Terminal State                                                                                                                                                   |
| **Purpose**        | Verify that a request in the REJECTED terminal state cannot be edited by the Requester, even via direct URL manipulation to the edit page.                                       |
| **User Roles**     | REQUESTER (UAT-REQUESTER-01)                                                                                                                                                     |
| **SRS References** | BR-06, BR-07, AC-07                                                                                                                                                              |
| **Preconditions**  | A request with displayed status **Rejected** exists. (Create a new request, submit it, then have UAT-REVIEWER-01 reject it with reason `Test rejection for immutability check.`) |

**Steps:**

1. Sign in as **UAT-REQUESTER-01** in an Incognito window.
2. Navigate to the REJECTED request on your dashboard.
3. Verify the status badge shows **Rejected**.
4. Verify that **no "Edit" button** is visible on the request detail or dashboard card.
5. Attempt to navigate directly to the edit URL by appending `/edit` to the request URL (e.g., `https://<app-url>/requests/<id>/edit`).
6. Verify the application responds with an **"Editing Not Allowed"** message, error page, or redirect — the edit form must NOT be accessible.

**Expected Results:**

- No Edit button is shown for Rejected requests.
- Direct URL navigation to the edit page is blocked.
- Application shows an appropriate error or redirect (not the edit form).

---

## 7. Test Execution Instructions for the Partner Team

### Browser Requirements

- Use **Google Chrome**, **Mozilla Firefox**, or **Microsoft Edge** (latest stable version).
- Use **Incognito / Private Browsing** mode when switching between roles to avoid session conflicts.
- JavaScript must be enabled.

### Session Management

- Only one role session should be active at a time.
- After completing a Requester step, **sign out** before signing in as the Reviewer (and vice versa).
- If you encounter unexpected behavior, sign out, clear cookies, and sign in again.

### Execution Order

It is recommended to execute test cases in order (UAT-TC-01 → UAT-TC-05) as later test cases may depend on data created in earlier ones.

### Recording Results

For each test case, record:

| Field                 | Your Entry                       |
| --------------------- | -------------------------------- |
| Test Case ID          | (e.g., UAT-TC-01)                |
| Executed By           | (tester name)                    |
| Date Executed         | (YYYY-MM-DD)                     |
| Pass / Fail           | (Pass / Fail / Partial)          |
| Observations          | (any deviations, bugs, or notes) |
| Screenshot / Evidence | (attach if applicable)           |

### Reporting Issues

If any test case fails or produces unexpected results:

1. Note the exact step that failed.
2. Capture a screenshot.
3. Record the request ID and browser used.
4. Report to the Macau678 development team.

---

## 8. Cleanup Instructions

After UAT execution:

- **Test data** (requests created during testing) can be left in place — they do not affect the system.
- **Accounts** are shared test accounts and should not be deleted or have their passwords changed.
- If a database reset is needed, contact the development team to re-run the seed script.
