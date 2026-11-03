# Issue 1: Project Planning & Documentation

- **Issue:** #2
- **PR:** #10
- **Branch:** `docs/sprint-1-planing`
- **Test IDs:** N/A (planning/documentation review)

## Description

Establish project context, team responsibilities, scope, and the Sprint 1 development plan for the Macau678 Purchase Approval System.

## Tasks

- [ ] Document project context, objectives, and scope.
- [ ] Prepare the Sprint 1 plan and task allocation.
- [ ] Document issue dependencies and target branches.
- [ ] Keep the sprint plan and issue list aligned with the project requirements and delivery schedule.

## Acceptance criteria

- Project context, scope, Sprint 1 work, dependencies, schedule, and task allocation are documented.
- Issues have clear descriptions, tasks, and acceptance criteria; planning documents are committed and accessible.

---

# Issue 2: SRS, SDS & Feature Traceability

- **Branch:** `docs/srs-sds`
- **Dependencies:** Issue 1
- **Test IDs:** N/A (documentation consistency review)

## Description

Prepare the requirements and design documentation and keep the feature inventory, traceability, and test specification consistent with the purchase approval workflow.

## Tasks

- [ ] Complete the Software Requirements Specification (SRS).
- [ ] Document the feature inventory, priorities, sprint allocation, and dependencies.
- [ ] Prepare the requirements traceability matrix.
- [ ] Complete the System Design Specification (SDS) for the application architecture and components.
- [ ] Prepare the test specification and map tests to the requirements and features.
- [ ] Verify consistency across the SRS, SDS, feature inventory, traceability matrix, test specification, and plan.

## Acceptance criteria

- The SRS, SDS, feature inventory, traceability matrix, and test specification are complete and consistent.
- Requirements, features, tests, and acceptance criteria are traceable across the documents.
- Documentation is committed and accessible to the team.

---

# Issue 3: Initial Project Setup & Routing

- **Branch:** `init/server-client-db-routing`
- **Dependencies:** Issue 2
- **Test IDs:** N/A (setup smoke checks are not numbered in `test.md`)

## Description

Establish the application structure and configure the client, server, database, and client-side routing so the Sprint 1 features can be developed and run together.

## Tasks

- [ ] Initialize the project structure and required development scripts.
- [ ] Configure the server, client, and database connection.
- [ ] Set up initial client-side routing.
- [ ] Verify client-server communication and database connectivity.
- [ ] Document reproducible setup and run instructions.

## Acceptance criteria

- Client, server, database, and initial routes run and communicate as expected.
- Setup instructions enable another team member to run the project.

---

# Issue 4: User Authentication & Session Lifecycle

- **Branch:** `feature/authentication`
- **Feature scope:** `FEAT-01` — User Authentication & Session Lifecycle
- **Dependencies:** Issue 3
- **Test IDs:** `TEST-UNIT-01`, `TEST-INT-01`, `TEST-INT-02`, `TEST-COMP-01`

## Description

Implement secure login, logout, session restoration, and authenticated user state for Requesters and Reviewers.

## Tasks

- [ ] Implement login and logout endpoints and credential verification.
- [ ] Maintain the authenticated session using the specified secure cookie.
- [ ] Implement current-user retrieval and session restoration.
- [ ] Integrate authentication with the client, including login UI and loading/error states.
- [ ] Reject invalid credentials and unauthenticated access to protected endpoints.

## Acceptance criteria

- Users can log in, restore their session, and log out; invalid credentials and unauthenticated access are rejected.
- The system identifies the user's role and displays login validation, loading, and error feedback.

---

# Issue 5: Role-Based Access Control & Route Authorization

- **Branch:** `feature/role-based-access`
- **Feature scope:** `FEAT-02` — Role-Based Access Control (RBAC) & Route Authorization
- **Dependencies:** Issue 4
- **Test IDs:** `TEST-UNIT-02`, `TEST-INT-02`, `TEST-COMP-05`, `TEST-E2E-03`

## Description

Enforce the Requester and Reviewer permission boundaries in server endpoints and client navigation. Unauthenticated users must be rejected; authenticated users must not access routes or operations outside their role.

## Tasks

- [ ] Define and enforce the `REQUESTER` and `REVIEWER` roles.
- [ ] Add server-side role and authorization checks for protected operations.
- [ ] Protect client routes and show role-appropriate navigation and actions.
- [ ] Return appropriate unauthorized/forbidden responses and handle them in the UI.
- [ ] Verify that authorization is enforced by the server, not only hidden in the interface.

## Acceptance criteria

- Server-side authorization blocks unauthenticated users and disallowed roles, including direct requests.
- Routes, navigation, and actions reflect the authenticated user's role.

---

# Issue 6: Purchase Request & Approval Workflow

