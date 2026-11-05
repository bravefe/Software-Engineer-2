# Software Test Specification (STS) & Test Strategy

**Project Name:** Macau678 University Purchase Approval System  
**Course:** CPE 334 — Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Theme:** Theme 5: Workflow and Approval System  
**Baseline References:** [Software Requirements Specification (SRS)](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/srs.md) | [System Design Specification (SDS)](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/sds.md) | [Feature Inventory](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/feature.md)

---

## 1. Test Strategy Overview

The testing strategy for the Macau678 Purchase Approval System implements a multi-tiered verification pyramid ensuring functional correctness, security, state machine integrity, and responsive user experience. 

### 1.1 Testing Levels and Tooling
* **Unit Testing (Vitest):** Tests isolated domain logic, business rule guards, password hashing, and state transition matrices without external network dependencies.
* **API & Database Integration Testing (Vitest + Supertest):** Tests RESTful endpoints against an isolated PostgreSQL test database (`macau678_test`), validating transaction rollback, session cookie exchange, and relational persistence.
* **Frontend Component Testing (Vitest + React Testing Library + JSDOM):** Tests isolated React components for accessibility, conditional rendering, form validation, character counters, and user event simulation.
* **End-to-End (E2E) Browser Testing (Playwright):** Automates multi-role user journeys across browser engines and responsive viewports (Desktop 1280x720, Tablet 768x1024), validating end-to-end workflow execution.

### 1.2 Execution Status Convention
> [!NOTE]
> All test cases documented herein represent **PLANNED** tests formulated during Sprint planning and pre-implementation specification. In adherence to academic integrity and course requirements, no test is reported as `PASSED` without actual recorded execution evidence.

* **Status Values:** `PLANNED` | `READY FOR IMPLEMENTATION` | `PASSED` (only with commit/log evidence) | `FAILED`

---

## 2. Unit Test Cases (Vitest)

### TEST-UNIT-01: Password Hashing and Salt Verification
* **Test ID:** `TEST-UNIT-01`
* **Test Objective:** Verify that user passwords are securely hashed with bcrypt (10 rounds) and plaintexts are never stored.
* **Related Requirements:** NFR-01, FR-01
* **Related Features:** `FEAT-01`
* **Preconditions:** Auth helper utility loaded in Vitest environment.
* **Test Steps:**
  1. Invoke `hashPassword("ValidPass123!")`.
  2. Verify output hash does not equal the plaintext string.
  3. Verify hash starts with `$2b$10$` or `$2a$10$`.
  4. Invoke `verifyPassword("ValidPass123!", hash)` and assert result is `true`.
  5. Invoke `verifyPassword("WrongPass!", hash)` and assert result is `false`.
* **Expected Result:** Plaintext password is cryptographically transformed; verification accurately discriminates valid and invalid passwords.
* **Status:** `PLANNED` (Sprint 1)

### TEST-UNIT-02: Role-Based Authorization Guard Logic
* **Test ID:** `TEST-UNIT-02`
* **Test Objective:** Verify that role authorization middleware correctly authorizes permitted roles and denies disallowed roles.
* **Related Requirements:** FR-01, BR-09, NFR-01
* **Related Features:** `FEAT-02`
* **Preconditions:** Mock request and response objects created.
* **Test Steps:**
  1. Call `requireRole(['REVIEWER'])` with `req.user = { role: 'REQUESTER' }`.
  2. Verify response status is set to `403` with code `ACCESS_DENIED`.
  3. Call `requireRole(['REVIEWER'])` with `req.user = { role: 'REVIEWER' }`.
  4. Verify `next()` middleware function is called without response termination.
* **Expected Result:** Unauthorized roles receive HTTP 403; matching roles execute next middleware.
* **Status:** `PLANNED` (Sprint 1)

