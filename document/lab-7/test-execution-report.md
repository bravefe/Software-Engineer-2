# Lab 7 Test Execution Report

## TR-L7-01: Baseline Change Failure Report (Historical)

**Report:** TR-L7-01  
**Execution date:** 2026-11-27  
**Test command(s):** `npm run test`, `npm run test:all`  
**Scope:** Vitest server and client test suites  
**Result:** The recorded `npm run test:all` execution produced the expected failure in the legacy pending edit assertion.

### Summary

The terminal record shows an initial `npm run test` on `docs/lab7-change-analysis`, followed later by `npm run test:all` on `feat/pending-request-edit-withdrawal`. The initial run passed: all 6 files, with 70 tests passing and 4 todo. On the feature branch, Vitest reported 5 files passed and one failure in `tests/server/integration.test.ts` (69 passed, 1 failed, 4 todo).

The failing case is `TEST-INT-07`, whose old assertion expects editing a `PENDING_REVIEW` request to return HTTP 409 (`INVALID_STATE_TRANSITION`). It received HTTP 200. This is the expected test failure for the Lab 7 behavior change: the change-impact analysis proposes allowing the owning Requester to edit a pending request, retaining `PENDING_REVIEW` status. The test still asserts the original Sprint 1 rule, which prohibited that edit.

---

## TR-L7-02: Lab 7.3 Maintenance Implementation & Regression Verification

**Report:** TR-L7-02  
**Execution date:** 2026-11-27  
**Branch:** `test/lab7-maintenance-change`  
**Related Issue:** #66 (Lab 7.3 Verify and Release the Pending Request Change)  
**Parent Issue:** #72 (Lab 7)  
**Prerequisite Feature:** Issue #68 (PR #70 commit `7ddc741`)  
**Prerequisite Fixture Fix:** Issue #71 (PR #71 commit `cb84325`)  

### 1. Verification Objectives

1. Verify `TEST-INT-07` covers pending request editing, review status preservation, Requester/Reviewer visibility, unauthorized edit blocking, requester withdrawal to `WITHDRAWN`, and terminal state protection.
2. Verify unit tests in `tests/server/unit.test.ts` cover `WITHDRAWN` state transitions, outgoing transition blocking (terminal status), and entry only from `PENDING_REVIEW`.
3. Verify component tests in `tests/client/components.test.tsx` cover `WITHDRAWN` timeline badge rendering.
4. Verify end-to-end user journey in `tests/e2e/purchase-approval.spec.ts` under `TEST-E2E-06` covering pending edits, Reviewer queue inspection, withdrawal, non-actionability, and unaffected workflows.
5. Capture test-first RED/GREEN evidence comparing pre-change implementation commit `cb84325` against updated implementation commit `7ddc741`.
6. Run full regression suite (Unit, Component, Integration, E2E, Build/Type-Check) and confirm clean zero-failure delivery.

---

### 2. Test-First RED/GREEN Evidence

