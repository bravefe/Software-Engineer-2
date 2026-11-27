# Macau678 Purchase Approval System
## Lab 7 Maintenance Metrics, Release Readiness, and Final Engineering Report

**Course:** CPE 334 — Introduction to Software Engineering in the Age of AI Agents  
**Semester:** 1/2026  
**Due Date:** 29 November 2026 at 23:59 Thailand Time  
**Repository:** [https://github.com/bravefe/Software-Engineer-2](https://github.com/bravefe/Software-Engineer-2)  
**Production URL:** [https://macau678-purchase-approval-1084101367777.asia-southeast1.run.app/](https://macau678-purchase-approval-1084101367777.asia-southeast1.run.app/)  

---

### Team Members & Contributions
- **Patcharak Paipatcharakun** (GitHub: `@bravefe`, Email: `paipatcharak@gmail.com`) — Student ID: `67070503417`
- **Punnawich S.** (GitHub: `@SaintCrois`, Email: `punnawc@gmail.com`) — Student ID: `67070503434`

### Version & Commit Baseline Reference
- **Accepted Sprint 1 Baseline:** Tag `v0.2.3` / Commit `71080afe5302c4152e4895528f0a43665147ee4e` (Merged PR #63 from `lab-6`)
- **Pre-Change Document Snapshot:** Commit `47bd9bec9d3cc94bc2e07e8bf58c5f987bf1b7e0` (`docs: Test Execution Summary in sts`)
- **Pre-Change Implementation Commit:** Commit `cb84325c5dae1b975e74a92ef554331d349bf35c` (Merged PR #71 fixture fix)
- **Maintenance Implementation Commit:** Commit `7ddc741fcd6440b6658d1bd8ece913a57852896b` (Merged PR #70 on `lab-7`)
- **Maintenance Test Verification Commit:** Commit `10800cad4405e26a2d7508d0087659e06cca409d` (Branch `test/lab7-maintenance-change`)
- **Current Documentation Branch:** `docs/lab7-metrics-and-final-report` (Issue #67)

---

## Table of Contents & Evidence Navigation

| Section | Content Description | Evidence ID(s) | Primary Artefact / Reference |
| :--- | :--- | :--- | :--- |
| **Part A** | **Change Impact and Updated Contract** | `CR-L7-01`<br>`CIA-L7-01`<br>`REV-L7-01` | [change-impact-analysis.md](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/lab-7/change-impact-analysis.md)<br>[srs.md](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/srs.md)<br>[sds.md](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/sds.md)<br>[sts.md](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/sts.md) |
| **Part B** | **Implementation and Regression-Safe Delivery** | `TEST-RED-01`<br>`TEST-GRN-01`<br>`REG-L7-01`<br>`PR-L7-01` | [test-execution-report.md](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/lab-7/test-execution-report.md)<br>PR #70, PR #71, Issue #66 |
| **Part C** | **Objective Engineering Metrics** | `METRICS-L7-01`<br>`REC-M01-01`<br>`REC-M02-01` | [engineering-metrics.md](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/lab-7/engineering-metrics.md)<br>Git Log, GitHub Actions Runs |
| **Part D** | **Release Readiness and Retrospective** | `CHK-L7-01`<br>`DEBT-L7-01`<br>`RETRO-L7-01` | [release-readiness.md](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/lab-7/release-readiness.md)<br>[retrospective.md](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/lab-7/retrospective.md) |
| **Appendix** | **Team Contributions, AI Declaration & Limitations** | `APP-L7-01` | Contribution Table & AI Declaration |

---

# Part A — Change Impact and Updated Contract

### Evidence ID: `CR-L7-01` (Approved Change Request)
- **Parent Issue:** #65 / #72
- **Branch:** `docs/lab7-change-analysis` (Merged via PR #69 into `lab-7` at commit `0497f35`)
- **Status:** **APPROVED** (Instructor / TA Approved)
- **Change Type:** Sprint 1 Bounded Maintenance Behavior Change

#### Original Behavior (Sprint 1 Baseline `v0.2.3`):
Under the accepted Sprint 1 contract (SRS FR-05, BR-06), a Requester was permitted to edit a purchase request only when it was in `DRAFT` or after an assigned Reviewer returned it (`RETURNED`). If a request was currently `PENDING_REVIEW`, edits were prohibited and returned HTTP 409 (`INVALID_STATE_TRANSITION`). Requester-generated `EDITED` entries were hidden from Reviewers. Furthermore, Requesters had no mechanism to withdraw or stop a request once submitted.

#### Proposed Maintained Behavior:
The owning Requester may edit or withdraw their purchase request while it is in `PENDING_REVIEW` status.
1. **Pending Edit:** An edit to a `PENDING_REVIEW` request retains `PENDING_REVIEW` status without resetting the review queue. The updated request parameters and an `EDITED` revision history entry are visible to both the owning Requester and the assigned Reviewer.
2. **Pending Withdrawal:** An owning Requester may withdraw a `PENDING_REVIEW` request via `POST /api/requests/:id/withdraw`. This transitions the request to terminal `WITHDRAWN` status and appends a `WITHDRAWN` event to the audit trail. A withdrawn request cannot be edited, reviewed, or withdrawn again.
3. **Preserved Boundaries:** Draft, approved, and rejected behaviors remain untouched. Returned request editing and resubmission rules remain strictly intact.

---

### Evidence ID: `CIA-L7-01` (Traceable Impact Matrix)

| Architecture / Contract Area | Nature of Impact | Contract Revisions & Verification Path |
| :--- | :--- | :--- |
| **Requirements (SRS)** | FR-05, BR-06, BR-07 modified; AC-13 added; AD-10 supersedes AD-05. FR-06 clarifies revision history visibility. | Defined eligible statuses for editing/withdrawal, unchanged review state on edit, participant visibility, and terminal withdrawal behavior. |
| **System Design (SDS)** | Enums `RequestStatus` and `HistoryAction` gain `WITHDRAWN`; request edit endpoint (`PATCH /api/requests/:id`) authorization expanded; new withdrawal endpoint (`POST /api/requests/:id/withdraw`) added; state machine diagram updated. | Preserved transactional integrity, immutable audit history, role scoping, and non-self-approval rules. |
| **Acceptance Criteria** | Existing AC-07 preserved for returned flows; new AC-13 introduced for pending edit/withdrawal. | Verified both new behavior and non-regression of existing boundaries. |
| **Test Specification (STS)** | `TEST-INT-07` and `TEST-E2E-06` specified for pending edit/withdraw, role visibility, and terminal restrictions. | Specification documented in Lab 7.1; automated tests implemented in Lab 7.3 (`test/lab7-maintenance-change`). |
| **Traceability (RTM)** | FR-05, BR-06, BR-07, and AC-13 mapped to `FEAT-08` and corresponding tests. | Marked `CHANGE SPECIFIED` in 7.1; updated to `PASSED` upon 7.3 verification. |
| **Code & Data Modules** | `server/src/routes/requests.ts`, `server/src/services/historyService.ts`, client UI components, Prisma schema. | Implemented in Lab 7.2 (PR #70) with zero test tampering. |

---

### Evidence ID: `REV-L7-01` (Contract Revision Excerpts)

#### Revised SRS Excerpt (Section 4 & 5):
> **FR-05: Request Updates**  
> - The system shall allow Requesters to edit their own requests while they are `DRAFT`, `PENDING_REVIEW`, or `RETURNED`.  
> - Editing a `PENDING_REVIEW` request shall leave it pending review; the updated request details shall be visible to its Requester and assigned Reviewer.  
> - The system shall allow Requesters to withdraw their own requests while they are `PENDING_REVIEW`; a withdrawn request cannot be reviewed or edited further.  
> - The system shall prevent Requesters from editing requests that are `APPROVED`, `REJECTED`, or `WITHDRAWN`, and from withdrawing requests outside `PENDING_REVIEW`.  
>
> **BR-06:** A Requester may edit their own `DRAFT`, `PENDING_REVIEW`, or `RETURNED` request. A pending edit keeps the request in `PENDING_REVIEW` and is visible to the Requester and assigned Reviewer.  
> **BR-07:** Valid status transitions: `DRAFT -> PENDING_REVIEW`, `PENDING_REVIEW -> APPROVED`, `PENDING_REVIEW -> REJECTED`, `PENDING_REVIEW -> RETURNED`, `RETURNED -> PENDING_REVIEW`, and `PENDING_REVIEW -> WITHDRAWN`.

#### Teammate Review Sign-Off:
- **Reviewer:** Punnawich S. (`SaintCrois`)
- **Review Commit:** `a881038` (docs: approve changes)
- **Review Finding:** "Contract updates in SRS, SDS, and STS accurately reflect the approved change request. Boundaries for returned requests and reviewer access remain intact. Approved to proceed with implementation."

---

# Part B — Implementation and Regression-Safe Delivery

### Evidence ID: `TEST-RED-01` (Meaningful Failure on Old Code)
To satisfy test-first discipline, the updated verification suite was executed against the pre-change implementation commit:
- **Tested Commit:** `cb84325c5dae1b975e74a92ef554331d349bf35c` (Merge PR #71; contains isolated fixture fix, prior to feature PR #70)
- **Execution Command:** `npm run test:server`
- **Output:**
  ```text
  Test Files  2 failed | 1 passed (3)
       Tests  7 failed | 48 passed | 4 todo (59)
    Duration  8.97s
  ```
- **Analysis of Failures:**
  1. `TEST-INT-07` > `permits owning Requester to edit a PENDING_REVIEW request`: Expected `200 OK`, received `409 Conflict` (`INVALID_STATE_TRANSITION`). Proves old code actively rejected pending edits.
  2. `TEST-INT-07` > `permits owning Requester to withdraw a PENDING_REVIEW request`: Expected `403` / `200`, received `404 Not Found` (endpoint did not exist).
  3. `TEST-INT-07` > `enforces WITHDRAWN as a terminal status`: Expected `200`, received `404 Not Found`.
  4. `TEST-UNIT-03` > `permits valid lifecycle status transitions`: Assertion `Expected transition PENDING_REVIEW -> WITHDRAWN to be valid` failed (`expected false to be true`).
  5. `TEST-UNIT-03` > `enforces WITHDRAWN as a terminal status with no allowed outgoing transitions`: Failed because `VALID_STATUS_TRANSITIONS.WITHDRAWN` was undefined.

---

### Evidence ID: `TEST-GRN-01` (Implementation Passing All Changed Behaviors)
The bounded implementation was completed in branch `feat/pending-request-edit-withdrawal` and merged via PR #70 into `lab-7`.
- **Implementation Commit:** `7ddc741fcd6440b6658d1bd8ece913a57852896b`
- **Execution Command:** `npm run test:server`
- **Output:**
  ```text
  Test Files  3 passed (3)
       Tests  55 passed | 4 todo (59)
    Duration  10.16s
  ```
- **Verification Confirmation:** All 7 previously failing tests passed cleanly. Pending edits preserve `PENDING_REVIEW` status, record `EDITED` events, and display updated details to both participants. Withdrawal transitions status to `WITHDRAWN` and completely blocks subsequent reviews, edits, or repeats.

---

### Evidence ID: `REG-L7-01` (Comprehensive Regression Suite Results)

| Test Suite | Command | Executed Tests | Passed | Failed | Skipped / Todo | Execution Time | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Client Components & Session** | `npm run test:client` | 22 | 22 | 0 | 0 | 4.52s | **PASSED** |
| **Server Unit & Integration** | `npm run test:server` | 55 | 55 | 0 | 4 todo | 10.16s | **PASSED** |
| **Combined Vitest Suites** | `npm run test` | 77 | 77 | 0 | 4 todo | 10.54s | **PASSED** |
| **Playwright End-to-End** | `npm run test:e2e` | 4 | 4 | 0 | 2 skipped | 19.70s | **PASSED** |
| **Production Build & Types** | `npm run build` | 2 packages | 2 | 0 | 0 | 1.72s | **PASSED** |

#### Playwright E2E Breakdown (`tests/e2e/purchase-approval.spec.ts`):
- `TEST-E2E-01` (Draft $\rightarrow$ return $\rightarrow$ edit $\rightarrow$ resubmit $\rightarrow$ approve): **PASSED** (7.4s)
- `TEST-E2E-02` (Rejection requires reason and is terminal): **PASSED** (2.2s)
- `TEST-E2E-03` (Direct routes, cross-user isolation, self-review blocked): **PASSED** (2.0s)
- `TEST-E2E-04` (Multi-criteria filter and reports journey): **SKIPPED** (`fixme`: Sprint 2)
- `TEST-E2E-05` (Cross-viewport responsive design verification): **SKIPPED** (`fixme`: Sprint 3)
- `TEST-E2E-06` (Pending edit, reviewer queue visibility, withdrawal): **PASSED** (4.5s)

---

### Evidence ID: `PR-L7-01` (Peer Review, Integration, and CI Gate)
1. **Pull Request #70 (`feat/pending-request-edit-withdrawal`):**
   - Implemented route authorization for pending edits and withdrawal endpoint in `server/src/routes/requests.ts`.
   - Updated timeline visibility in `server/src/services/historyService.ts` and `client/src/components/HistoryTimeline.tsx`.
   - Reviewed and merged by `SaintCrois` on Fri Nov 27 02:39:11 2026 +0700.
2. **Pull Request #71 (`fix/test-false-positive-...`):**
   - Corrected fixture coupling in `createPendingRequest` helper to isolate test cases. Merged at commit `cb84325`.
3. **CI Pipeline Status:**
   - GitHub Actions workflow `auto-test.yml` and `ci-docker.yml` passed on commit `7ddc741`.

---

# Part C — Objective Engineering Metrics

### Evidence ID: `METRICS-L7-01` (Dated Engineering Metrics Table)

| Metric ID | Metric Name | Scope | Observation Window | Measured Value | Evidence Source | Relevant Run / PR / Issue |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **M-01** | Completed GitHub Issues | Core Repo | 2026-11-02 to 2026-11-27 | **12 completed** (80.0% completion) | GitHub Issue Tracker / Git Log | Issues #2, #4, #5, #6, #30, #35, #40, #46, #60, #65, #68, #71 |
| **M-02** | Merged Pull Requests | All Branches | 2026-11-04 to 2026-11-27 | **24 PRs merged** (3 in Lab 7) | Git PR Merge Log (`git log`) | PRs #12 through #70 |
| **M-03** | Automated Test Pass Rate | Maintained Scope | Snapshot 2026-11-27 | **100% active pass** (81 passed / 81 total) | Test Reports TR-L7-01, TR-L7-02 | Vitest (77 passed, 4 todo); Playwright (4 passed, 2 fixme) |
| **M-04** | UAT Defect Resolution Rate | Sprint 1 UAT | 2026-11-24 to 2026-11-25 | **100% resolved** (3/3 closed) | `document/lab-6/resolution.md` | F-01 (High), F-02 (Med), F-03 (Low) |
| **M-05** | CI Pipeline Success Rate | PR Gate Workflows | 2026-11-25 to 2026-11-27 | **83.3% initial, 100% merged** | GitHub Actions Run Logs | Workflows `auto-test.yml`, `ci-docker.yml` |

---

### Evidence ID: `REC-M01-01` & `REC-M02-01` (Embedded Reconciliation Evidence)

#### Reconciliation Table 1: Closed GitHub Issues (Metric M-01)
- Sprint 1 Foundations: Issue #2 (Docs, 2026-11-04), Issue #4 (Auth, 2026-11-04), Issue #5 (Domain, 2026-11-05), Issue #6 (Tests, 2026-11-07).
- Lab 5 Deployment: Issue #30 (Docker, 2026-11-19), Issue #35 (CI/CD, 2026-11-19).
- Lab 6 Independent UAT: Issue #40 (Handoff, 2026-11-23), Issue #46 (Partner UAT, 2026-11-24), Issue #60 (Defects, 2026-11-24).
- Lab 7 Maintenance: Issue #65 (Change Analysis, 2026-11-27), Issue #68 (Implementation, 2026-11-27), Issue #71 (Fixture Isolation, 2026-11-27).
- *Pending / Active Issues (3):* Issue #66 (Lab 7.3 verification), Issue #67 (Lab 7.4 report), Issue #72 (Lab 7 parent).  
$$\text{Formula: } \frac{12 \text{ Closed}}{15 \text{ Tracked}} = 80.0\%$$

#### Reconciliation Table 2: Merged Pull Requests (Metric M-02)
- Sprint 1 (PR #12, #14, #16, #17, #18 into `sprint-1`; PR #19 into `main`).
- Lab 5 (PR #32, #33, #34, #37 into `lab-5`; PR #38, #39 into `main`).
- Lab 6 (PR #44, #47, #61, #62, #64 into `lab-6`; PR #45, #63 into `main`).
- Sprint 2 Feature Staging (PR #57, #58 into `sprint-2`).
- Lab 7 Maintenance (PR #69, #71, #70 into `lab-7`). Total verified: 24 PRs.

---

### Evidence-Based Metrics Interpretation ($\le 100$ Words)

The metrics demonstrate strong delivery velocity (24 merged PRs, 12 completed issues, 100% UAT resolution) and zero regressions across 81 automated tests. However, CI outcomes reveal a critical engineering risk: shared test fixtures created false-positive failures during parallel branch execution (PR #71), threatening pipeline integrity. To prevent future verification stalls, the team will refactor database test seeds to enforce unique ephemeral IDs per test case, eliminating cross-case state bleeding. Owner: SaintCrois. Target Milestone: Sprint 2 Final Delivery (29 November 2026). *(77 words)*

---

# Part D — Release Readiness and Retrospective

### Evidence ID: `CHK-L7-01` (Release Readiness Checklist)

| Category | Required Evidence | Measured Finding | Status | Corrective Action & Owner |
| :--- | :--- | :--- | :---: | :--- |
| **Release Version** | Deployed commit/version | Baseline tag `v0.2.3` (`71080af`) deployed. Maintenance change on `lab-7` (`7ddc741`) pending merge to `main`. | **NOT READY** | Merge Lab 7.3 and `lab-7` into `main` (Owner: bravefe) |
| **Defects** | Open/closed by severity | 0 open defects. 3/3 closed from Lab 6 UAT (F-01 High, F-02 Medium, F-03 Low). | **READY** | Maintain active regression guards (Owner: SaintCrois) |
| **Automated Tests** | Results & failures | 77 Vitest passed (4 todo); 4 Playwright passed (2 fixme). 0 failures across 81 active tests. | **READY** | Expand coverage in Sprint 2 (Owner: SaintCrois) |
| **User Testing** | Partner UAT results | Lab 6 UAT passed 5/5 cases on revision `bqw67`. Post-maintenance UAT staged. | **NOT READY** | Conduct post-deployment live UAT (Owner: SaintCrois) |
| **Technical Debt** | Known debt register | React Router warnings (Low), Sprint 2/3 test stubs (Med), single-reviewer schema (Low). | **READY** | Scheduled for Sprint 2/3 resolution (Owner: bravefe) |
| **Configuration** | Environment & secrets | Standard env vars configured. Keyless GCP WIF used. Zero secrets in Git or client. | **READY** | Maintain secret hygiene in GCP Secret Manager |
| **Documentation** | Setup & run instructions | SRS, SDS, STS, RTM, README, and Lab 7 impact documents fully synchronized. | **READY** | Keep operational guides updated with release tags |
| **Deployment** | GCP service status | Cloud Run active on baseline. Maintenance commit `7ddc741` not yet deployed to GCP. | **NOT READY** | Trigger `deploy.yml` on main merge (Owner: bravefe) |

---

### Evidence ID: `DEBT-L7-01` (Technical Debt Register)
1. **TD-01 (React Router Deprecation Warnings):** Future-flag warnings (`v7_startTransition`, `v7_relativeSplatPath`) appear during component testing. Impact: cosmetic. Priority: Low. Action: Add flags to `BrowserRouter` in Sprint 3.
2. **TD-02 (Sprint 2/3 Stubs in Test Runners):** 4 `todo` and 2 `fixme` stubs appear in test outputs. Impact: low. Priority: Medium. Action: Implement corresponding test logic in Deliverable 2.
3. **TD-03 (Single-Reviewer Schema Constraint):** Purchase requests support a single assigned reviewer foreign key (`reviewerId`). Documented as intentional Sprint 1 scope (BR-10, AMB-01). Priority: Low.

---

### Final Release Decision

### Final Status: **NOT READY**

**Justification:**  
Under strict software engineering discipline, a release cannot be declared READY while critical integration steps remain unperformed:
1. **Parallel Verification Pending:** Verification branch `test/lab7-maintenance-change` (Issue #66, commit `10800ca`) is pending pull-request merge into `lab-7`.
2. **Main Branch Integration Pending:** Commits on `lab-7` have not been merged into `main`.
3. **GCP Production Deployment Pending:** The live Cloud Run service remains at baseline `v0.2.3`. Automated deployment via `deploy.yml` has not run for maintenance commit `7ddc741`.
The release will transition to **READY** immediately upon merging Lab 7.3, deploying to GCP, and confirming smoke tests.

---

### Evidence ID: `RETRO-L7-01` (Engineering Retrospective)

#### 1. What helped the maintenance work?
Having comprehensive contract-first documentation (Lab 7.1 change impact analysis) and existing integration tests (`TEST-INT-07`) in place clearly defined the exact state-machine boundaries and API contracts before touching any implementation code. This allowed us to immediately detect the intended behavioral difference (HTTP 409 versus HTTP 200) via automated runners without guesswork.

#### 2. What made the maintenance work difficult?
Shared test fixture coupling caused unexpected false-positive failures during test execution: multiple test cases previously asserted against the same seeded pending request record, so state modifications in one test unexpectedly broke downstream assertions in another. This required diagnosing and merging a separate fixture isolation fix (PR #71) before the maintenance feature could cleanly integrate.

#### 3. What will the team change before Final Delivery?
Before Final Delivery, the team will refactor test data setup across all integration suites so that every test case generates an isolated, ephemeral request fixture with a distinct ID, eliminating test pollution. Additionally, we will incorporate automated Playwright E2E checks directly into the GitHub Actions pull-request gate to catch regression issues prior to branch merge rather than relying on manual post-merge execution.

---

# Appendix — Compliance, AI Declaration & Limitations

### Evidence ID: `APP-L7-01`

#### Team Contribution Table
| Team Member | Lab 7 Responsibilities & Contributions | Pair Review Work |
| :--- | :--- | :--- |
| **Patcharak Paipatcharakun** (`@bravefe`) | Author of Lab 7.1 Change Request (#65), Implementation of pending edit and withdrawal in Lab 7.2 (#68), Fixture isolation fix (#71), Metrics collection (#67). | Reviewed and approved Lab 7.3 test suite updates (`10800ca`). |
| **Punnawich S.** (`@SaintCrois`) | Substantive review of Lab 7.1 Contract changes (`a881038`), Review and merge of PR #70 (`7ddc741`), Author of Lab 7.3 Verification & Regression tests (#66), Release readiness checklist (#67). | Reviewed and verified change impact analysis and release readiness checklist. |

#### AI-Use Declaration
AI assistance (Claude / Gemini agents) was utilized in accordance with course policy to assist in drafting impact documentation, structuring verification matrices, generating Playwright PDF formatting templates, and collating git commit logs. All requirements, code changes, database constraints, test executions, and release decisions were verified, triaged, and decided by human team members.

#### Known Limitations
1. **Single-Reviewer Routing (BR-10):** The system enforces single-reviewer assignments and does not support multi-tier hierarchical approvals.
2. **Pending GCP Live Verification:** Maintenance features are verified locally in Docker and Vitest/Playwright, but live GCP URL verification awaits merge to `main`.
3. **No Financial Vendor Integration:** Payment settlement and vendor procurement remain explicitly excluded from product scope.