### TEST-UNIT-03: Lifecycle State Transition Matrix Validation
* **Test ID:** `TEST-UNIT-03`
* **Test Objective:** Verify that request lifecycle state transition helper enforces only valid BR-07 transitions.
* **Related Requirements:** BR-07, NFR-04
* **Related Features:** `FEAT-03`, `FEAT-07`, `FEAT-08`
* **Preconditions:** Transition validation helper imported.
* **Test Steps:**
  1. Test valid transitions: `DRAFT -> PENDING_REVIEW`, `PENDING_REVIEW -> APPROVED`, `PENDING_REVIEW -> REJECTED`, `PENDING_REVIEW -> RETURNED`, `RETURNED -> PENDING_REVIEW`.
  2. Test invalid transitions: `DRAFT -> APPROVED`, `DRAFT -> RETURNED`, `APPROVED -> PENDING_REVIEW`, `REJECTED -> RETURNED`, `APPROVED -> REJECTED`.
* **Expected Result:** Valid transitions return `true`; all invalid or terminal transitions return `false`.
* **Status:** `PLANNED` (Sprint 1)

### TEST-UNIT-04: Non-Self-Approval & Mandatory Reason Rules
* **Test ID:** `TEST-UNIT-04`
* **Test Objective:** Verify domain logic preventing a requester from approving their own request and requiring reasons for reject/return.
* **Related Requirements:** BR-03, BR-05
* **Related Features:** `FEAT-07`
* **Preconditions:** Review validation service instantiated.
* **Test Steps:**
  1. Evaluate review action where `request.requesterId = 5` and `reviewerId = 5`. Assert self-review rejection (`BR-03`).
  2. Evaluate `REJECT` decision with `reason = ""`. Assert validation failure (`BR-05`).
  3. Evaluate `RETURN` decision with `reason = "   "`. Assert trimmed whitespace validation failure (`BR-05`).
  4. Evaluate `APPROVE` decision with empty reason. Assert validation passes.
* **Expected Result:** Self-reviews and empty reject/return reasons are rejected with specific error codes.
* **Status:** `PLANNED` (Sprint 1)

### TEST-UNIT-05: Input Validation & Boundary Checks
* **Test ID:** `TEST-UNIT-05`
* **Test Objective:** Verify string lengths and monetary bounds validation for purchase request creation.
* **Related Requirements:** FR-02, NFR-02, NFR-04
* **Related Features:** `FEAT-03`, `FEAT-12`
* **Preconditions:** Request validation schema loaded.
* **Test Steps:**
  1. Test title length: 2 chars (fail), 3 chars (pass), 150 chars (pass), 151 chars (fail).
  2. Test amount bounds: `0.00` (fail), `-10.50` (fail), `0.01` (pass), `1000000.00` (pass).
  3. Test description/justification: 2000 chars (pass), 2001 chars (fail).
* **Expected Result:** Boundaries are strictly enforced matching SDS constraints.
* **Status:** `PLANNED` (Sprint 2)

### TEST-UNIT-06: Financial Aggregation & Status Metrics Math
* **Test ID:** `TEST-UNIT-06`
* **Test Objective:** Verify calculation of total request counts, status distributions, and sum amounts for reporting.
* **Related Requirements:** FR-08, AC-12
* **Related Features:** `FEAT-11`
* **Preconditions:** Array of mock request records with diverse amounts and statuses.
* **Test Steps:**
  1. Pass sample dataset containing 3 Approved ($500, $200, $300), 1 Pending ($150), and 1 Rejected ($100).
  2. Invoke reporting aggregator function.
  3. Assert total request count equals 5.
  4. Assert approved monetary sum equals $1000.00 without floating point rounding error.
* **Expected Result:** Counts and decimal sums match expected mathematical aggregates.
* **Status:** `PLANNED` (Sprint 2)

---

## 3. Integration & API Test Cases (Supertest & Database)

