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

| Feature | Description                                          | SRS Reference              |
| ------- | ---------------------------------------------------- | -------------------------- |
| FEAT-01 | User authentication (sign in / sign out)             | FR-01, AC-01               |
| FEAT-02 | Role-based access control (REQUESTER / REVIEWER)     | FR-02, AC-02               |
| FEAT-03 | Create, save as draft, and submit a purchase request | FR-02, AC-03, AC-04        |
| FEAT-04 | Reviewer: Approve purchase request                   | FR-04, AC-05               |
| FEAT-05 | Reviewer: Return purchase request with reason        | FR-05, AC-06, AC-07        |
| FEAT-06 | Requester: Edit and resubmit returned request        | FR-06, AC-07               |
| FEAT-07 | Requester: View own requests (dashboard)             | FR-07, AC-08, AC-09        |
| FEAT-08 | Reviewer: View assigned requests (dashboard)         | FR-07, AC-08, AC-09        |
| FEAT-09 | Reject purchase request with reason (terminal state) | FR-04, AC-05, AC-06, BR-07 |

### Acceptance Criteria in Scope (AC-01 to AC-11)

| AC    | Description                                                                            |
| ----- | -------------------------------------------------------------------------------------- |
| AC-01 | A user can log in and access features according to their role                          |
| AC-02 | A Requester can create and submit a purchase request                                   |
| AC-03 | A Requester can view their own requests and current statuses                           |
| AC-04 | An assigned Reviewer can view and review a purchase request                            |
| AC-05 | A Reviewer can approve a request                                                       |
| AC-06 | A Reviewer must provide a reason to reject or return a request                         |
| AC-07 | A Requester can edit and resubmit a returned request                                   |
| AC-08 | A Requester cannot approve their own request                                           |
| AC-09 | A Reviewer cannot review a request assigned to another Reviewer                       |
| AC-10 | Users cannot access requests they are not authorized to view                           |
| AC-11 | The system records review decisions and status changes in request history              |

### Out of Scope (Sprint 2 / Sprint 3)

- FR-08 / AC-12: Email notifications (planned Sprint 2)
- FEAT-10, FEAT-11: Advanced filtering and reporting (Sprint 2/3)

---

## 2. Deployed Application

| Field                  | Value                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Application URL**    | `https://macau678-<hash>-as.a.run.app` _(exact URL provided privately by the team)_ |
| **Release Commit**     | `f9d6538`                                                                           |
| **Branch**             | `main` (merged from `feature/deploy-proof`)                                         |
| **Version Identifier** | "Macau678 Purchase Approval System Version 0.2"                                     |
| **Hosting Platform**   | Google Cloud Run (GCP)                                                              |

> [!IMPORTANT]
> The partner team will receive the exact deployed URL privately along with account credentials. Do **not** include production URLs or passwords in this document.

---

## 3. Test Accounts

Credentials for the following accounts will be shared **privately** with the partner UAT team (not documented here per security policy).

| Label                | Email                     | Role        | Use For                          |
| -------------------- | ------------------------- | ----------- | -------------------------------- |
| **UAT-REQUESTER-01** | `requester1@macau678.com` | `REQUESTER` | Submit, edit, resubmit requests  |
| **UAT-REVIEWER-01**  | `reviewer1@macau678.com`  | `REVIEWER`  | Approve, reject, return requests |

> Passwords are stored in GCP Secret Manager and will be communicated to the partner team through a secure channel.

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
| **SRS References** | FR-01, FR-02, FR-03, FR-04, AC-01, AC-02, AC-04, AC-05, AC-11                                                                                    |
| **Preconditions**  | Both accounts are active. No prior session.                                                                                                      |

**Synthetic Inputs:**

| Field           | Value                                                   |
| --------------- | ------------------------------------------------------- |
| Request Title          | `Office Chair - Ergonomic`                              |
| Description            | `Office Chair - Ergonomic; quantity 2.`                 |
| Estimated Amount ($)   | `12500`                                                 |
| Assign Reviewer        | `UAT-REVIEWER-01` (`reviewer1@macau678.com`)             |
| Business Justification | `Required for the new team members joining next month.` |
| Approval Reason | _(none required for Approve action)_                    |

**Steps:**

