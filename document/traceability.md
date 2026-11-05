# Requirements Traceability Matrix (RTM)

**Project Name:** Macau678 University Purchase Approval System  
**Course:** CPE 334 — Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Theme:** Theme 5: Workflow and Approval System  
**Baseline References:** [Software Requirements Specification (SRS)](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/srs.md) | [System Design Specification (SDS)](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/sds.md) | [Feature Inventory](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/feature.md) | [Software Test Specification](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/test.md)

---

## 1. Traceability Overview

This document establishes bi-directional traceability across the engineering lifecycle of the Macau678 Purchase Approval System:
$$\text{SRS Requirement} \iff \text{Feature ID} \iff \text{Sprint Plan} \iff \text{Test Specification (Test ID)} \iff \text{Acceptance Criteria}$$

### Verification Status Convention
> [!NOTE]
> In accordance with course guidelines and academic integrity, verification status reflects actual implementation state:
> * **`PASSED`**: Test case implemented and verified by automated test runner with log evidence.
> * **`PARTIALLY VERIFIED`**: Sub-rules or specific layers (e.g. API authorization guards) verified with test evidence, while remaining journey/workflow cases remain planned.
> * **`PLANNED`**: Test case is specified in `test.md` and scheduled in `plan.md`, pending test run evidence.

---

## 2. Functional Requirements Traceability

| Requirement ID | Requirement Summary | Feature ID(s) | Sprint | Primary Test ID(s) | Verification Level | Verification Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **FR-01** | User login, logout, and role identification | `FEAT-01`, `FEAT-02` | Sprint 1 | `TEST-UNIT-01`, `TEST-INT-01`, `TEST-INT-02`, `TEST-COMP-01`, `TEST-COMP-05` | Unit, Integration, Component | `PASSED` |
| **FR-02** | Create and submit purchase requests with required details | `FEAT-03`, `FEAT-04`, `FEAT-12` | Sprint 1, 2 | `TEST-UNIT-05`, `TEST-INT-03`, `TEST-COMP-02`, `TEST-E2E-01` | Unit, Integration, Component, E2E | `PLANNED` |
| **FR-03** | View submitted requests and assigned requests | `FEAT-05`, `FEAT-06` | Sprint 1 | `TEST-INT-04`, `TEST-INT-05`, `TEST-E2E-01` | Integration, E2E | `PARTIALLY VERIFIED`<br>(API Scoping passed; E2E PLANNED) |
| **FR-04** | Review requests (approve, reject with reason, return with reason) | `FEAT-07`, `FEAT-12` | Sprint 1, 2 | `TEST-UNIT-03`, `TEST-UNIT-04`, `TEST-INT-06`, `TEST-COMP-03`, `TEST-E2E-01`, `TEST-E2E-02` | Unit, Integration, Component, E2E | `PARTIALLY VERIFIED`<br>(API Decisions passed; UI/E2E PLANNED) |
| **FR-05** | Edit returned requests; prevent editing on other statuses | `FEAT-08` | Sprint 1 | `TEST-UNIT-03`, `TEST-INT-07`, `TEST-E2E-01` | Unit, Integration, E2E | `PLANNED` |
| **FR-06** | Record and view chronological request audit history | `FEAT-09` | Sprint 1 | `TEST-INT-08`, `TEST-COMP-04`, `TEST-E2E-01`, `TEST-E2E-02` | Integration, Component, E2E | `PLANNED` |
| **FR-07** | Reviewer assignment and assigned-only review enforcement | `FEAT-04`, `FEAT-06`, `FEAT-07` | Sprint 1 | `TEST-INT-03`, `TEST-INT-05`, `TEST-INT-06`, `TEST-E2E-01` | Integration, E2E | `PARTIALLY VERIFIED`<br>(Review Scoping passed; Creation PLANNED) |
| **FR-08** | Request overview, filtering by status and date | `FEAT-10`, `FEAT-11` | Sprint 2 | `TEST-UNIT-06`, `TEST-INT-09`, `TEST-INT-10`, `TEST-E2E-04` | Unit, Integration, E2E | `PLANNED` |

---

## 3. Business Rules Traceability

| Business Rule ID | Business Rule Summary | Implementing Feature ID(s) | Primary Test ID(s) | Enforcement Level | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **BR-01** | Requests must be submitted by authenticated Requesters | `FEAT-02`, `FEAT-03` | `TEST-INT-02` | Middleware & DB Foreign Key | `PASSED` |
| **BR-02** | Submitted requests must be assigned to an authorized Reviewer | `FEAT-04` | `TEST-INT-03` | DB Foreign Key & API Validation | `PLANNED` |
| **BR-03** | Requesters cannot approve or review their own requests | `FEAT-07` | `TEST-UNIT-04`, `TEST-INT-06` | Domain Logic & Route Guard | `PASSED` |
| **BR-04** | Reviewers can only review requests assigned to them | `FEAT-06`, `FEAT-07` | `TEST-INT-05`, `TEST-INT-06` | API Query Scoping & Guard | `PASSED` |
| **BR-05** | Reviewers must provide a reason when rejecting or returning | `FEAT-07` | `TEST-UNIT-04`, `TEST-INT-06` | API Schema & Domain Validation | `PASSED` |
| **BR-06** | Requesters can only edit requests in Returned status | `FEAT-08` | `TEST-UNIT-03`, `TEST-INT-07` | Domain Logic & Route Guard | `PLANNED` |
| **BR-07** | Enforce valid lifecycle status transitions | `FEAT-03`, `FEAT-07`, `FEAT-08` | `TEST-UNIT-03`, `TEST-INT-06` | State Machine & DB Constraints | `PARTIALLY VERIFIED`<br>(Review transitions passed) |
| **BR-08** | Record all review decisions and status transitions in history | `FEAT-09` | `TEST-INT-06`, `TEST-INT-08` | Transactional History Service | `PARTIALLY VERIFIED`<br>(Review actions recorded) |
| **BR-09** | Enforce strict permission boundaries; no cross-access | `FEAT-02`, `FEAT-05`, `FEAT-06` | `TEST-INT-02`, `TEST-INT-04`, `TEST-INT-05`, `TEST-COMP-05` | Authorization Middleware | `PASSED` |
| **BR-10** | Single-reviewer approval workflow in initial baseline | `FEAT-04`, `FEAT-07` | `TEST-INT-05`, `TEST-INT-06` | Database Schema (single reviewer FK) | `PASSED` |