### TEST-INT-01: User Authentication & Cookie Lifecycle
* **Test ID:** `TEST-INT-01`
* **Test Objective:** Verify login sets an HTTP-only JWT cookie, `/api/auth/me` returns current user, and logout clears cookie.
* **Related Requirements:** FR-01, NFR-01, AC-01
* **Related Features:** `FEAT-01`
* **Preconditions:** Database seeded with active demo requester (`requester1@macau678.com`).
* **Test Steps:**
  1. Send `POST /api/auth/login` with valid email and password.
  2. Assert response status is `200` and `Set-Cookie` contains `macau678_session; HttpOnly`.
  3. Send `GET /api/auth/me` using received cookie. Assert returned user role is `REQUESTER`.
  4. Send `POST /api/auth/logout`.
  5. Assert cookie is expired/cleared.
  6. Send `GET /api/auth/me`. Assert response status is `401 Unauthorized`.
* **Expected Result:** Cookie lifecycle correctly establishes, inspects, and clears session state.
* **Status:** `PLANNED` (Sprint 1)

### TEST-INT-02: Authentication Guards & Unauthenticated Rejection
* **Test ID:** `TEST-INT-02`
* **Test Objective:** Verify that unauthenticated requests to protected endpoints are rejected with 401.
* **Related Requirements:** FR-01, BR-01, NFR-01, AC-10
* **Related Features:** `FEAT-01`, `FEAT-02`
* **Preconditions:** No session cookie provided.
* **Test Steps:**
  1. Send `GET /api/requests` with no cookie. Assert `401 Unauthorized`.
  2. Send `POST /api/requests` with no cookie. Assert `401 Unauthorized`.
  3. Send `GET /api/reports/summary` with no cookie. Assert `401 Unauthorized`.
* **Expected Result:** All protected endpoints reject unauthenticated traffic.
* **Status:** `PLANNED` (Sprint 1)

### TEST-INT-03: Purchase Request Creation & Reviewer Assignment
* **Test ID:** `TEST-INT-03`
* **Test Objective:** Verify authenticated Requester can submit a purchase request with an assigned Reviewer.
* **Related Requirements:** FR-02, FR-07, BR-01, BR-02, BR-10, AC-02
* **Related Features:** `FEAT-03`, `FEAT-04`
* **Preconditions:** Authenticated as Requester; active Reviewer ID 2 exists in DB.
* **Test Steps:**
  1. Send `POST /api/requests` with valid title, description, amount (450.00), justification, reviewerId (2), and status `PENDING_REVIEW`.
  2. Assert response status is `201 Created`.
  3. Assert returned entity contains valid `requestNumber` (`PR-2026-XXXXX`) and `status === 'PENDING_REVIEW'`.
  4. Verify record in PostgreSQL database matches submitted payload and foreign keys.
* **Expected Result:** Request is persistently saved in database and linked to submitting requester and assigned reviewer.
* **Status:** `PLANNED` (Sprint 1)

### TEST-INT-04: Requester Data Isolation & Cross-Access Blocking
* **Test ID:** `TEST-INT-04`
* **Test Objective:** Verify that a Requester can only access their own requests and cannot access another requester's data.
* **Related Requirements:** FR-03, BR-09, AC-03, AC-10
* **Related Features:** `FEAT-05`
* **Preconditions:** Requester A (ID 1) and Requester B (ID 3) exist. Request #50 belongs to Requester B.
* **Test Steps:**
  1. Authenticate as Requester A.
  2. Send `GET /api/requests`. Assert returned array contains only requests where `requesterId === 1`.
  3. Send `GET /api/requests/50` (belonging to Requester B).
  4. Assert response status is `404 Not Found` or `403 Forbidden`.
* **Expected Result:** Cross-requester data access is strictly prevented on the server.
* **Status:** `PLANNED` (Sprint 1)

