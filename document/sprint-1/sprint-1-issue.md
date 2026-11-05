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

# Issue 4: Authentication

- **Branch:** `feature/authentication`
- **Feature scope:** `FEAT-01` - User Authentication & Session Lifecycle; `FEAT-02` - Role-Based Access Control (RBAC) & Route Authorization
- **Dependencies:** Issue 3
- **Test IDs:** `TEST-UNIT-01`, `TEST-UNIT-02`, `TEST-UNIT-04`, `TEST-INT-01`, `TEST-INT-02`, `TEST-INT-04`, `TEST-INT-05`, `TEST-INT-06`, `TEST-COMP-01`, `TEST-COMP-05`

## Description

Implement secure authentication, logout, session restoration, and role-based access control for Requesters and Reviewers. Enforce authentication and authorization across server endpoints and client-side navigation.

Implement and run automated unit, API integration, and frontend component tests to verify password security, session lifecycle, authorization boundaries, and role-appropriate UI behavior.

## Tasks

- [ ] Implement login and logout endpoints and credential verification.
- [ ] Implement secure password hashing using bcrypt and password verification.
- [ ] Maintain the authenticated session using the specified secure cookie.
- [ ] Implement current-user retrieval and session restoration.
- [ ] Reject inactive accounts and unauthenticated access to protected endpoints.
- [ ] Define and enforce the `REQUESTER` and `REVIEWER` roles.
- [ ] Add server-side role and authorization checks for protected operations.
- [ ] Protect client routes and show role-appropriate navigation and actions.
- [ ] Return appropriate unauthorized/forbidden responses and handle them in the UI.
- [ ] Implement the login form, including required field validation, API submission, loading states, and error handling.
- [ ] Test password hashing and verification using bcrypt.
- [ ] Test role-based authorization for permitted and unauthorized roles.
- [ ] Test prevention of self-approval and mandatory reasons for rejection and return decisions.
- [ ] Test login, session cookie creation, user authentication, logout, and inactive account restrictions.
- [ ] Test that unauthenticated users cannot access protected API endpoints.
- [ ] Test that Requesters can only access their own purchase requests.
- [ ] Test that Reviewers can only access requests assigned to them.
- [ ] Test review authorization and business rules for approval, rejection, and review decisions.
- [ ] Test login form rendering, required field validation, API submission, and error handling.
- [ ] Test role-based navigation and protected route authorization for different user roles.

## Acceptance criteria

- Users can log in, restore their session, and log out; invalid credentials and inactive accounts are rejected.
- Passwords are securely hashed using bcrypt and verified correctly.
- The system identifies the user's role and enforces server-side authorization.
- Unauthenticated users and users with unauthorized roles cannot access protected operations or routes.
- Requesters can only access their own purchase requests, and Reviewers can only access requests assigned to them.
- The system prevents self-approval and requires reasons for rejection and return decisions.
- Login validation, loading states, and error feedback work correctly.
- All specified unit, API integration, and frontend component tests pass.

---

# Issue 5: Purchase Request & Approval Workflow

- **Branch:** `feature/domain-workflow`
- **Feature scope:** `FEAT-03` Purchase Request Creation & Draft Management; `FEAT-04` Reviewer Assignment & Routing; `FEAT-05` Requester Request Tracking & Personal Dashboard; `FEAT-06` Reviewer Queue & Assignment Scope Enforcement; `FEAT-07` Review Decision Processing; `FEAT-08` Request Modification & Resubmission Workflow; `FEAT-09` Request Audit Trail & History Tracking.
- **Dependencies:** Issue 3; Issue 4 for authentication and authorization
- **Test IDs:** `TEST-UNIT-03`, `TEST-INT-03`, `TEST-INT-07`, `TEST-INT-08`, `TEST-COMP-02`–`TEST-COMP-04`

## Description

Deliver the Sprint 1 purchase approval workflow: a Requester drafts or submits a request assigned to a Reviewer; both roles see only their permitted requests; an assigned Reviewer approves, rejects, or returns a request; the Requester may edit and resubmit only a returned request; and lifecycle changes are recorded in an audit history.

Implement and run automated tests for purchase request creation, assignment, request lifecycle transitions, review decisions, returned-request resubmission, and audit history.

## Tasks

- [ ] Implement request creation, draft saving, submission, request numbering, and reviewer lookup/assignment.
- [ ] Implement a Requester's personal request list and a Reviewer queue scoped to the current user.
- [ ] Implement approve, reject, and return decisions with assigned-reviewer, no-self-approval, reason, and valid-transition rules.
- [ ] Allow editing and resubmission only for `RETURNED` requests.
- [ ] Persist and display chronological history for request creation, submission, edits, resubmission, and review decisions.
- [ ] Implement the corresponding forms, lists, detail views, navigation, and loading/empty/error states.
- [ ] Test valid and invalid purchase request lifecycle transitions.
- [ ] Test request creation, draft saving, submission, reviewer assignment, and request persistence.
- [ ] Test approval, rejection, and return decisions, including mandatory reasons and invalid transitions.
- [ ] Test editing and resubmission restrictions for returned requests.
- [ ] Test audit history persistence and chronological ordering.
- [ ] Test the corresponding frontend components for request forms, lists, and detail views.

## Acceptance criteria

- Requesters can create, submit, track, and edit/resubmit returned requests; drafts and request data remain scoped to authorized users.
- Requests are assigned to an eligible Reviewer, who can review only assigned requests and approve, reject, or return them according to workflow rules.
- The system prevents self-review, invalid edits/transitions, and unauthorized access.
- Request history is persisted and displayed chronologically with actors, actions, status changes, timestamps, and reasons.
- The complete workflow works through the UI and persists in the database.
- All specified unit, API integration, and frontend component tests pass.

---

# Issue 6: Integration & End-to-End Tests

- **Branch:** `test/integration-tests`
- **Feature scope:** Integrated verification of `FEAT-01`–`FEAT-09`
- **Dependencies:** Issues 4 and 5
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
