# Lab 7.4 Part D: Release Readiness Review & Retrospective

**Project:** Macau678 Purchase Approval System  
**Document ID:** READINESS-L7-01  
**Evaluation Scope:** Maintained Sprint 1 Scope (including Lab 7 Pending Edit & Withdrawal Maintenance Change)  
**Evaluation Date:** 2026-11-27  
**Evaluator:** Macau678 Engineering Team (`bravefe` & `SaintCrois`)  

---

## 1. Release-Readiness Checklist

The checklist below evaluates whether the maintained Sprint 1 functionality is ready for release, distinguishing verified baseline features from pending maintenance deliverables.

| Category | Required Evidence | Verification Finding & Status | Readiness Status |
| :--- | :--- | :--- | :---: |
| **Release Version** | Actual deployed version or commit | Baseline production tag is `v0.2.3` (commit `71080afe5302c4152e4895528f0a43665147ee4e`). Maintenance change implementation is integrated on `lab-7` at commit `7ddc741` (PR #70). Production release candidate commit is pending merge of Lab 7.3 PR into `main`. | **NOT READY**<br>(Pending final merge to main) |
| **Defects** | Open and closed defects by severity | 0 open blocking defects.<br>3/3 Lab 6 UAT defects closed (F-01 High: resolved; F-02 Medium: resolved; F-03 Low: resolved in UAT guide). No active regression defects reported. | **READY** |
| **Automated Tests** | Results, failures, and skipped tests | Vitest server & client suites: 77 passed, 0 failed, 4 todo.<br>Playwright E2E suite: 4 passed, 0 failed, 2 skipped (`fixme` for Sprint 2/3). Total 81 passed out of 81 active tests. Maintenance test cases verified on branch `test/lab7-maintenance-change` (TR-L7-02). | **READY** |
| **User Testing** | Relevant UAT results | Lab 6 independent partner UAT achieved 5/5 passing cases on v0.2.2 revision `bqw67`. Post-maintenance UAT for pending edit & withdrawal is staged but pending live deployment verification. | **NOT READY**<br>(Pending live UAT verification) |
| **Technical Debt** | Known debt, impact, priority, and action | 3 technical debt items identified: React Router future flag warnings (Low), todo/fixme test stubs for Sprint 2/3 scope (Medium), and single-reviewer workflow architecture (Low). None block core Sprint 1 maintenance. | **READY**<br>(Documented with disposition) |
| **Configuration** | Required environment configuration and secret handling | Server and client environments use standard environment variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`). CI/CD uses GCP Workload Identity Federation (keyless). No plaintext secrets committed in Git or client bundles. | **READY** |
| **Documentation** | Setup and execution instructions | Complete setup and execution instructions provided in `README.md`, `document/srs.md`, `document/sds.md`, `document/sts.md`, `document/traceability.md`, and `document/lab-7/change-impact-analysis.md`. | **READY** |
| **Deployment** | Deployment status and smoke-test results | Production Cloud Run service `macau678-purchase-approval` active on `v0.2.3`. Deployment of maintenance commit `7ddc741` via `deploy.yml` requires Lab 7.3 PR merge to `main`. Live smoke test against updated endpoints is pending. | **NOT READY**<br>(Pending GCP release run) |

---

## 2. Itemized Breakdown

### 2.1 Known Defects
- **Total Open Defects:** 0
- **Total Closed Defects:** 3 (from Lab 6 UAT)
  - `F-01` (Severity: HIGH) — *Draft Privacy Breach*: Reviewers could inspect or open saved draft requests. Fixed in PR #61; verified on revision `macau678-migrate-bqw67`.
  - `F-02` (Severity: MEDIUM) — *Audit Timeline Visibility*: Direct submit omitted `CREATED` for requesters, and resubmit notes did not aggregate edit notes. Fixed in PR #61; verified on revision `macau678-migrate-bqw67`.
  - `F-03` (Severity: LOW) — *UAT Specification Mismatch*: UAT instructions mismatched live field labels and status badge. Fixed in `document/lab-6/UAT_TEST_CASES.md`.

### 2.2 Technical Debt Register

| Debt ID | Item & Description | Impact | Priority | Disposition / Corrective Action | Owner & Milestone |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **TD-01** | **React Router v6 Deprecation Flags**<br>Console warnings regarding `v7_startTransition` and `v7_relativeSplatPath` appear during client component test runs. | Low impact; does not cause test failures or runtime breakages in React 18. | Low | Add future flags to `BrowserRouter` in `client/src/main.tsx` before upgrading router packages. | bravefe<br>Sprint 3 |
| **TD-02** | **Sprint 2/3 Test Stubs in Active Suites**<br>4 `todo` tests in Vitest (`TEST-INT-09`, `TEST-INT-10`, `TEST-UNIT-05`, `TEST-UNIT-06`) and 2 `fixme` E2E journeys (`TEST-E2E-04`, `TEST-E2E-05`). | Low impact; clearly segregated from Sprint 1 execution, but clutter test summary outputs. | Medium | Implement corresponding test logic alongside feature delivery in Deliverable 2 / Sprint 2. | SaintCrois<br>Deliverable 2 |
| **TD-03** | **Single-Reviewer Schema Constraint (BR-10)**<br>Single foreign key `reviewerId` on purchase requests prevents multi-stage sequential approvals. | Intended baseline limitation; documented in SRS AMB-01 and architecture decisions. | Low | Retain for Sprint 1/2; evaluate multi-tier approval tables in future product expansions. | bravefe<br>Post-Sprint 3 |

### 2.3 Unverified Items & Corrective Action Plan

For every item marked **NOT READY**, specific corrective actions and owners are assigned:

| Unverified Item | Reason Unverified | Corrective Action Required | Assigned Owner | Target Milestone |
| :--- | :--- | :--- | :---: | :---: |
| **Lab 7.3 Test Branch Merge** | PR for branch `test/lab7-maintenance-change` (Issue #66) is pending review and merge into `lab-7`. | Conduct peer review of commit `10800ca`, verify CI test runs, and merge PR into `lab-7`. | SaintCrois / bravefe | Lab 7.3 Integration (Immediate) |
| **Main Staging Integration** | Maintenance commits on `lab-7` have not been merged into `main`. | Create release PR from `lab-7` to `main`, verify automated PR checks, and merge. | bravefe | Pre-release Staging (2026-11-28) |
| **Production Cloud Run Deployment** | Automatic deployment pipeline (`deploy.yml`) has not been triggered for maintenance commit `7ddc741`. | Trigger `deploy.yml` upon merge to `main`, verify Cloud Run migration job, and observe successful deployment summary. | bravefe | Release Deployment (2026-11-28) |
| **Live Production Smoke Testing** | Endpoint `POST /api/requests/:id/withdraw` and pending edit visibility unverified on live GCP URL. | Run `deploy/smoke_test.py` against live service URL and execute manual smoke test of pending edit and withdrawal. | SaintCrois | Release Deployment (2026-11-28) |

---

## 3. Final Release Decision

### Status: **NOT READY**

### Justification:
While the code implementation for Lab 7.2 (pending request edit and withdrawal) has been merged into `lab-7` (commit `7ddc741`) and the automated verification suite passes completely on branch `test/lab7-maintenance-change` (TR-L7-02: 81 passing tests, 0 failures), the release cannot be declared READY at this snapshot for the following objective reasons:
1. **Parallel Work Dependency:** The verification PR for Lab 7.3 (Issue #66, commit `10800ca`) is currently pending peer review and has not yet been merged into `lab-7`.
2. **Pending Main Integration:** The `lab-7` maintenance branch has not been merged into `main`. Under our engineering contract and CI/CD policy, only commits merged into `main` trigger production GCP container builds and deployments.
3. **Absence of Live GCP Deployment Evidence:** The live application at `https://macau678-purchase-approval-1084101367777.asia-southeast1.run.app/` is currently running baseline version `v0.2.3` (commit `71080af`). The new withdrawal route and pending edit logic are not yet deployed or smoke-tested in production.

Declaring this release READY prematurely would violate course integrity and sound software engineering practice. The status will transition to **READY** immediately upon merging the Lab 7.3 PR, integrating to `main`, and verifying the live GCP deployment.