### TEST-INT-05: Reviewer Queue Scoping & Assignment Isolation
* **Test ID:** `TEST-INT-05`
* **Test Objective:** Verify Reviewer only receives requests assigned to them and cannot view unassigned requests.
* **Related Requirements:** FR-03, FR-07, BR-04, BR-09, AC-04, AC-09, AC-10
* **Related Features:** `FEAT-06`
* **Preconditions:** Reviewer 1 (ID 2) and Reviewer 2 (ID 4) exist. Request #60 is assigned to Reviewer 2.
* **Test Steps:**
  1. Authenticate as Reviewer 1.
  2. Send `GET /api/requests`.
  3. Assert all returned requests have `reviewerId === 2`.
  4. Send `GET /api/requests/60` (assigned to Reviewer 2).
  5. Assert response status is `403 Forbidden`.
* **Expected Result:** Reviewers cannot inspect or access requests assigned to other reviewers.
* **Status:** `PLANNED` (Sprint 1)

### TEST-INT-06: Review Decision Execution (Approve, Reject, Return)
* **Test ID:** `TEST-INT-06`
* **Test Objective:** Verify Reviewer can execute decisions with business rule enforcement.
* **Related Requirements:** FR-04, BR-03, BR-04, BR-05, BR-07, AC-05, AC-06, AC-08, AC-09
* **Related Features:** `FEAT-07`
* **Preconditions:** Authenticated as Reviewer assigned to Request #70 (`PENDING_REVIEW`).
* **Test Steps:**
  1. Send `POST /api/requests/70/review` with `decision: 'REJECT'` and empty `reason`. Assert `400 Bad Request`.
  2. Send `POST /api/requests/70/review` with `decision: 'RETURN'` and `reason: 'Please provide alternative quotes.'`.
  3. Assert response status is `200 OK` and request status becomes `RETURNED`.
  4. Verify `RequestHistory` table records entry with action `RETURNED` and note.
  5. Attempt to review the same request again while in `RETURNED` status. Assert `409 Conflict`.
* **Expected Result:** Valid transitions update status and record history; invalid transitions and missing reasons are rejected.
* **Status:** `PLANNED` (Sprint 1)

### TEST-INT-07: Request Modification & Resubmission Enforcement
* **Test ID:** `TEST-INT-07`
* **Test Objective:** Verify that editing is permitted only on RETURNED requests and blocked on all others.
* **Related Requirements:** FR-05, BR-06, BR-07, AC-07
* **Related Features:** `FEAT-08`
* **Preconditions:** Request #80 is `PENDING_REVIEW`; Request #81 is `RETURNED`. Authenticated as owning Requester.
* **Test Steps:**
  1. Send `PATCH /api/requests/80` with updated description. Assert `409 Conflict` (editing blocked).
  2. Send `PATCH /api/requests/81` with updated amount (550.00). Assert `200 OK` (editing permitted).
  3. Send `POST /api/requests/81/submit`.
  4. Assert status transitions from `RETURNED` to `PENDING_REVIEW`.
  5. Verify `RequestHistory` records `RESUBMITTED` action.
* **Expected Result:** Only `RETURNED` requests can be edited and resubmitted.
* **Status:** `PLANNED` (Sprint 1)

### TEST-INT-08: Complete Audit History Persistence
* **Test ID:** `TEST-INT-08`
* **Test Objective:** Verify that all lifecycle transitions persist an immutable audit trail entry.
* **Related Requirements:** FR-06, BR-08, AC-11, NFR-04
* **Related Features:** `FEAT-09`
* **Preconditions:** Request created, returned, edited, resubmitted, and approved.
* **Test Steps:**
  1. Authenticate as authorized Requester or Reviewer.
  2. Send `GET /api/requests/:id/history`.
  3. Assert response contains array of chronological history objects.
  4. Verify each object contains `action`, `actorId`, `fromStatus`, `toStatus`, `reason`, and `createdAt` timestamp.
* **Expected Result:** Full historical progression is accurately retrieved in chronological order.
* **Status:** `PLANNED` (Sprint 1)

