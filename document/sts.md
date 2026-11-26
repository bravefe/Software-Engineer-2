# Software Test Specification (STS) & Test Strategy

**Project Name:** Macau678 University Purchase Approval System  
**Course:** CPE 334 - Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)

## Test Execution Summary

| Test ID      | Test Case                                            | Test File                                                                  | Status             |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------- | ------------------ |
| TEST-UNIT-01 | Password Hashing and Salt Verification               | `tests/server/unit.test.ts`                                                | PASSED             |
| TEST-UNIT-02 | Role-Based Authorization Guard Logic                 | `tests/server/unit.test.ts`                                                | PASSED             |
| TEST-UNIT-03 | Lifecycle State Transition Matrix Validation         | `tests/server/unit.test.ts`                                                | PASSED             |
| TEST-UNIT-04 | Non-Self-Approval & Mandatory Reason Rules           | `tests/server/unit.test.ts`                                                | PASSED             |
| TEST-UNIT-05 | Input Validation & Boundary Checks                   | Not yet implemented                                                        | PLANNED (Sprint 2) |
| TEST-UNIT-06 | Financial Aggregation & Status Metrics Math          | Not yet implemented                                                        | PLANNED (Sprint 2) |
| TEST-INT-01  | User Authentication & Cookie Lifecycle               | `tests/server/integration.test.ts`                                         | PASSED             |
| TEST-INT-02  | Authentication Guards & Unauthenticated Rejection    | `tests/server/integration.test.ts`                                         | PASSED             |
| TEST-INT-03  | Purchase Request Creation & Reviewer Assignment      | `tests/server/integration.test.ts`                                         | PASSED             |
| TEST-INT-04  | Requester Data Isolation & Cross-Access Blocking     | `tests/server/integration.test.ts`                                         | PASSED             |
| TEST-INT-05  | Reviewer Queue Scoping & Assignment Isolation        | `tests/server/integration.test.ts`                                         | PASSED             |
| TEST-INT-06  | Review Decision Execution                            | `tests/server/integration.test.ts`                                         | PASSED             |
| TEST-INT-07  | Request Modification, Withdrawal & Resubmission      | `tests/server/integration.test.ts`                                         | Sprint 1 baseline passed; revised behavior planned for issue 7.3 (#66) |
| TEST-INT-08  | Complete Audit History Persistence                   | `tests/server/integration.test.ts`                                         | PASSED             |
| TEST-INT-09  | Request Filtering by Status and Date Range           | Not yet implemented                                                        | PLANNED (Sprint 2) |
| TEST-INT-10  | Reporting Summary Aggregation Endpoint               | Not yet implemented                                                        | PLANNED (Sprint 2) |
| TEST-COMP-01 | Login Form Rendering and Submission Handling         | `tests/client/components.test.tsx`                                         | PASSED             |
| TEST-COMP-02 | Purchase Request Form & Character Counters           | `tests/client/components.test.tsx`                                         | PASSED             |
| TEST-COMP-03 | Review Decision Modal & Mandatory Reason Enforcement | `tests/client/components.test.tsx`                                         | PASSED             |
| TEST-COMP-04 | History Timeline Presentation                        | `tests/client/components.test.tsx`                                         | PASSED             |
| TEST-COMP-05 | Dynamic Navigation Bar Role Rendering                | `tests/client/components.test.tsx`                                         | PASSED             |
| TEST-E2E-01  | Full Purchase Approval Journey                       | `tests/e2e/purchase-approval.spec.ts`                                      | PASSED             |
| UAT-TC-03    | Draft Privacy and Reviewer Timeline Visibility       | `tests/e2e/purchase-approval.spec.ts` + `tests/server/integration.test.ts` | PASSED             |
| TEST-E2E-02  | Purchase Rejection Journey with Mandatory Reason     | `tests/e2e/purchase-approval.spec.ts`                                      | PASSED             |
| TEST-E2E-03  | Security & Authorization Boundary Checks             | `tests/e2e/purchase-approval.spec.ts`                                      | PASSED             |
| TEST-E2E-04  | Multi-Criteria Filter & Reports Journey              | Not yet implemented                                                        | PLANNED (Sprint 2) |
| TEST-E2E-05  | Cross-Viewport Responsive Design Verification        | Not yet implemented                                                        | PLANNED (Sprint 3) |
| TEST-E2E-06  | Pending Request Edit and Withdrawal                  | `tests/e2e/purchase-approval.spec.ts` (issue 7.3 #66)                       | SPECIFIED; IMPLEMENTATION PENDING |

---

## 1. Test Strategy Overview

The testing strategy for the Macau678 Purchase Approval System implements a multi-tiered verification pyramid ensuring functional correctness, security, state machine integrity, and responsive user experience.

### 1.1 Testing Levels and Tooling

- **Unit Testing (Vitest):** Tests isolated domain logic, business rule guards, password hashing, and state transition matrices without external network dependencies.
- **API & Database Integration Testing (Vitest + Supertest):** Tests RESTful endpoints against an isolated PostgreSQL test database (`macau678`), validating transaction rollback, session cookie exchange, and relational persistence.
- **Frontend Component Testing (Vitest + React Testing Library + JSDOM):** Tests isolated React components for accessibility, conditional rendering, form validation, character counters, and user event simulation.
- **End-to-End (E2E) Browser Testing (Playwright):** Automates multi-role user journeys across browser engines and responsive viewports (Desktop 1280x720, Tablet 768x1024), validating end-to-end workflow execution.

### 1.2 Execution Status Convention

- **Status Values:**
  - `PASSED`: Test implemented and verified by automated test runner with log evidence.
  - `PLANNED (Sprint X)`: Test specification documented for implementation in Sprint X.

---

## 2. Unit Test Cases (Vitest)

### TEST-UNIT-01: Password Hashing and Salt Verification

- **Test ID:** `TEST-UNIT-01`
- **Test Objective:** Verify that user passwords are securely hashed with bcrypt (10 rounds) and plaintexts are never stored.
- **Related Requirements:** NFR-01, FR-01
- **Related Features:** `FEAT-01`
- **Preconditions:** Auth helper utility loaded in Vitest environment.
- **Test Steps:**
  1. Invoke `hashPassword("Macau678SecurePass!")`.
  2. Verify output hash does not equal the plaintext string.
  3. Verify hash starts with `$2b$10$` or `$2a$10$`.
  4. Invoke `verifyPassword("Macau678SecurePass!", hash)` and assert result is `true`.
  5. Invoke `verifyPassword("WrongPassword123!", hash)` and assert result is `false`.
- **Expected Result:** Plaintext password is cryptographically transformed; verification accurately discriminates valid and invalid passwords.
- **Status:** `PASSED` (Verified in `tests/server/unit.test.ts`)

### TEST-UNIT-02: Role-Based Authorization Guard Logic

- **Test ID:** `TEST-UNIT-02`
- **Test Objective:** Verify that role authorization middleware correctly authorizes permitted roles and denies disallowed roles.
- **Related Requirements:** FR-01, BR-09, NFR-01
- **Related Features:** `FEAT-02`
- **Preconditions:** Mock request and response objects created.
- **Test Steps:**
  1. Call `requireRole(['REVIEWER'])` with `req.user = { role: 'REQUESTER' }`.
  2. Verify response status is set to `403` with code `ACCESS_DENIED`.
  3. Call `requireRole(['REVIEWER'])` with `req.user = { role: 'REVIEWER' }`.
  4. Verify `next()` middleware function is called without response termination.
- **Expected Result:** Unauthorized roles receive HTTP 403; matching roles execute next middleware.
- **Status:** `PASSED` (Verified in `tests/server/unit.test.ts`)

### TEST-UNIT-03: Lifecycle State Transition Matrix Validation

- **Test ID:** `TEST-UNIT-03`
- **Test Objective:** Verify that request lifecycle state transition helper enforces only valid BR-07 transitions.
- **Related Requirements:** BR-07, NFR-04
- **Related Features:** `FEAT-03`, `FEAT-07`, `FEAT-08`
- **Preconditions:** Transition validation helper imported.
- **Test Steps:**
  1. Test valid transitions: `DRAFT -> PENDING_REVIEW`, `PENDING_REVIEW -> APPROVED`, `PENDING_REVIEW -> REJECTED`, `PENDING_REVIEW -> RETURNED`, `RETURNED -> PENDING_REVIEW`.
  2. Test invalid transitions: `DRAFT -> APPROVED`, `DRAFT -> RETURNED`, `APPROVED -> PENDING_REVIEW`, `REJECTED -> RETURNED`, `APPROVED -> REJECTED`.
- **Expected Result:** Valid transitions return `true`; all invalid or terminal transitions return `false`.
- **Status:** `PASSED` (Verified in `tests/server/unit.test.ts`)

### TEST-UNIT-04: Non-Self-Approval & Mandatory Reason Rules

- **Test ID:** `TEST-UNIT-04`
- **Test Objective:** Verify domain logic preventing a requester from approving their own request and requiring reasons for reject/return.
- **Related Requirements:** BR-03, BR-05
- **Related Features:** `FEAT-07`
- **Preconditions:** Review validation helper instantiated.
- **Test Steps:**
  1. Evaluate review action where `request.requesterId = 10` and `reviewerId = 10`. Assert self-review rejection (`BR-03`, `SELF_REVIEW_FORBIDDEN`).
  2. Evaluate `REJECT` decision with `reason = ""`. Assert validation failure (`BR-05`, `VALIDATION_ERROR`).
  3. Evaluate `RETURN` decision with `reason = "   "`. Assert trimmed whitespace validation failure (`BR-05`).
  4. Evaluate `APPROVE` decision without reason. Assert validation passes.
- **Expected Result:** Self-reviews and empty reject/return reasons are rejected with specific error codes.
- **Status:** `PASSED` (Verified in `tests/server/unit.test.ts`)

### TEST-UNIT-05: Input Validation & Boundary Checks

- **Test ID:** `TEST-UNIT-05`
- **Test Objective:** Verify string lengths and monetary bounds validation for purchase request creation.
- **Related Requirements:** FR-02, NFR-02, NFR-04
- **Related Features:** `FEAT-03`, `FEAT-12`
- **Preconditions:** Request validation schema loaded.
- **Test Steps:**
  1. Test title length: 2 chars (fail), 3 chars (pass), 150 chars (pass), 151 chars (fail).
  2. Test amount bounds: `0.00` (fail), `-10.50` (fail), `0.01` (pass), `1000000.00` (pass).
  3. Test description/justification: 2000 chars (pass), 2001 chars (fail).
- **Expected Result:** Boundaries are strictly enforced matching SDS constraints.
- **Status:** `PLANNED` (Sprint 2)

### TEST-UNIT-06: Financial Aggregation & Status Metrics Math

- **Test ID:** `TEST-UNIT-06`
- **Test Objective:** Verify calculation of total request counts, status distributions, and sum amounts for reporting.
- **Related Requirements:** FR-08, AC-12
- **Related Features:** `FEAT-11`
- **Preconditions:** Array of mock request records with diverse amounts and statuses.
- **Test Steps:**
  1. Pass sample dataset containing 3 Approved ($500, $200, $300), 1 Pending ($150), and 1 Rejected ($100).
  2. Invoke reporting aggregator function.
  3. Assert total request count equals 5.
  4. Assert approved monetary sum equals $1000.00 without floating point rounding error.
- **Expected Result:** Counts and decimal sums match expected mathematical aggregates.
- **Status:** `PLANNED` (Sprint 2)

---

## 3. Integration & API Test Cases (Supertest & Database)

### TEST-INT-01: User Authentication & Cookie Lifecycle

- **Test ID:** `TEST-INT-01`
- **Test Objective:** Verify login sets an HTTP-only JWT cookie, `/api/auth/me` returns current user, and logout clears cookie.
- **Related Requirements:** FR-01, NFR-01, AC-01
- **Related Features:** `FEAT-01`
- **Preconditions:** Database seeded with active demo requester (`requester1@macau678.com`).
- **Test Steps:**
  1. Send `POST /api/auth/login` with valid email and password.
  2. Assert response status is `200` and `Set-Cookie` contains `macau678_session; HttpOnly; SameSite=Lax`.
  3. Send `GET /api/auth/me` using received cookie. Assert returned user role is `REQUESTER` and no password hash is exposed.
  4. Send `POST /api/auth/logout`.
  5. Assert cookie is expired/cleared.
  6. Send `GET /api/auth/me`. Assert response status is `401 Unauthorized`.
  7. Verify inactive user cannot authenticate.
  8. Verify deactivated user cannot access protected resources.
- **Expected Result:** Cookie lifecycle correctly establishes, inspects, and clears session state.
- **Status:** `PASSED` (Verified in `tests/server/integration.test.ts`)

### TEST-INT-02: Authentication Guards & Unauthenticated Rejection

- **Test ID:** `TEST-INT-02`
- **Test Objective:** Verify that unauthenticated requests to protected endpoints are rejected with 401.
- **Related Requirements:** FR-01, BR-01, NFR-01, AC-10
- **Related Features:** `FEAT-01`, `FEAT-02`
- **Preconditions:** No session cookie provided.
- **Test Steps:**
  1. Send `GET /api/auth/me` with no cookie. Assert `401 Unauthorized` (`AUTH_REQUIRED`).
  2. Send `GET /api/requests` with no cookie. Assert `401 Unauthorized`.
  3. Send `GET /api/requests/1` with no cookie. Assert `401 Unauthorized`.
  4. Send `POST /api/requests/1/review` with no cookie. Assert `401 Unauthorized`.
- **Expected Result:** All protected endpoints reject unauthenticated traffic.
- **Status:** `PASSED` (Verified in `tests/server/integration.test.ts`)

### TEST-INT-03: Purchase Request Creation & Reviewer Assignment

- **Test ID:** `TEST-INT-03`
- **Test Objective:** Verify authenticated Requester can submit a purchase request with an assigned Reviewer.
- **Related Requirements:** FR-02, FR-07, BR-01, BR-02, BR-10, AC-02
- **Related Features:** `FEAT-03`, `FEAT-04`
- **Preconditions:** Authenticated as Requester; active Reviewer ID 2 exists in DB.
- **Test Steps:**
  1. Send `POST /api/requests` with valid title, description, amount (450.00), justification, reviewerId (2), and status `PENDING_REVIEW`.
  2. Assert response status is `201 Created`.
  3. Assert returned entity contains valid `requestNumber` (`PR-2026-XXXXX`) and `status === 'PENDING_REVIEW'`.
  4. Verify record in PostgreSQL database matches submitted payload and foreign keys.
  5. As the Requester, verify history contains `CREATED` then `SUBMITTED`. As the assigned Reviewer, verify history contains `SUBMITTED` but omits `CREATED`.
- **Expected Result:** Request is persistently saved in database and linked to submitting requester and assigned reviewer. Direct submission records both actions, while the role-specific history endpoint hides `CREATED` from the Reviewer.
- **Status:** `PASSED` (Verified in `tests/server/integration.test.ts`)

### TEST-INT-04: Requester Data Isolation & Cross-Access Blocking

- **Test ID:** `TEST-INT-04`
- **Test Objective:** Verify that a Requester can only access their own requests and cannot access another requester's data.
- **Related Requirements:** FR-03, BR-09, AC-03, AC-10
- **Related Features:** `FEAT-05`
- **Preconditions:** Requester 1 and Requester 2 exist in DB. Request #2 belongs to Requester 2.
- **Test Steps:**
  1. Authenticate as Requester 1.
  2. Send `GET /api/requests`. Assert returned array contains only requests where `requesterId === requester1.id`.
  3. Send `GET /api/requests/2` (belonging to Requester 2).
  4. Assert response status is `403 Forbidden` (`ACCESS_DENIED`).
- **Expected Result:** Cross-requester data access is strictly prevented on the server.
- **Status:** `PASSED` (Verified in `tests/server/integration.test.ts`)

### TEST-INT-05: Reviewer Queue Scoping & Assignment Isolation

- **Test ID:** `TEST-INT-05`
- **Test Objective:** Verify Reviewer only receives requests assigned to them and cannot view unassigned requests.
- **Related Requirements:** FR-03, FR-07, BR-04, BR-09, AC-04, AC-09, AC-10
- **Related Features:** `FEAT-06`
- **Preconditions:** Reviewer 1 and Reviewer 2 exist. Request #2 is assigned to Reviewer 2.
- **Test Steps:**
  1. Authenticate as Reviewer 1.
  2. Send `GET /api/requests`.
  3. Assert all returned requests in queue have `reviewerId === reviewer1.id`.
  4. Send `GET /api/requests/2` (assigned to Reviewer 2).
  5. Assert response status is `403 Forbidden` (`ACCESS_DENIED`).
- **Expected Result:** Reviewers cannot inspect or access requests assigned to other reviewers.
- **Status:** `PASSED` (Verified in `tests/server/integration.test.ts`)

### TEST-INT-06: Review Decision Execution (Approve, Reject, Return)

- **Test ID:** `TEST-INT-06`
- **Test Objective:** Verify Reviewer can execute decisions with business rule enforcement.
- **Related Requirements:** FR-04, BR-03, BR-04, BR-05, BR-07, AC-05, AC-06, AC-08, AC-09
- **Related Features:** `FEAT-07`
- **Preconditions:** Authenticated as Reviewer assigned to Request #1 (`PENDING_REVIEW`).
- **Test Steps:**
  1. Verify Requester cannot invoke review endpoint (`403 ACCESS_DENIED`).
  2. Verify self-review is forbidden if requester is also reviewer (`403 SELF_REVIEW_FORBIDDEN`).
  3. Verify unassigned reviewer cannot review request (`403 ACCESS_DENIED`).
  4. Verify assigned reviewer can approve request (`200 OK`, status `APPROVED`).
- **Expected Result:** Authorization checks and business rules are strictly enforced on review actions.
- **Status:** `PASSED` (Verified in `tests/server/integration.test.ts`)

### TEST-INT-07: Request Modification, Withdrawal & Resubmission Enforcement

- **Test ID:** `TEST-INT-07`
- **Test Objective:** Verify that pending and returned requests can be edited by their owner, pending requests can be withdrawn, and other lifecycle states remain protected.
- **Related Requirements:** FR-05, FR-06, BR-06, BR-07, AC-07, AC-13
- **Related Features:** `FEAT-08`
- **Preconditions:** Owning Requester is authenticated. Fixtures include requests in `PENDING_REVIEW`, `RETURNED`, `DRAFT`, `APPROVED`, and `REJECTED`; an assigned Reviewer can inspect the pending request.
- **Test Steps:**
  1. Send `PATCH /api/requests/:pendingId` with updated details and revision note. Assert success and status remains `PENDING_REVIEW`.
  2. Fetch details and history as the Requester and assigned Reviewer. Assert both see current details and the revision event; an unassigned Reviewer remains denied.
  3. Send `POST /api/requests/:pendingId/withdraw`. Assert status is `WITHDRAWN`, history records the actor and timestamp, and subsequent review, edit, or withdrawal attempts fail.
  4. Attempt to edit or withdraw the `DRAFT`, `APPROVED`, and `REJECTED` fixtures; assert each operation is denied without changing data.
  5. Edit `RETURNED` request #81, submit it, and assert transition to `PENDING_REVIEW` and a `RESUBMITTED` history event.
  6. After multiple returned-request edits, assert the `RESUBMITTED` reason contains edit notes chronologically without duplicating the final note.
  7. Verify Requester history retains individual `EDITED` records and Reviewer visibility follows the pending-edit rule and existing returned-resubmission summary rule.
- **Expected Result:** Pending edits preserve review status and are visible to the owner and assigned Reviewer; withdrawal is terminal; existing returned edit/resubmission behavior continues to work; other status protections remain enforced.
- **Status:** `REVISION SPECIFIED — IMPLEMENTATION PLANNED FOR ISSUE 7.2; TEST FILE CHANGES PLANNED FOR ISSUE 7.3 (#66)`

### TEST-INT-08: Complete Audit History Persistence

- **Test ID:** `TEST-INT-08`
- **Test Objective:** Verify that all lifecycle transitions persist an immutable audit trail entry.
- **Related Requirements:** FR-06, BR-08, AC-11, NFR-04
- **Related Features:** `FEAT-09`
- **Preconditions:** Request created, returned, edited, resubmitted, and approved.
- **Test Steps:**
  1. Authenticate as authorized Requester or Reviewer.
  2. Send `GET /api/requests/:id/history`.
  3. Assert response contains array of chronological history objects.
  4. Verify each object contains `action`, `actorId`, `fromStatus`, `toStatus`, `reason`, and `createdAt` timestamp.
- **Expected Result:** Full historical progression is accurately retrieved in chronological order.
- **Status:** `PASSED` (Verified in `tests/server/integration.test.ts`)

### TEST-INT-09: Request Filtering by Status and Date Range

- **Test ID:** `TEST-INT-09`
- **Test Objective:** Verify requests can be filtered by lifecycle status and creation date range.
- **Related Requirements:** FR-08, AC-12
- **Related Features:** `FEAT-10`
- **Preconditions:** Database populated with requests spanning different dates and statuses.
- **Test Steps:**
  1. Send `GET /api/requests?status=APPROVED`. Assert all returned items have status `APPROVED`.
  2. Send `GET /api/requests?startDate=2026-11-01&endDate=2026-11-03`. Assert returned items fall strictly within date range.
  3. Send `GET /api/requests?status=REJECTED&search=Office`. Assert items match both status and keyword filter.
- **Expected Result:** Database queries dynamically apply filter predicates accurately.
- **Status:** `PLANNED` (Sprint 2)

### TEST-INT-10: Reporting Summary Aggregation Endpoint

- **Test ID:** `TEST-INT-10`
- **Test Objective:** Verify `/api/reports/summary` accurately calculates status counts and total expenditure metrics.
- **Related Requirements:** FR-08, AC-12
- **Related Features:** `FEAT-11`
- **Preconditions:** Seeded requests with known amounts and statuses.
- **Test Steps:**
  1. Authenticate as Reviewer.
  2. Send `GET /api/reports/summary`.
  3. Assert HTTP status `200 OK`.
  4. Verify JSON contains keys `totalCount`, `statusCounts` (with counts for each status), and `totalAmount`.
- **Expected Result:** Summary aggregates match database totals.
- **Status:** `PLANNED` (Sprint 2)

---

## 4. Frontend Component Test Cases (React Testing Library)

### TEST-COMP-01: Login Form Rendering and Submission Handling

- **Test ID:** `TEST-COMP-01`
- **Test Objective:** Verify login component renders fields, performs client-side required field validation, and fires login callback.
- **Related Requirements:** FR-01, NFR-02, AC-01
- **Related Features:** `FEAT-01`
- **Preconditions:** Component mounted inside `AuthContext` test provider.
- **Test Steps:**
  1. Render `<LoginPage />`.
  2. Submit form with empty inputs. Assert error message "Email and password are required." appears.
  3. Type valid email and password. Click "Sign In".
  4. Verify fetch API is invoked with `/api/auth/login` and payload.
  5. Verify server error response renders dismissible alert banner.
- **Expected Result:** Form handles validation and triggers API call with valid payload.
- **Status:** `PASSED` (Verified in `tests/client/components.test.tsx`)

### TEST-COMP-02: Purchase Request Form & Character Counters

- **Test ID:** `TEST-COMP-02`
- **Test Objective:** Verify request form renders character counters and blocks submission when boundaries are exceeded.
- **Related Requirements:** FR-02, NFR-02, AC-02
- **Related Features:** `FEAT-03`, `FEAT-12`
- **Preconditions:** Component mounted in test harness.
- **Test Steps:**
  1. Render `<CreateRequest />`.
  2. Type a 2-character title. Verify visual warning indicates minimum 3 characters.
  3. Enter 0 or negative amount. Verify error indicator for positive amount.
  4. Fill valid fields. Verify "Save as Draft" and "Submit for Review" buttons become enabled.
- **Expected Result:** Live validation counters guide user input and prevent invalid submissions.
- **Status:** `PASSED` (Verified in `tests/client/components.test.tsx`)

### TEST-COMP-03: Review Decision Action Modal & Mandatory Reason Enforcement

- **Test ID:** `TEST-COMP-03`
- **Test Objective:** Verify decision modal mandates a reason before enabling Reject or Return submission.
- **Related Requirements:** FR-04, BR-05, AC-06
- **Related Features:** `FEAT-07`
- **Preconditions:** Modal mounted with decision set to `RETURN`.
- **Test Steps:**
  1. Render `<ReviewDecisionModal decision="RETURN" />`.
  2. Inspect submit button; assert it is disabled while reason textarea is empty.
  3. Type whitespace only (`"   "`). Assert submit button remains disabled.
  4. Type `"Item specification requires clarification."`. Assert submit button becomes enabled.
- **Expected Result:** Modal enforces reason requirement prior to submission.
- **Status:** `PASSED` (Verified in `tests/client/components.test.tsx`)

### TEST-COMP-04: History Timeline Presentation

- **Test ID:** `TEST-COMP-04`
- **Test Objective:** Verify history timeline component renders entries chronologically with badges and reasons.
- **Related Requirements:** FR-06, BR-08, AC-11
- **Related Features:** `FEAT-09`
- **Preconditions:** Component supplied with mock history array.
- **Test Steps:**
  1. Render `<RequestHistoryTimeline history={mockEntries} />`.
  2. Verify all actions (e.g. `CREATED`, `RETURNED`, `APPROVED`) render with corresponding status badge colors.
  3. Verify rejection/return reason text is visible inside the card.
- **Expected Result:** Timeline clearly displays historical milestones and notes.
- **Status:** `PASSED` (Verified in `tests/client/components.test.tsx`)

### TEST-COMP-05: Dynamic Navigation Bar Role Rendering

- **Test ID:** `TEST-COMP-05`
- **Test Objective:** Verify top navigation bar displays role-appropriate links based on active user context and ProtectedRoute guards unauthenticated/unauthorized access.
- **Related Requirements:** FR-01, BR-09, AC-01
- **Related Features:** `FEAT-02`
- **Preconditions:** Navigation bar rendered with mocked `AuthContext`.
- **Test Steps:**
  1. Mount `<Navbar />` with unauthenticated user. Verify "Sign In" link is shown.
  2. Mount `<Navbar />` with user role `REQUESTER`. Assert "My Requests" and "New Request" links exist; "Review Queue" does not exist.
  3. Mount `<Navbar />` with user role `REVIEWER`. Assert "Review Queue" and "Reports" links exist; "New Request" does not exist.
  4. Mount `<ProtectedRoute />` unauthenticated. Assert redirected to `/login`.
  5. Mount `<ProtectedRoute allowedRoles={['REVIEWER']} />` as Requester. Assert "Access Denied" message is displayed.
  6. Mount `<ProtectedRoute allowedRoles={['REVIEWER']} />` as Reviewer. Assert protected content renders.
- **Expected Result:** Navigation dynamically adapts to the authenticated role and ProtectedRoute enforces access.
- **Status:** `PASSED` (Verified in `tests/client/components.test.tsx`)

---

## 5. End-to-End Browser Test Cases (Playwright)

### TEST-E2E-01: Full Purchase Approval Journey (Draft -> Return -> Resubmit -> Approve)

- **Test ID:** `TEST-E2E-01`
- **Test Objective:** Validate the complete end-to-end purchase request lifecycle across multiple user roles in a real browser.
- **Related Requirements:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, BR-01 through BR-08, AC-01 through AC-07, AC-11
- **Related Features:** `FEAT-01` through `FEAT-09`
- **Preconditions:** PostgreSQL test database is available. The Playwright setup creates unique test accounts and removes only its own fixtures.
- **Test Steps:**
  1. Log in as the test Requester and create a request as a draft.
  2. Verify `DRAFT`, then submit it and verify `PENDING_REVIEW`.
  3. Sign in as the assigned Reviewer, return the request with a reason, and verify `RETURNED`.
  4. Sign in as the Requester, make multiple saves with revision notes, update the amount, and resubmit; verify `PENDING_REVIEW`.
  5. Sign in as the Reviewer and approve the request; verify `APPROVED`.
  6. As the Requester, verify the timeline contains `CREATED`, `SUBMITTED`, `RETURNED`, each `EDITED`, `RESUBMITTED`, and `APPROVED`; as the Reviewer, verify it contains `SUBMITTED`, `RETURNED`, `RESUBMITTED`, and `APPROVED` but omits `CREATED` and individual `EDITED` entries. Confirm the `RESUBMITTED` reason combines edit notes in order without duplicating the final note, and confirm the complete history persists in the database.
- **Expected Result:** The complete history persists across roles, while each role sees only its specified timeline entries.
- **Status:** `PASSED` (Verified in `tests/e2e/purchase-approval.spec.ts`)

### UAT-TC-03: Draft privacy and reviewer timeline visibility

- **Objective:** Confirm draft privacy and role-specific event history for assigned and unassigned Reviewers.
- **Preconditions:** A Requester, the draft's assigned Reviewer, a different unassigned Reviewer, and the test database are available.
- **Steps:**
  1. As the Requester, create a `DRAFT` assigned to Reviewer A and verify the Requester can open it and sees `CREATED` in history.
  2. As Reviewer A, verify the draft is absent from the queue and direct request and history API requests are denied.
  3. Repeat step 2 as unassigned Reviewer B.
  4. As the Requester, submit the draft and verify the Requester sees `CREATED` and `SUBMITTED`. (The same Requester events are recorded when a request is submitted directly.)
  5. As Reviewer A, verify the request displays `Pending Review`, the timeline contains `SUBMITTED` with `None → Pending Review`, and `CREATED` is absent.
  6. Return the request; as the Requester save multiple edits and verify each `EDITED` event retains its actor, timestamp, unchanged status, and reason. As Reviewer A verify the individual `EDITED` events are absent and `RESUBMITTED` summarizes all edit notes in order.
- **Expected Result:** Draft details are visible only to their owner; the Reviewer receives no draft data, and Reviewer and Requester timelines follow their respective history rules.
- **Automation:** `TEST-INT` regression cases in `tests/server/integration.test.ts` and `TEST-E2E-01` in `tests/e2e/purchase-approval.spec.ts`.
- **Status:** Passed by the automated assigned/unassigned Reviewer rerun in `tests/e2e/purchase-approval.spec.ts` and supporting API regressions in `tests/server/integration.test.ts`.

### TEST-E2E-02: Purchase Rejection Journey with Mandatory Reason

- **Test ID:** `TEST-E2E-02`
- **Test Objective:** Validate rejection workflow, ensuring rejection requires a reason and moves request to terminal `Rejected` state.
- **Related Requirements:** FR-04, BR-05, BR-07, AC-05, AC-06
- **Related Features:** `FEAT-07`, `FEAT-09`
- **Preconditions:** A test Requester, assigned Reviewer, and test database are available.
- **Test Steps:**
  1. Log in as the Requester and submit a request to the Reviewer.
  2. Log in as the Reviewer, select "Reject", and verify confirmation is disabled for an empty or whitespace-only reason.
  3. Enter a reason and confirm rejection; verify `REJECTED` and the reason in history.
  4. Attempt a second review decision through the API and verify the terminal-state transition is rejected.
  5. Log in as the Requester and verify editing is unavailable, including on the direct edit route.
- **Expected Result:** Rejection requires a non-empty reason, is recorded in history, and cannot be changed by a subsequent review decision.
- **Status:** `PASSED` (Verified in `tests/e2e/purchase-approval.spec.ts`)

### TEST-E2E-03: Security & Authorization Boundary Checks

- **Test ID:** `TEST-E2E-03`
- **Test Objective:** Validate client and server access restrictions, direct URL protection, and prevention of self-approval.
- **Related Requirements:** BR-03, BR-04, BR-09, NFR-01, AC-08, AC-09, AC-10
- **Related Features:** `FEAT-01`, `FEAT-02`, `FEAT-06`, `FEAT-07`
- **Preconditions:** The Playwright setup creates two Requesters, two Reviewers, a cross-assigned request, and a self-review fixture.
- **Test Steps:**
  1. Without a session, navigate to `/requester/dashboard` and verify redirect to `/login`.
  2. Log in as Requester A and navigate directly to a request owned by Requester B; verify an access-denied message.
  3. Log in as Reviewer A and navigate to a request assigned to Reviewer B; verify access is denied and a review API request returns `403`.
  4. Attempt to approve a request for which Reviewer A is also the requester; verify the UI shows the server denial and the request remains pending.
- **Expected Result:** Unauthenticated, cross-owner, cross-reviewer, and self-review attempts are blocked without changing request state.
- **Status:** `PASSED` (Verified in `tests/e2e/purchase-approval.spec.ts`)

### TEST-E2E-04: Multi-Criteria Filter & Reports Journey

- **Test ID:** `TEST-E2E-04`
- **Test Objective:** Validate dynamic filtering and aggregate reporting views in the browser.
- **Related Requirements:** FR-08, AC-12
- **Related Features:** `FEAT-10`, `FEAT-11`
- **Preconditions:** Database populated with diverse requests across statuses and dates.
- **Test Steps:**
  1. Log in as Reviewer. Navigate to `/reports`.
  2. Verify summary metric cards display total request count and financial sums.
  3. Select Status filter "Approved". Verify list updates to display only approved items.
  4. Enter Date Range inputs covering past 7 days. Verify counts update reactively.
  5. Clear filters. Verify full dataset is restored.
- **Expected Result:** Filter and report components update dynamically and display accurate aggregated data.
- **Status:** `PLANNED` (Sprint 2)

### TEST-E2E-05: Cross-Viewport Responsive Design Verification

- **Test ID:** `TEST-E2E-05`
- **Test Objective:** Validate responsive UI rendering and usability on Desktop (1280x720) and Tablet (768x1024) profiles.
- **Related Requirements:** NFR-02
- **Related Features:** `FEAT-13`, `FEAT-14`
- **Preconditions:** Playwright configured with desktop and tablet viewport emulation.
- **Test Steps:**
  1. Launch Playwright under Desktop viewport (1280x720).
  2. Verify standard navigation bar and table columns render without horizontal overflow.
  3. Launch Playwright under Tablet viewport (768x1024).
  4. Verify navigation collapses into responsive hamburger menu and tables stack gracefully.
  5. Fill and submit a purchase request on tablet viewport to confirm touch accessibility.
- **Expected Result:** Application renders cleanly across target viewports meeting usability requirements (NFR-02).
- **Status:** `PLANNED` (Sprint 3)

### TEST-E2E-06: Pending Request Edit and Withdrawal

- **Test ID:** `TEST-E2E-06`
- **Test Objective:** Verify a Requester can revise or withdraw a pending request through the UI, with updated details visible to the assigned Reviewer.
- **Related Requirements:** FR-03, FR-05, FR-06, BR-06, BR-07, BR-09, AC-03, AC-04, AC-10, AC-13
- **Related Features:** `FEAT-05`, `FEAT-06`, `FEAT-08`, `FEAT-09`
- **Preconditions:** Test Requester, assigned Reviewer, unassigned Reviewer, and test database are available.
- **Test Steps:**
  1. As the Requester, submit a request and confirm it is `PENDING_REVIEW`.
  2. Edit the pending request with a revision note. Confirm it remains pending and the Requester sees the updated details and history event.
  3. As the assigned Reviewer, open the request and confirm the latest details and revision event are visible. Confirm an unassigned Reviewer cannot access it.
  4. As the Requester, withdraw the request and confirm `WITHDRAWN` status and history.
  5. As the assigned Reviewer, confirm the request cannot be approved, rejected, or returned after withdrawal. Confirm the Requester cannot edit or withdraw it again.
  6. Confirm a separate pending request remains reviewable, and returned-request edit/resubmit behavior remains available.
- **Expected Result:** Pending edit details are shared only with the Requester and assigned Reviewer; withdrawal is persisted and terminal; unrelated requests and returned-request flow remain unchanged.
- **Status:** `SPECIFIED; AUTOMATED TEST DEFERRED TO ISSUE 7.3 (#66)`