1. Open the application URL in an Incognito browser window.
2. Sign in as **UAT-REQUESTER-01** (`requester1@macau678.com`).
3. Verify the dashboard is displayed and your role is shown as `REQUESTER`.
4. Click **"+ New Request"** to open the request creation form.
5. Fill in the form with the synthetic inputs above.
6. Click **"Save as Draft"** and verify the Requester dashboard shows **Draft**.
7. Note the **Request ID** (visible in the URL or on the card/row).
8. Open the draft and click **"Submit for Review"**. Verify the status badge reads **Pending Review**.
9. In the Requester timeline, verify `CREATED` and `SUBMITTED` appear in order.
10. Sign out from UAT-REQUESTER-01.
11. Open a **new Incognito window** and sign in as **UAT-REVIEWER-01** (`reviewer1@macau678.com`).
12. Verify the Reviewer Queue shows the request with status **Pending Review**.
13. Click **"Review Request"** to open its detail page and check the displayed field values.
14. In the Reviewer timeline, verify `SUBMITTED` shows **None → Pending Review** and `CREATED` is not shown.
15. Click **"Approve"**.
16. Verify the status changes to **Approved** on the detail page.
17. Verify the Reviewer timeline shows `APPROVED` and still does not show `CREATED`.

**Expected Results:**

- Requester can log in and access the dashboard.
- Requester can save a draft and submit it for review.
- The visible status after submission is Pending Review.
- Reviewer sees the request and can Approve it.
- Status changes to APPROVED.
- Requester history includes CREATED and SUBMITTED; Reviewer history includes SUBMITTED and APPROVED but omits CREATED.

---

### UAT-TC-02 — Business Rule / Boundary: Mandatory Reason Enforcement

| Field              | Detail                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test Case ID**   | UAT-TC-02                                                                                                                                                         |
| **Category**       | Business-Rule / Boundary Case                                                                                                                                     |
| **Purpose**        | Verify that a Reviewer cannot Reject or Return a request without providing a non-empty reason. The submit action must be blocked until a valid reason is entered. |
| **User Roles**     | REQUESTER (UAT-REQUESTER-01), REVIEWER (UAT-REVIEWER-01)                                                                                                          |
| **SRS References** | BR-05, AC-06, FR-04                                                                                                                                                |
| **Preconditions**  | A request in **Pending Review** status exists (create one using UAT-TC-01 or use an existing one).                                                                   |

**Synthetic Inputs:**

| Field                            | Value                                           |
| -------------------------------- | ----------------------------------------------- |
| Reject/Return Reason (attempt 1) | _(empty — do not type anything)_                |
| Reject/Return Reason (attempt 2) | `   ` _(whitespace only — press Space 3 times)_ |
| Reject/Return Reason (valid)     | `Budget exceeded for this quarter.`             |

**Steps:**

1. Sign in as **UAT-REVIEWER-01** in an Incognito window.
2. Open a request that is in **Pending Review** status.
3. Click the **"Reject"** button (or equivalent action button).
4. Observe whether a reason input field or dialog appears.
5. **Boundary test 1:** Leave the reason field empty and attempt to confirm/submit the rejection.
6. Verify that the action is **blocked** (button is disabled OR an error message is shown — the rejection does not proceed).
7. **Boundary test 2:** Type only whitespace (spaces) into the reason field and attempt to confirm.
8. Verify the action is still **blocked**.
9. **Valid input test:** Clear the field and type `Budget exceeded for this quarter.`
10. Confirm/submit the rejection.
11. Verify the request status changes to **`REJECTED`**.

**Repeat with the Return action:**

12. Find (or create) another request with status **Pending Review**.
13. Click **"Return"** on that request.
14. Attempt to submit with an empty reason → verify blocked.
15. Enter a valid reason → confirm → verify status changes to **`RETURNED`**.

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
| **SRS References** | BR-09, AC-10, FR-03                                                                                                                                                                                                                                                                     |
| **Preconditions**  | A DRAFT owned by UAT-REQUESTER-01 and assigned to UAT-REVIEWER-01 must exist, along with requester2 and reviewer2 accounts. Seed credentials use the `@macau678.com` domain. Note the Request ID (from the URL, e.g. `/requests/123`). |

**Synthetic Inputs:**

| Field      | Value                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Target URL | The direct URL of a request owned by UAT-REQUESTER-01 (e.g. `https://<app-url>/requests/<id>`) |

**Steps — Part A: Assigned Reviewer accessing Requester's draft**

1. Sign in as **UAT-REVIEWER-01** (`reviewer1@macau678.com`) in an Incognito window. This Reviewer is assigned to the draft.
2. Note the URL of a **DRAFT** created by UAT-REQUESTER-01 (`requester1@macau678.com`).
3. Navigate directly to that URL (paste it in the address bar).
4. Verify the page shows an **access denied / unauthorized** message, or redirects to the dashboard.
5. Verify the draft is absent from the Reviewer's queue.

**Steps — Part B: Unassigned Reviewer accessing the same draft**