### TEST-INT-09: Request Filtering by Status and Date Range
* **Test ID:** `TEST-INT-09`
* **Test Objective:** Verify requests can be filtered by lifecycle status and creation date range.
* **Related Requirements:** FR-08, AC-12
* **Related Features:** `FEAT-10`
* **Preconditions:** Database populated with requests spanning different dates and statuses.
* **Test Steps:**
  1. Send `GET /api/requests?status=APPROVED`. Assert all returned items have status `APPROVED`.
  2. Send `GET /api/requests?startDate=2026-11-01&endDate=2026-11-03`. Assert returned items fall strictly within date range.
  3. Send `GET /api/requests?status=REJECTED&search=Office`. Assert items match both status and keyword filter.
* **Expected Result:** Database queries dynamically apply filter predicates accurately.
* **Status:** `PLANNED` (Sprint 2)

### TEST-INT-10: Reporting Summary Aggregation Endpoint
* **Test ID:** `TEST-INT-10`
* **Test Objective:** Verify `/api/reports/summary` accurately calculates status counts and total expenditure metrics.
* **Related Requirements:** FR-08, AC-12
* **Related Features:** `FEAT-11`
* **Preconditions:** Seeded requests with known amounts and statuses.
* **Test Steps:**
  1. Authenticate as Reviewer.
  2. Send `GET /api/reports/summary`.
  3. Assert HTTP status `200 OK`.
  4. Verify JSON contains keys `totalCount`, `statusCounts` (with counts for each status), and `totalAmount`.
* **Expected Result:** Summary aggregates match database totals.
* **Status:** `PLANNED` (Sprint 2)

---

## 4. Frontend Component Test Cases (React Testing Library)

### TEST-COMP-01: Login Form Rendering and Submission Handling
* **Test ID:** `TEST-COMP-01`
* **Test Objective:** Verify login component renders fields, performs client-side required field validation, and fires login callback.
* **Related Requirements:** FR-01, NFR-02, AC-01
* **Related Features:** `FEAT-01`
* **Preconditions:** Component mounted inside `AuthContext` test provider.
* **Test Steps:**
  1. Render `<Login />`.
  2. Submit form with empty inputs. Assert error messages for missing email and password appear.
  3. Type valid email and password. Click "Sign In".
  4. Verify submit button displays loading spinner and login API handler is invoked.
* **Expected Result:** Form handles validation and triggers API call with valid payload.
* **Status:** `PLANNED` (Sprint 1)

### TEST-COMP-02: Purchase Request Form & Character Counters
* **Test ID:** `TEST-COMP-02`
* **Test Objective:** Verify request form renders character counters and blocks submission when boundaries are exceeded.
* **Related Requirements:** FR-02, NFR-02, AC-02
* **Related Features:** `FEAT-03`, `FEAT-12`
* **Preconditions:** Component mounted in test harness.
* **Test Steps:**
  1. Render `<CreateRequest />`.
  2. Type a 2-character title. Verify visual warning indicates minimum 3 characters.
  3. Enter 0 or negative amount. Verify error indicator for positive amount.
  4. Fill valid fields. Verify "Save as Draft" and "Submit for Review" buttons become enabled.
* **Expected Result:** Live validation counters guide user input and prevent invalid submissions.
* **Status:** `PLANNED` (Sprint 1)

### TEST-COMP-03: Review Decision Action Modal & Mandatory Reason Enforcement
* **Test ID:** `TEST-COMP-03`
* **Test Objective:** Verify decision modal mandates a reason before enabling Reject or Return submission.
* **Related Requirements:** FR-04, BR-05, AC-06
* **Related Features:** `FEAT-07`
* **Preconditions:** Modal mounted with decision set to `RETURN`.
* **Test Steps:**
  1. Render `<ReviewDecisionModal decision="RETURN" />`.
  2. Inspect submit button; assert it is disabled while reason textarea is empty.
  3. Type whitespace only (`"   "`). Assert submit button remains disabled.
  4. Type `"Item specification requires clarification."`. Assert submit button becomes enabled.