- **Branch:** `feature/domain-workflow`
- **Feature scope:** `FEAT-03` Purchase Request Creation & Draft Management; `FEAT-04` Reviewer Assignment & Routing; `FEAT-05` Requester Request Tracking & Personal Dashboard; `FEAT-06` Reviewer Queue & Assignment Scope Enforcement; `FEAT-07` Review Decision Processing; `FEAT-08` Request Modification & Resubmission Workflow; `FEAT-09` Request Audit Trail & History Tracking.
- **Dependencies:** Issue 3; Issues 4 and 5 for authenticated, authorized workflows
- **Test IDs:** `TEST-UNIT-03`, `TEST-UNIT-04`, `TEST-INT-03`–`TEST-INT-08`, `TEST-COMP-02`–`TEST-COMP-04`, `TEST-E2E-01`, `TEST-E2E-02`

## Description

Deliver the Sprint 1 purchase approval workflow: a Requester drafts or submits a request assigned to a Reviewer; both roles see only their permitted requests; an assigned Reviewer approves, rejects, or returns a request; the Requester may edit and resubmit only a returned request; and lifecycle changes are recorded in an audit history.

## Tasks

- [ ] Implement request creation, draft saving, submission, request numbering, and reviewer lookup/assignment.
- [ ] Implement a Requester's personal request list and a Reviewer queue scoped to the current user.
- [ ] Implement approve, reject, and return decisions with assigned-reviewer, no-self-approval, reason, and valid-transition rules.
- [ ] Allow editing and resubmission only for `RETURNED` requests.
- [ ] Persist and display chronological history for request creation, submission, edits, resubmission, and review decisions.
- [ ] Implement the corresponding forms, lists, detail views, navigation, and loading/empty/error states.

## Acceptance criteria

- Requesters can create, submit, track, and edit/resubmit returned requests; drafts and request data remain scoped to authorized users.
- Requests are assigned to an eligible Reviewer, who can review only assigned requests and approve, reject, or return them according to workflow rules.
- The system prevents self-review, invalid edits/transitions, and unauthorized access.
- Request history is persisted and displayed chronologically with actors, actions, status changes, timestamps, and reasons.
- The complete workflow works through the UI and persists in the database.

---

# Issue 7: Authentication & Authorization Tests

- **Branch:** `test/authentication-tests`
- **Feature scope:** Verification for `FEAT-01` and `FEAT-02`
- **Dependencies:** Issues 4 and 5
- **Test IDs:** `TEST-UNIT-01`, `TEST-UNIT-02`, `TEST-INT-01`, `TEST-INT-02`, `TEST-COMP-01`, `TEST-COMP-05`

## Description

Implement and run automated tests for authentication/session lifecycle and role-based access, including unauthenticated requests and role-appropriate UI behavior.

## Tasks

- [ ] Test password hashing and verification.
- [ ] Test login, current-user retrieval, logout, and cookie lifecycle.
- [ ] Test rejection of unauthenticated requests and authorization by role.
- [ ] Test login form behavior and role-based navigation.

## Acceptance criteria

- Tests cover password verification, login/session/logout, unauthenticated access, and server-side role authorization.
- Component tests cover login form behavior and role-based navigation; test results are reported accurately.

---

# Issue 8: Domain Workflow & API Tests

- **Branch:** `test/domain-workflow-tests`
- **Feature scope:** Verification for `FEAT-03`–`FEAT-09`
- **Dependencies:** Issue 6
- **Test IDs:** `TEST-UNIT-03`, `TEST-UNIT-04`, `TEST-INT-03`–`TEST-INT-08`

## Description

Implement and run tests for purchase request creation, assignment, data isolation, reviewer decisions, returned-request resubmission, and audit history.

## Tasks

- [ ] Test valid and invalid lifecycle transitions and review business rules.
- [ ] Test request creation, reviewer assignment, and request persistence.
- [ ] Test Requester isolation and Reviewer assignment scoping.
- [ ] Test approve/reject/return decisions, mandatory reasons, and invalid transitions.
- [ ] Test editing and resubmission restrictions and audit history persistence.
- [ ] Cover successful approval in the review-decision API tests.

## Acceptance criteria

- Tests cover request creation, assignment, role-based scoping, review decisions, resubmission, and audit history.
- Invalid access, self-review, transitions, and edits are rejected; successful operations persist expected data and history.
- Test results are reported accurately, including failures.

---

# Issue 9: Integration & End-to-End Tests

- **Branch:** `test/integration-tests`
- **Feature scope:** Integrated verification of `FEAT-01`–`FEAT-09`
- **Dependencies:** Issues 5 and 6
- **Test IDs:** `TEST-E2E-01`–`TEST-E2E-03`

## Description

Verify that authentication, authorization, request workflows, database persistence, and history work together across the complete Sprint 1 user journeys.

## Tasks

- [ ] Test the complete draft-to-return-to-resubmit-to-approve journey.
- [ ] Test rejection with a mandatory reason and terminal-state behavior.
- [ ] Test direct-route protection and cross-user/assignment authorization boundaries.
- [ ] Test that a user cannot review or approve their own request.
- [ ] Run the relevant unit, API, component, and E2E regression tests against the integrated application.

## Acceptance criteria

- End-to-end tests verify login, request submission/tracking, assigned review, decisions, and returned-request resubmission.
- Unauthorized access, self-review, and review of another Reviewer's requests are blocked; history reflects workflow changes.
- E2E and applicable regression tests pass, and discovered defects are tracked.