6. Sign out from UAT-REVIEWER-01.
7. Sign in as **UAT-REVIEWER-02** (`reviewer2@macau678.com`) in a new Incognito window.
8. Navigate directly to the same draft URL.
9. Verify **access denied** and confirm the draft is absent from this Reviewer's queue.

**Steps — Part C: Requester attempting to access another user's request**

10. Sign out from UAT-REVIEWER-02 and sign in as **UAT-REQUESTER-02** (`requester2@macau678.com`).
11. Navigate directly to the request URL owned by UAT-REQUESTER-01.
12. Verify an **access denied** message or redirect occurs.

**Steps — Part D: Requester cannot perform Reviewer actions**

13. Sign in as **UAT-REQUESTER-01** and open one of your own requests.
14. Verify no **Approve**, **Reject**, or **Return** buttons are visible.
15. Attempt to access a Reviewer action URL directly (if known) and verify it is blocked.

**Expected Results:**

- Neither assigned nor unassigned Reviewers can discover or open a DRAFT.
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
| **SRS References** | FR-05, FR-06, BR-06, BR-08, AC-07, AC-11                                                                                                                              |
| **Preconditions**  | A request in **Pending Review** status exists (create one first if needed — see UAT-TC-01).                                                                           |

**Synthetic Inputs:**

| Field          | Original Value                                          | Edited Value                                                                 |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Request Title          | `Office Chair - Ergonomic`                              | `Office Chair - Ergonomic (Updated)`                                         |
| Description            | `Office Chair - Ergonomic; quantity 2.`                 | `Office Chair - Ergonomic; quantity 3.`                                      |
| Estimated Amount ($)   | `12500`                                                 | `18750`                                                                      |
| Business Justification | `Required for the new team members joining next month.` | `Updated: Required for 3 new team members joining next month. Cost revised.` |
| Return Reason  | _(N/A)_                                                 | `Please revise the quantity and cost estimate.`                              |

**Steps:**

1. Sign in as **UAT-REVIEWER-01** in an Incognito window.
2. Open the request with status **Pending Review** created in the precondition step.
3. Click **"Return"** and enter the return reason: `Please revise the quantity and cost estimate.`
4. Confirm the Return action.
5. Verify the request status changes to **`RETURNED`**.
6. Sign out from UAT-REVIEWER-01.
7. Sign in as **UAT-REQUESTER-01** in a new Incognito window.
8. Navigate to the RETURNED request on your dashboard.
9. Verify the status shows **`RETURNED`** and the return reason is visible.
10. Click **"Edit"** (or the edit action button on the returned request).
11. Verify the edit form is pre-populated with the original field values.
12. Update the fields with the **Edited Values** in the table above.
13. Click **"Resubmit"** (or **"Save and Resubmit"**).
14. Verify the request status changes to **Pending Review**.
15. Scroll to the **Audit History / Timeline** section.
16. As the Requester, verify the entries appear in order: `CREATED`, `SUBMITTED`, `RETURNED`, `EDITED`, and `RESUBMITTED`.
17. Sign out and sign in as the assigned Reviewer. Verify the Reviewer timeline shows `SUBMITTED`, `RETURNED`, and `RESUBMITTED`, but not `CREATED` or individual requester-generated `EDITED` entries. Confirm the `RESUBMITTED` note combines the edit notes in order without repeating the final note.
18. Verify the edited field values are saved correctly on the request detail page.

**Expected Results:**

- Reviewer can return a submitted request with a reason.
- Requester can edit a returned request.
- Edit form is pre-populated with existing values.
- Requester can resubmit; the visible status returns to Pending Review.
- Requester history is complete; Reviewer history omits CREATED and requester-generated EDITED records.
- Updated field values are persisted correctly.

---

### UAT-TC-05 — Terminal State Immutability: Rejected Request Cannot Be Edited

| Field              | Detail                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test Case ID**   | UAT-TC-05                                                                                                                                                            |
| **Category**       | Business Rule / Terminal State                                                                                                                                       |
| **Purpose**        | Verify that a request in the REJECTED terminal state cannot be edited by the Requester, even via direct URL manipulation to the edit page.                           |
| **User Roles**     | REQUESTER (UAT-REQUESTER-01)                                                                                                                                         |
| **SRS References** | BR-06, BR-07, AC-07                                                                                                                                                  |
| **Preconditions**  | A request in **REJECTED** status exists. (Create a new request, submit it, then have UAT-REVIEWER-01 reject it with reason `Test rejection for immutability check.`) |

**Steps:**