* **Expected Result:** Modal enforces reason requirement prior to submission.
* **Status:** `PLANNED` (Sprint 1)

### TEST-COMP-04: History Timeline Presentation
* **Test ID:** `TEST-COMP-04`
* **Test Objective:** Verify history timeline component renders entries chronologically with badges and reasons.
* **Related Requirements:** FR-06, BR-08, AC-11
* **Related Features:** `FEAT-09`
* **Preconditions:** Component supplied with mock history array.
* **Test Steps:**
  1. Render `<RequestHistoryTimeline history={mockEntries} />`.
  2. Verify all actions (e.g. `CREATED`, `RETURNED`, `APPROVED`) render with corresponding status badge colors.
  3. Verify rejection/return reason text is visible inside the card.
* **Expected Result:** Timeline clearly displays historical milestones and notes.
* **Status:** `PLANNED` (Sprint 1)

### TEST-COMP-05: Dynamic Navigation Bar Role Rendering
* **Test ID:** `TEST-COMP-05`
* **Test Objective:** Verify top navigation bar displays role-appropriate links based on active user context.
* **Related Requirements:** FR-01, BR-09, AC-01
* **Related Features:** `FEAT-02`
* **Preconditions:** Navigation bar rendered with mocked `AuthContext`.
* **Test Steps:**
  1. Mount `<Navbar />` with user role `REQUESTER`.
  2. Assert "My Requests" and "+ New Request" links exist; "Review Queue" does not exist.
  3. Remount `<Navbar />` with user role `REVIEWER`.
  4. Assert "Review Queue" and "Reports" links exist; "+ New Request" does not exist.
* **Expected Result:** Navigation dynamically adapts to the authenticated role.
* **Status:** `PLANNED` (Sprint 1)

---

## 5. End-to-End Browser Test Cases (Playwright)

### TEST-E2E-01: Full Purchase Approval Journey (Draft -> Return -> Resubmit -> Approve)
* **Test ID:** `TEST-E2E-01`
* **Test Objective:** Validate the complete end-to-end purchase request lifecycle across multiple user roles in a real browser.
* **Related Requirements:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, BR-01 through BR-08, AC-01 through AC-07, AC-11
* **Related Features:** `FEAT-01` through `FEAT-09`
* **Preconditions:** PostgreSQL test container running; seed accounts available.
* **Test Steps:**
  1. Open browser at `/login`. Log in as Requester (`requester1@macau678.com`).
  2. Navigate to `/requests/new`. Fill form (Title: "Lab Equipment Renewal", Amount: "1500.00", Reviewer: "Reviewer One").
  3. Click "Submit for Review". Verify redirected to request detail page showing status badge `Pending Review`.
  4. Click "Sign Out".
  5. Log in as Reviewer (`reviewer1@macau678.com`).
  6. Navigate to `/reviewer/queue`. Locate "Lab Equipment Renewal". Click "Review".
  7. In review modal, select "Return", enter reason: "Please upload official quote before approval", and submit.
  8. Verify status updates to `Returned`. Sign out.
  9. Log back in as Requester. Open request detail. Verify "Edit Request" button is visible and reason is shown.
  10. Click "Edit Request". Update amount to "1450.00". Click "Resubmit for Review".
  11. Verify status transitions back to `Pending Review`. Sign out.
  12. Log back in as Reviewer. Open request. Click "Approve".
  13. Verify status updates to `Approved` (terminal).
  14. Inspect History Timeline tab; verify entries exist for `SUBMITTED`, `RETURNED`, `RESUBMITTED`, and `APPROVED`.
* **Expected Result:** Entire multi-user approval lifecycle completes successfully and persists across browser sessions.
* **Status:** `PLANNED` (Sprint 1)