---

## 4. Non-Functional Requirements Traceability

| Requirement ID | Quality Attribute | Target Standard | Implementing Feature(s) | Primary Test ID(s) | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **NFR-01** | Security | Bcrypt 10 rounds, HTTP-only JWT cookies, server-side RBAC | `FEAT-01`, `FEAT-02`, `FEAT-13` | `TEST-UNIT-01`, `TEST-INT-01`, `TEST-INT-02` | `PASSED` |
| **NFR-02** | Usability | Accessible forms, live validation, clear statuses, responsive layout | `FEAT-05`, `FEAT-06`, `FEAT-12`, `FEAT-14` | `TEST-COMP-01`, `TEST-COMP-05` | `PLANNED`<br>(Full UI verification in Sprint 2/3) |
| **NFR-03** | Performance | API response time under 3.0s under expected loads | `FEAT-13` | Performance Benchmark Test (`FEAT-13`) | `PLANNED` |
| **NFR-04** | Reliability | PostgreSQL ACID persistence, state machine protection | `FEAT-07`, `FEAT-09`, `FEAT-13` | `TEST-INT-01`, `TEST-INT-06` | `PARTIALLY VERIFIED`<br>(Auth & Review persistence passed) |
| **NFR-05** | Maintainability | Decoupled 3-tier architecture, automated test suites | `FEAT-13`, `FEAT-14` | Automated test suites (`FEAT-14`) | `PLANNED`<br>(Verified across all 3 sprints) |

---

## 5. Acceptance Criteria Traceability

| Acceptance Criteria ID | Description | Implementing Feature(s) | Primary Test ID(s) | Verification Status |
| :--- | :--- | :--- | :--- | :---: |
| **AC-01** | User logs in and accesses features according to role | `FEAT-01`, `FEAT-02` | `TEST-UNIT-01`, `TEST-INT-01`, `TEST-COMP-01`, `TEST-COMP-05` | `PASSED` |
| **AC-02** | Requester creates and submits purchase request | `FEAT-03`, `FEAT-04` | `TEST-INT-03`, `TEST-COMP-02`, `TEST-E2E-01` | `PLANNED` |
| **AC-03** | Requester views own requests and statuses | `FEAT-05` | `TEST-INT-04` | `PASSED` (API Scoping) |
| **AC-04** | Assigned Reviewer views assigned requests | `FEAT-06` | `TEST-INT-05` | `PASSED` (API Scoping) |
| **AC-05** | Reviewer approves request | `FEAT-07` | `TEST-INT-06` | `PASSED` |
| **AC-06** | Reviewer must provide reason to reject or return | `FEAT-07` | `TEST-UNIT-04`, `TEST-INT-06` | `PASSED` |
| **AC-07** | Requester edits and resubmits returned request | `FEAT-08` | `TEST-UNIT-03`, `TEST-INT-07`, `TEST-E2E-01` | `PLANNED` |
| **AC-08** | Requester cannot approve own request | `FEAT-07` | `TEST-UNIT-04`, `TEST-INT-06` | `PASSED` |
| **AC-09** | Reviewer cannot review request assigned to another | `FEAT-06`, `FEAT-07` | `TEST-INT-05`, `TEST-INT-06` | `PASSED` |
| **AC-10** | Users cannot access requests not authorized to view | `FEAT-02`, `FEAT-05`, `FEAT-06` | `TEST-INT-02`, `TEST-INT-04`, `TEST-INT-05` | `PASSED` |
| **AC-11** | Review decisions and status changes recorded in history | `FEAT-09` | `TEST-INT-06`, `TEST-INT-08` | `PARTIALLY VERIFIED`<br>(Recorded on review actions) |
| **AC-12** | Filter requests and view basic request summaries | `FEAT-10`, `FEAT-11` | `TEST-UNIT-06`, `TEST-INT-09`, `TEST-INT-10`, `TEST-E2E-04` | `PLANNED` |

---

## 6. Coverage Analysis Summary

* **Functional Requirement Coverage:** 8 / 8 requirements mapped. FR-01 fully verified; FR-03, FR-04, FR-07 partially verified on API authorization levels.
* **Business Rule Coverage:** BR-01, BR-03, BR-04, BR-05, BR-09, BR-10 fully verified with automated test suites.
* **Non-Functional Requirement Coverage:** NFR-01 (Security) verified with bcrypt and JWT tests. NFR-02, NFR-03, NFR-04, and NFR-05 remain planned or partially verified until full application delivery.
* **Acceptance Criteria Coverage:** AC-01, AC-03, AC-04, AC-05, AC-06, AC-08, AC-09, AC-10 verified by passing tests. AC-02, AC-07, AC-12 remain planned.
* **End-to-End (Playwright) Coverage:** 0 E2E tests executed in this unit/API testing issue; all 5 Playwright journeys (`TEST-E2E-01` through `TEST-E2E-05`) remain explicitly marked as `PLANNED` / `FIXME`.