1. Sign in as **UAT-REQUESTER-01** in an Incognito window.
2. Navigate to the REJECTED request on your dashboard.
3. Verify the status badge shows **`REJECTED`**.
4. Verify that **no "Edit" button** is visible on the request detail or dashboard card.
5. Attempt to navigate directly to the edit URL by appending `/edit` to the request URL (e.g., `https://<app-url>/requests/<id>/edit`).
6. Verify the application responds with an **"Editing Not Allowed"** message, error page, or redirect — the edit form must NOT be accessible.

**Expected Results:**

- No Edit button is shown for REJECTED requests.
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

---

## 9. UAT Reviewer Checklist

Use this checklist while executing the test cases above. Check off each item as you confirm it in the live application.

### 🔐 Authentication & Access

- [ ] Sign-in page loads at the app URL without being logged in
- [ ] `requester1@macau678.com` can log in → lands on the **Requester** dashboard
- [ ] `reviewer1@macau678.com` can log in → lands on the **Reviewer** queue
- [ ] Dashboard header shows the logged-in user's name and their role label (`REQUESTER` / `REVIEWER`)
- [ ] Clicking **Sign Out** ends the session and redirects to the login page
- [ ] After signing out, pressing the browser Back button does **not** return to the dashboard
- [ ] Navigating directly to a protected URL (e.g. `/requests`) while logged out redirects to login

---

### 📋 Requester — Create & Submit

- [ ] **"+ New Request"** button is visible on the Requester dashboard
- [ ] The request form has **Request Title**, **Estimated Amount ($)**, **Assign Reviewer**, **Description**, and **Business Justification**
- [ ] Quantity details, when needed, are entered in **Description**; there is no separate Quantity field
- [ ] After submission, the request status badge reads **Pending Review**
- [ ] The new request appears on the Requester dashboard immediately after submission
- [ ] A saved request displays **Draft**; a submitted request displays **Pending Review**

---

### 🔍 Reviewer — Queue & Decision

- [ ] After the Requester submits, the Reviewer's dashboard shows that request
- [ ] The Reviewer can open the request detail page and see all submitted field values
- [ ] The detail page shows **Approve**, **Return**, and **Reject** action buttons for Pending Review requests
- [ ] Clicking **Approve** → status changes to **APPROVED**
- [ ] Clicking **Reject** without entering a reason → action is **blocked** (button disabled or error shown)
- [ ] Clicking **Return** without entering a reason → action is **blocked**
- [ ] Entering whitespace-only in the reason field → action is still **blocked**
- [ ] Entering a valid reason and clicking **Reject** → status changes to **REJECTED**
- [ ] Entering a valid reason and clicking **Return** → status changes to **RETURNED**

---

### ✏️ Requester — Edit & Resubmit

- [ ] A **RETURNED** request shows the reviewer's return reason on the detail page
- [ ] An **Edit** button is visible for RETURNED requests
- [ ] The edit form opens pre-populated with the original field values (not blank)
- [ ] The Requester can update the fields and click **Resubmit**
- [ ] After resubmit → status changes back to **Pending Review**
- [ ] No **Edit** button is visible for **Pending Review**, **Approved**, or **Rejected** requests
- [ ] Navigating directly to the edit URL for a REJECTED request (e.g. `/requests/<id>/edit`) → blocked with an error or redirect (edit form is NOT shown)

---

### 📜 Audit History / Timeline

- [ ] The request detail page has an audit history / timeline section
- [ ] Requester timeline shows complete history, including `CREATED`, `SUBMITTED`, `RETURNED`, `EDITED`, `RESUBMITTED`, and `APPROVED`
- [ ] Reviewer timeline shows `SUBMITTED`, `RETURNED`, `RESUBMITTED`, and `APPROVED`; it omits `CREATED` and requester-generated `EDITED`
- [ ] Each timeline entry shows the actor's name and a timestamp
- [ ] History entries cannot be deleted or modified by either role

---

### 🔒 Access Control & Security

- [ ] The Requester's dashboard shows **only their own requests** — not other users' requests
- [ ] The Reviewer's queue shows only assigned requests that are not DRAFT
- [ ] A DRAFT is hidden from assigned and unassigned Reviewers and cannot be opened by direct URL
- [ ] Navigating directly to another user's request URL → access denied or redirect (not the request detail)
- [ ] No **Approve / Reject / Return** buttons are visible to the Requester on any request
- [ ] No **New Request** or **Edit** button is visible to the Reviewer

---

### 🧾 General Quality Checks

- [ ] Status badges display **Draft**, **Pending Review**, **Approved**, **Returned**, or **Rejected** as appropriate
- [ ] No console errors or broken UI elements during normal use
- [ ] Switching roles (sign out as Requester, sign in as Reviewer) works cleanly without session bleed-over
- [ ] The application version displayed on the home page matches the documented release (Version 0.2)