### TEST-E2E-02: Purchase Rejection Journey with Mandatory Reason
* **Test ID:** `TEST-E2E-02`
* **Test Objective:** Validate rejection workflow, ensuring rejection requires a reason and moves request to terminal `Rejected` state.
* **Related Requirements:** FR-04, BR-05, BR-07, AC-05, AC-06
* **Related Features:** `FEAT-07`, `FEAT-09`
* **Preconditions:** Seeded pending request assigned to Reviewer.
* **Test Steps:**
  1. Log in as Reviewer.
  2. Open pending request. Click "Review".
  3. Select "Reject". Attempt to click "Confirm Rejection" without typing reason. Verify modal prevents submission.
  4. Enter reason: "Budget exhausted for current fiscal year." Submit.
  5. Verify badge updates to `Rejected` (red).
  6. Log in as Requester. Open request. Verify "Edit Request" button is NOT displayed.
* **Expected Result:** Rejection strictly requires reason and transitions request to immutable terminal state.
* **Status:** `PLANNED` (Sprint 1)

### TEST-E2E-03: Security & Authorization Boundary Checks
* **Test ID:** `TEST-E2E-03`
* **Test Objective:** Validate client and server access restrictions, direct URL protection, and prevention of self-approval.
* **Related Requirements:** BR-03, BR-04, BR-09, NFR-01, AC-08, AC-09, AC-10
* **Related Features:** `FEAT-01`, `FEAT-02`, `FEAT-06`, `FEAT-07`
* **Preconditions:** Two distinct requesters and two distinct reviewers exist in database.
* **Test Steps:**
  1. Without logging in, navigate directly to `/requester/dashboard`. Verify redirected to `/login`.
  2. Log in as Requester A. Navigate directly to `/requests/999` (belonging to Requester B).
  3. Verify access is denied with a `404 Not Found` or `403 Forbidden` error screen.
  4. Log in as Reviewer A. Navigate to a request assigned to Reviewer B.
  5. Verify review action buttons are disabled or hidden, and manual API review triggers return `403`.
* **Expected Result:** All unauthorized access attempts are blocked at both UI and server boundary levels.
* **Status:** `PLANNED` (Sprint 1)

### TEST-E2E-04: Multi-Criteria Filter & Reports Journey
* **Test ID:** `TEST-E2E-04`
* **Test Objective:** Validate dynamic filtering and aggregate reporting views in the browser.
* **Related Requirements:** FR-08, AC-12
* **Related Features:** `FEAT-10`, `FEAT-11`
* **Preconditions:** Database populated with diverse requests across statuses and dates.
* **Test Steps:**
  1. Log in as Reviewer. Navigate to `/reports`.
  2. Verify summary metric cards display total request count and financial sums.
  3. Select Status filter "Approved". Verify list updates to display only approved items.
  4. Enter Date Range inputs covering past 7 days. Verify counts update reactively.
  5. Clear filters. Verify full dataset is restored.
* **Expected Result:** Filter and report components update dynamically and display accurate aggregated data.
* **Status:** `PLANNED` (Sprint 2)

### TEST-E2E-05: Cross-Viewport Responsive Design Verification
* **Test ID:** `TEST-E2E-05`
* **Test Objective:** Validate responsive UI rendering and usability on Desktop (1280x720) and Tablet (768x1024) profiles.
* **Related Requirements:** NFR-02
* **Related Features:** `FEAT-13`, `FEAT-14`
* **Preconditions:** Playwright configured with desktop and tablet viewport emulation.
* **Test Steps:**
  1. Launch Playwright under Desktop viewport (1280x720).
  2. Verify standard navigation bar and table columns render without horizontal overflow.
  3. Launch Playwright under Tablet viewport (768x1024).
  4. Verify navigation collapses into responsive hamburger menu and tables stack gracefully.
  5. Fill and submit a purchase request on tablet viewport to confirm touch accessibility.
* **Expected Result:** Application renders cleanly across target viewports meeting usability requirements (NFR-02).
* **Status:** `PLANNED` (Sprint 3)
