# Lab 7.4 Part C: Objective Engineering Metrics

**Project:** Macau678 Purchase Approval System  
**Document ID:** METRICS-L7-01  
**Observation Snapshot Date:** 2026-11-27  
**Scope:** Macau678 Core Repository (`https://github.com/bravefe/Software-Engineer-2`)  
**Parent Issue:** #72 (Lab 7 Sprint 1 Maintenance)  
**Related Issues:** #65 (Lab 7.1), #68 (Lab 7.2), #66 (Lab 7.3), #67 (Lab 7.4)  

---

## 1. Engineering Metrics Overview

The following five dated engineering metrics measure the velocity, defect resolution, verification quality, and release stability of the Macau678 Purchase Approval System through Sprint 1, Lab 5 (GCP Deployment & CI/CD), Lab 6 (Independent UAT & Defect Management), and Lab 7 (Sprint 1 Maintenance).

### Compact Metrics Summary Table

| Metric ID | Metric Name & Definition | Scope of Measurement | Observation Period / Snapshot Date | Actual Measured Value | Evidence Source | Relevant Issue / PR / Run ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M-01** | **Completed GitHub Issues**<br>Count of closed and verified work tracking issues in project scope (excluding cancelled/invalid). | Macau678 GitHub Repository (`bravefe/Software-Engineer-2`) | 2026-11-02 to 2026-11-27 (Sprint 1 through Lab 7.2) | **12 issues completed** (12 closed / 15 tracked; 80.0% completion rate) | GitHub Issue Tracker / Git commit logs | Issues #2, #4, #5, #6, #30, #35, #40, #46, #60, #65, #68, #71 |
| **M-02** | **Merged Pull Requests**<br>Count of peer-reviewed and integrated pull requests into active branches. | Macau678 GitHub Repository (`main`, `lab-5`, `lab-6`, `lab-7`, `sprint-1`) | 2026-11-04 to 2026-11-27 (Sprint 1 through Lab 7.2) | **24 PRs merged** (3 in Lab 7 maintenance cycle: PR #69, #71, #70) | Git merge log (`git log --grep="Merge pull request"`) | PRs #12, #14, #16, #17, #18, #19, #32, #33, #34, #37, #38, #39, #44, #45, #47, #57, #58, #61, #62, #64, #63, #69, #71, #70 |
| **M-03** | **Automated Test Execution Pass Rate**<br>Ratio and count of passed versus total automated unit, integration, and E2E tests on maintained scope. | Backend (Vitest) & Frontend (React Testing Library + Playwright E2E) | Snapshot 2026-11-27 (Commit `7ddc741` / `10800ca`) | **100% pass on active tests**<br>Vitest: 77 passed, 0 failed, 4 todo.<br>Playwright: 4 passed, 0 failed, 2 skipped (`fixme`). Total: 81 passed / 81 executed (100%). | Test Execution Reports `TR-L7-01` & `TR-L7-02` | Issue #66, Commits `cb84325` (RED) and `7ddc741` / `10800ca` (GREEN) |
| **M-04** | **UAT Defect Resolution Rate**<br>Proportion of triaged independent user acceptance test defects successfully resolved and retested. | Sprint 1 Baseline UAT Finding Register | 2026-11-24 to 2026-11-25 (Lab 6 UAT & Resolution) | **100% resolved**<br>(3 resolved / 3 received: F-01 High, F-02 Medium, F-03 Low; 0 open defects) | `document/lab-6/resolution.md` & `defect_correction.md` | Issue #60, PR #61, Tested Revisions `macau678-migrate-5ms22` & `bqw67` |
| **M-05** | **CI Build & Automated Pipeline Success Rate**<br>Ratio of successful pipeline execution runs on pull requests into staging/release branches. | GitHub Actions Workflows (`auto-test.yml`, `ci-docker.yml`, `deploy.yml`) | 2026-11-25 to 2026-11-27 (Lab 7 PR integration window) | **83.3% initial, 100% on merged commits** (5 passed / 6 total runs; 1 failure diagnosed and corrected by PR #71) | GitHub Actions Run Logs & Git PR History | PRs #69, #71, #70; Commit `cb84325` fixture fix |

---

## 2. Reconcilable Source Evidence

To enable independent reconciliation without requiring access to external links, the underlying records for **M-01 (Completed Issues)** and **M-02 (Merged Pull Requests)** are detailed below.

### 2.1 Metric M-01 Source Data: Completed GitHub Issues

| Issue ID | Title & Milestone | Assignee / Author | Date Completed | Status / Resolution | Evidence Verification Reference |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **#2** | Project Planning & Documentation (Sprint 1) | bravefe / SaintCrois | 2026-11-04 | Closed | PR #10, branch `docs/sprint-1-planing` |
| **#4** | Authentication & RBAC Authorization (Sprint 1) | bravefe | 2026-11-04 | Closed | PR #16, commit `767bdcb`, branch `feature/authentication` |
| **#5** | Purchase Request Domain & Review Workflow (Sprint 1) | bravefe | 2026-11-05 | Closed | PR #17, commit `3f99790`, branch `feature/domain-workflow` |
| **#6** | Automated Integration & Unit Testing (Sprint 1) | SaintCrois | 2026-11-07 | Closed | PR #18, commit `60eaf9e`, branch `test/integration-tests` |
| **#30** | Cloud-Ready Architecture & Dockerization (Lab 5) | bravefe | 2026-11-19 | Closed | PR #32 & #33, commit `dd0083c`, branch `refactor/2-cloud-ready` |
| **#35** | GCP CI/CD Pipeline & Auto-Deployment (Lab 5) | bravefe | 2026-11-19 | Closed | PR #34 & #37, commit `79a1ed3`, branch `feature/auto-deploy` |
| **#40** | Sprint 1 UAT Preparation & Handoff (Lab 6) | SaintCrois | 2026-11-23 | Closed | PR #44, commit `3832c0e`, branch `docs/1-uat` |
| **#46** | Independent Partner UAT Execution (Lab 6) | bravefe | 2026-11-24 | Closed | PR #47, commit `08fcde5`, branch `test-docs/2-uat-report` |
| **#60** | UAT Defect Correction: Draft Privacy & Timeline (Lab 6) | bravefe / SaintCrois | 2026-11-24 | Closed | PR #61, commit `8f21c32`, branch `fix/draft-visibility-...` |
| **#65** | Lab 7.1 Change Impact & Contract Revision (Lab 7) | bravefe | 2026-11-27 | Closed | PR #69, commit `0497f35`, branch `docs/lab7-change-analysis` |
| **#68** | Lab 7.2 Implementation: Pending Request Edit & Withdrawal | bravefe | 2026-11-27 | Closed | PR #70, commit `7ddc741`, branch `feat/pending-request-edit...` |
| **#71** | Fixture Isolation Correction for Pending Request Tests | bravefe | 2026-11-27 | Closed | PR #71, commit `cb84325`, branch `fix/test-false-positive...` |

*Active / Open Issues Not Counted as Completed:*
- Issue #66: Lab 7.3 Maintenance Verification & Release (PR pending merge into `lab-7`)
- Issue #67: Lab 7.4 Engineering Metrics & Final Report (Current active branch `docs/lab7-metrics-and-final-report`)
- Issue #72: Parent Lab 7 Umbrella Tracking Issue

$$\text{Completed Issue Ratio} = \frac{12 \text{ Closed}}{15 \text{ Tracked}} = 80.0\%$$

---

### 2.2 Metric M-02 Source Data: Merged Pull Requests

The following table extracts the complete pull request merge history verifiable via `git log --grep="Merge pull request"`:

| PR ID | Target Branch | Source Branch | Merged Date | Merge Commit SHA | Author / Reviewer | Primary Outcome |
| :---: | :---: | :--- | :---: | :---: | :--- | :--- |
| **#12** | `sprint-1` | `bravefe/docs/srs-sds` | 2026-11-04 | `a1b5e6d` | bravefe / SaintCrois | SRS and System SDS baseline |
| **#14** | `sprint-1` | `bravefe/init/server-client-db-routing` | 2026-11-04 | `f3c3cf0` | bravefe / SaintCrois | Project skeleton, Prisma setup |
| **#16** | `sprint-1` | `bravefe/feature/authentication` | 2026-11-04 | `767bdcb` | bravefe / SaintCrois | JWT auth, bcrypt hashing, RBAC |
| **#17** | `sprint-1` | `bravefe/feature/domain-workflow` | 2026-11-05 | `3f99790` | bravefe / SaintCrois | Request lifecycle & review actions |
| **#18** | `sprint-1` | `bravefe/test/integration-tests` | 2026-11-07 | `60eaf9e` | SaintCrois / bravefe | Vitest integration and component tests |
| **#19** | `main` | `bravefe/sprint-1` | 2026-11-08 | `b5da515` | bravefe / SaintCrois | Deliverable 1 Release (`v0.1.0`) |
| **#32** | `lab-5` | `bravefe/refactor/2-cloud-ready` | 2026-11-19 | `dd0083c` | bravefe / SaintCrois | Decouple app/server, dotenv config |
| **#33** | `lab-5` | `bravefe/build/3-docker` | 2026-11-19 | `4b93b08` | bravefe / SaintCrois | Multi-stage Dockerfile |
| **#34** | `lab-5` | `bravefe/ci/4-pr-checks` | 2026-11-19 | `239ee39` | bravefe / SaintCrois | CI workflows for PR testing |
| **#37** | `lab-5` | `bravefe/feature/auto-deploy` | 2026-11-19 | `79a1ed3` | bravefe / SaintCrois | Cloud Run deployment scripts |
| **#38** | `main` | `bravefe/lab-5` | 2026-11-19 | `506212d` | bravefe / SaintCrois | Lab 5 CI/CD integration |
| **#39** | `main` | `bravefe/feature/deploy-proof` | 2026-11-19 | `f9d6538` | bravefe / SaintCrois | Production proof tag `v0.2.0` |
| **#44** | `lab-6` | `bravefe/docs/1-uat` | 2026-11-23 | `3832c0e` | bravefe / SaintCrois | UAT test plan & handoff doc |
| **#45** | `main` | `bravefe/hotfix/seed-more-user...` | 2026-11-23 | `c7504ea` | bravefe / SaintCrois | Seed data hotfix tag `v0.2.1` |
| **#47** | `lab-6` | `bravefe/test-docs/2-uat-report` | 2026-11-24 | `08fcde5` | bravefe / SaintCrois | Partner UAT execution record |
| **#57** | `sprint-2`| `bravefe/feat/request-filtering-search`| 2026-11-24 | `a0ee932` | bravefe / SaintCrois | Sprint 2 search/filter feature |
| **#58** | `sprint-2`| `bravefe/feat/request-reports-metrics` | 2026-11-24 | `bb89635` | bravefe / SaintCrois | Sprint 2 aggregation metrics |
| **#61** | `lab-6` | `bravefe/fix/draft-visibility-...` | 2026-11-24 | `8f21c32` | bravefe / SaintCrois | Defect fixes F-01 & F-02 (v0.2.2) |
| **#62** | `lab-6` | `bravefe/docs/3-uat-resolution` | 2026-11-25 | `7b95f54` | bravefe / SaintCrois | UAT resolution & retest record |
| **#64** | `lab-6` | `bravefe/feat/auto-tag` | 2026-11-25 | `296e817` | bravefe / SaintCrois | Automatic semantic version tagging |
| **#63** | `main` | `bravefe/lab-6` | 2026-11-25 | `71080af` | bravefe / SaintCrois | Lab 6 Release Tag `v0.2.3` |
| **#69** | `lab-7` | `bravefe/docs/lab7-change-analysis` | 2026-11-27 | `0497f35` | bravefe / SaintCrois | Lab 7.1 Contract & Impact Analysis |
| **#71** | `lab-7` | `bravefe/fix/test-false-positive...` | 2026-11-27 | `cb84325` | bravefe / SaintCrois | Fixture isolation fix |
| **#70** | `lab-7` | `bravefe/feat/pending-request-edit...`| 2026-11-27 | `7ddc741` | bravefe / SaintCrois | Lab 7.2 Implementation Merge |

---

## 3. Metrics Interpretation (Under 100 Words)

The metrics demonstrate strong delivery velocity (24 merged PRs, 12 completed issues, 100% UAT resolution) and zero regressions across 81 automated tests. However, CI outcomes reveal a critical engineering risk: shared test fixtures created false-positive failures during parallel branch execution (PR #71), threatening pipeline integrity. To prevent future verification stalls, the team will refactor database test seeds to enforce unique ephemeral IDs per test case, eliminating cross-case state bleeding. Owner: SaintCrois. Target Milestone: Sprint 2 Final Delivery (29 November 2026).