#### 2.1 RED Evidence (Pre-Change Implementation)
- **Commit:** `cb84325c5dae1b975e74a92ef554331d349bf35c` (Merge pull request #71; contains isolated fixture fix, precedes feature PR #70)
- **Command:** `npm run test:server`
- **Execution Output:**
  ```text
  Test Files  2 failed | 1 passed (3)
       Tests  7 failed | 48 passed | 4 todo (59)
    Duration  8.97s
  ```
- **Failures Identified (Behavior Absent):**
  1. `tests/server/integration.test.ts` > `TEST-INT-07` > `permits owning Requester to edit a PENDING_REVIEW request...`
     - **Assertion:** `expected 409 to be 200`
     - **Cause:** Pre-change server routes actively rejected pending edits with HTTP 409 `INVALID_STATE_TRANSITION`.
  2. `tests/server/integration.test.ts` > `TEST-INT-07` > `permits owning Requester to withdraw a PENDING_REVIEW request...`
     - **Assertion:** `expected 404 to be 403`
     - **Cause:** `POST /api/requests/:id/withdraw` endpoint did not exist in pre-change routes.
  3. `tests/server/integration.test.ts` > `TEST-INT-07` > `enforces WITHDRAWN as a terminal status...`
     - **Assertion:** `expected 404 to be 200`
     - **Cause:** `POST /api/requests/:id/withdraw` endpoint did not exist.
  4. `tests/server/integration.test.ts` > `TEST-INT-07` > `blocks withdrawal of non-pending requests and protects terminal states...`
     - **Assertion:** `expected 404 to be 409`
     - **Cause:** `POST /api/requests/:id/withdraw` endpoint did not exist.
  5. `tests/server/unit.test.ts` > `TEST-UNIT-03` > `permits valid lifecycle status transitions`
     - **Assertion:** `Expected transition PENDING_REVIEW -> WITHDRAWN to be valid: expected false to be true`
     - **Cause:** `VALID_STATUS_TRANSITIONS` lacked `WITHDRAWN`.
  6. `tests/server/unit.test.ts` > `TEST-UNIT-03` > `enforces WITHDRAWN as a terminal status with no allowed outgoing transitions`
     - **Assertion:** `expected undefined to deeply equal []`
     - **Cause:** `VALID_STATUS_TRANSITIONS.WITHDRAWN` was undefined.
  7. `tests/server/unit.test.ts` > `TEST-UNIT-03` > `restricts withdrawal transition exclusively to PENDING_REVIEW status`
     - **Assertion:** `expected false to be true`
     - **Cause:** Transition `PENDING_REVIEW -> WITHDRAWN` was rejected.

#### 2.2 GREEN Evidence (Updated Implementation)
- **Commit:** `7ddc741fcd6440b6658d1bd8ece913a57852896b` / HEAD (`test/lab7-maintenance-change`)
- **Command:** `npm run test:server`
- **Execution Output:**
  ```text
  Test Files  3 passed (3)
       Tests  55 passed | 4 todo (59)
    Duration  10.16s
  ```
- **Confirmation:** All 7 previously failing tests passed cleanly. Pending edit preserves `PENDING_REVIEW` status, updates database values, and exposes edit events to Requester and assigned Reviewer while denying unassigned reviewers. Withdrawal creates `WITHDRAWN` status and history entry, and blocks subsequent review/edit/withdrawal actions.

---

### 3. Regression Test Execution Results

| Suite | Command | Files | Passed | Failed | Skipped / Todo | Duration | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Client Component & Session | `npm run test:client` | 3 / 3 | 22 | 0 | 0 | 4.52s | **PASSED** |
| Server Unit, Health & Integration | `npm run test:server` | 3 / 3 | 55 | 0 | 4 todo | 10.16s | **PASSED** |
| Combined Vitest Suites | `npm run test` | 6 / 6 | 77 | 0 | 4 todo | 10.54s | **PASSED** |
| Playwright End-to-End Suite | `npm run test:e2e` | 1 / 1 | 4 | 0 | 2 skipped | 19.7s | **PASSED** |
| Production Build & Type-Check | `npm run build` | 2 packages | 2 | 0 | 0 | 1.72s | **PASSED** |

#### Playwright Detailed Breakdown (`tests/e2e/purchase-approval.spec.ts`):
- `TEST-E2E-01: draft to return to resubmit to approval, with persisted history` — **PASSED** (7.4s)
- `TEST-E2E-02: rejection requires a reason and remains terminal` — **PASSED** (2.2s)
- `TEST-E2E-03: direct routes, ownership, assignment, and self-review are blocked` — **PASSED** (2.0s)
- `TEST-E2E-04: multi-criteria filter and reports journey` — **SKIPPED** (`fixme`: Sprint 2 scope)
- `TEST-E2E-05: cross-viewport responsive design verification` — **SKIPPED** (`fixme`: Sprint 3 scope)
- `TEST-E2E-06: pending request edit, reviewer visibility, withdrawal, and terminal protection` — **PASSED** (4.5s)

---

### 4. Traceability & Acceptance Criteria Verification

- **FR-05 (Request Updates):** Verified by `TEST-UNIT-03`, `TEST-INT-07`, and `TEST-E2E-06`. Requesters edit pending requests without status restart; Requesters withdraw pending requests to terminal `WITHDRAWN`.
- **FR-06 (Request History):** Verified by `TEST-INT-07`, `TEST-INT-08`, and `TEST-E2E-06`. Revision history entries and `WITHDRAWN` entries are persisted and visible to both Requester and assigned Reviewer.
- **BR-06 (Editing Rules):** Verified by `TEST-INT-07` and `TEST-E2E-06`. Owning Requester edits pending requests; cross-requester edits and reviewer edits are blocked.
- **BR-07 (Lifecycle State Transitions):** Verified by `TEST-UNIT-03`, `TEST-INT-07`, and `TEST-E2E-06`. Valid transitions include `PENDING_REVIEW -> WITHDRAWN`. `WITHDRAWN` has 0 outgoing transitions.
- **AC-13 (Pending Edit and Withdrawal Acceptance Criteria):** Fully verified across Unit, Integration, and E2E tiers.
- **Regression Invariance:** Draft privacy, returned-request edit/resubmit, reviewer assignment checks, non-self-approval checks, and approval/rejection workflows remained fully intact with zero regressions.

---

### 5. Review, CI, Release, and Post-Deployment Checks

1. **Teammate Code Review:**
   - Implementation PR #70 merged by reviewer `SaintCrois` on Fri Nov 27 02:39:11 2026 +0700.
   - Pre-requisite fixture correction PR #71 (`createPendingRequest` isolation fix) preserved intact.
2. **CI Pipeline Status:**
   - CI workflow defined in `.github/workflows/pr-checks.yml` covers linting, building, and automated tests.
3. **Release & Deployment Verification:**
   - Clean compilation: TypeScript strict mode check (`tsc -p tsconfig.json` for server, `tsc -b` for client) completed with 0 errors.
   - Docker service health: `macau678-db`, `macau678-server`, and `macau678-client` healthy and responsive.
   - Live HTTP health probe: `GET http://localhost:3000/api/health` returned `{"status":"ok","database":"connected"}`.
4. **Conclusion:**
   - Issue #66 (Lab 7.3) verification is complete and regression-safe.
   - The test suite and documentation are fully synchronized and ready for final branch delivery.
