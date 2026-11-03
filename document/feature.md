# Feature Inventory and Requirements Traceability

**Project Name:** Macau678 University Purchase Approval System  
**Course:** CPE 334 — Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Theme:** Theme 5: Workflow and Approval System  
**Baseline References:** [Software Requirements Specification (SRS)](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/srs.md) | [System Design Specification (SDS)](file:///c:/Users/Cent/Desktop/Software-Engineer-2/document/sds.md)

---

## 1. Feature Inventory Overview

This document defines the complete feature inventory for the Macau678 Purchase Approval System. Every feature is uniquely identified, prioritized, mapped to its corresponding SRS requirements and business rules, assigned to a development sprint, and linked with prerequisite dependencies.

### Priority Legend
* **Must Have:** Core baseline functionality required for system viability, security, and compliance with the approval workflow.
* **Should Have:** Important functionality that significantly enhances usability, reporting, validation, or system performance.
* **Could Have:** Optional enhancements or future extensions outside the core three-sprint baseline.

---

## 2. Feature Catalog

### 2.1 Group A: Authentication & Identity Management

#### FEAT-01: User Authentication & Session Lifecycle
* **Feature ID:** `FEAT-01`
* **Feature Name:** User Authentication & Session Lifecycle
* **Description:** Allows registered users to authenticate securely with their corporate email and password. Manages session lifecycle through cryptographically signed JSON Web Tokens (JWT) stored in HTTP-only, secure browser cookies. Provides seamless session restoration via current-user retrieval (`/api/auth/me`) and clean session termination upon logout.
* **Actor:** Both (Requester & Reviewer)
* **Related Requirements:** FR-01, NFR-01, AC-01
* **Priority:** Must Have
* **Sprint:** Sprint 1
* **Dependencies:** None (Baseline capability)

#### FEAT-02: Role-Based Access Control (RBAC) & Route Authorization
* **Feature ID:** `FEAT-02`
* **Feature Name:** Role-Based Access Control & Route Authorization
* **Description:** Enforces strict role boundaries on both client navigation routes and server endpoints. Differentiates permissions between `REQUESTER` and `REVIEWER` roles. Rejects unauthenticated attempts with `401 Unauthorized` and unauthorized operations with `403 Forbidden`. Ensures navigation UI conditionally renders views appropriate to the active session role.
* **Actor:** Both (Requester & Reviewer)
* **Related Requirements:** FR-01, BR-01, BR-09, NFR-01, AC-01, AC-10
* **Priority:** Must Have
* **Sprint:** Sprint 1
* **Dependencies:** `FEAT-01`

---

### 2.2 Group B: Purchase Request Submission & Requester Workflows

#### FEAT-03: Purchase Request Creation & Draft Management
* **Feature ID:** `FEAT-03`
* **Feature Name:** Purchase Request Creation & Draft Management
* **Description:** Provides Requesters with an intuitive form interface to draft or submit purchase requests, capturing mandatory fields: title (3–150 chars), detailed description (max 2000 chars), monetary amount (positive decimal), and business justification (max 2000 chars). Supports saving as a private `DRAFT` or immediate submission as `PENDING_REVIEW` with an auto-generated tracking number (`PR-YYYY-XXXXX`).
* **Actor:** Requester
* **Related Requirements:** FR-02, BR-01, BR-07, AC-02
* **Priority:** Must Have
* **Sprint:** Sprint 1
* **Dependencies:** `FEAT-01`, `FEAT-02`

#### FEAT-04: Reviewer Assignment & Routing
* **Feature ID:** `FEAT-04`
* **Feature Name:** Reviewer Assignment & Routing
* **Description:** Facilitates assigning a designated, authorized Reviewer to each submitted purchase request. In Sprint 1, provides an active reviewer lookup endpoint (`GET /api/users/reviewers`) allowing Requesters to select an eligible Reviewer upon submission, enforcing the single-reviewer model and ensuring requests never enter the queue unassigned.
* **Actor:** Requester
* **Related Requirements:** FR-02, FR-07, BR-02, BR-10, AC-02
* **Priority:** Must Have
* **Sprint:** Sprint 1
* **Dependencies:** `FEAT-01`, `FEAT-02`, `FEAT-03`

#### FEAT-05: Requester Request Tracking & Personal Dashboard
* **Feature ID:** `FEAT-05`
* **Feature Name:** Requester Request Tracking & Personal Dashboard
* **Description:** Presents Requesters with an operational overview of all purchase requests they have submitted, showing request title, date, amount, assigned reviewer, and current status (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `RETURNED`). Enforces strict data isolation preventing any Requester from querying or inspecting another user's requests.
* **Actor:** Requester
* **Related Requirements:** FR-03, BR-09, AC-03, AC-10
* **Priority:** Must Have
* **Sprint:** Sprint 1
* **Dependencies:** `FEAT-01`, `FEAT-02`, `FEAT-03`

#### FEAT-08: Request Modification & Resubmission Workflow
* **Feature ID:** `FEAT-08`
* **Feature Name:** Request Modification & Resubmission Workflow
* **Description:** Enables Requesters to edit and resubmit a purchase request strictly when it has been returned by the Reviewer (`status === RETURNED`). Locks all request fields against editing whenever the request is in `PENDING_REVIEW`, `APPROVED`, or `REJECTED` status. Resubmission transitions the request back to `PENDING_REVIEW`.
* **Actor:** Requester
* **Related Requirements:** FR-05, BR-06, BR-07, AC-07
* **Priority:** Must Have
* **Sprint:** Sprint 1
* **Dependencies:** `FEAT-01`, `FEAT-02`, `FEAT-03`, `FEAT-07`

---

### 2.3 Group C: Reviewer Workflows & Approval Processing

#### FEAT-06: Reviewer Queue & Assignment Scope Enforcement
* **Feature ID:** `FEAT-06`
* **Feature Name:** Reviewer Queue & Assignment Scope Enforcement
* **Description:** Provides Reviewers with a dedicated queue listing all requests assigned to their account. Enforces server-side authorization ensuring Reviewers cannot view or take action on requests assigned to other Reviewers, returning `403 Forbidden` if unauthorized access is attempted.
* **Actor:** Reviewer
* **Related Requirements:** FR-03, FR-07, BR-04, BR-09, AC-04, AC-09, AC-10
* **Priority:** Must Have
* **Sprint:** Sprint 1
* **Dependencies:** `FEAT-01`, `FEAT-02`, `FEAT-04`

#### FEAT-07: Review Decision Processing (Approve, Reject, Return)
* **Feature ID:** `FEAT-07`
* **Feature Name:** Review Decision Processing (Approve, Reject, Return)
* **Description:** Empowers assigned Reviewers to evaluate pending requests and execute one of three formal decisions: `APPROVE`, `REJECT`, or `RETURN`. Strictly enforces business rules: rejection and return require a non-empty explanation reason (BR-05); self-approval is blocked if the reviewer is also the requester (BR-03); only valid status transitions per BR-07 are permitted.
* **Actor:** Reviewer
* **Related Requirements:** FR-04, BR-03, BR-04, BR-05, BR-07, AC-05, AC-06, AC-08, AC-09
* **Priority:** Must Have
* **Sprint:** Sprint 1
* **Dependencies:** `FEAT-01`, `FEAT-02`, `FEAT-06`

---

### 2.4 Group D: Auditing, History & Reporting

#### FEAT-09: Request Audit Trail & History Tracking
* **Feature ID:** `FEAT-09`
* **Feature Name:** Request Audit Trail & History Tracking
* **Description:** Transactionally logs an immutable historical entry for every request state transition and review decision (`CREATED`, `SUBMITTED`, `RESUBMITTED`, `EDITED`, `APPROVED`, `REJECTED`, `RETURNED`). Records the acting user ID, timestamp, previous status, new status, and review reasons. Authorized users can view the chronological timeline on the request detail screen.
* **Actor:** Both (Requester & Reviewer)
* **Related Requirements:** FR-06, BR-08, AC-11, NFR-04
* **Priority:** Must Have
* **Sprint:** Sprint 1
* **Dependencies:** `FEAT-01`, `FEAT-03`, `FEAT-07`, `FEAT-08`

#### FEAT-10: Multi-Criteria Request Filtering & Search
* **Feature ID:** `FEAT-10`
* **Feature Name:** Multi-Criteria Request Filtering & Search
* **Description:** Enhances request lists for both Requesters and Reviewers with real-time filtering by status (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `RETURNED`), submission date ranges (`startDate` to `endDate`), and keyword search over request title and number.
* **Actor:** Both (Requester & Reviewer)
* **Related Requirements:** FR-08, AC-12, NFR-02
* **Priority:** Should Have
* **Sprint:** Sprint 2
* **Dependencies:** `FEAT-05`, `FEAT-06`

#### FEAT-11: Status Breakdown & Financial Metrics Reporting
* **Feature ID:** `FEAT-11`
* **Feature Name:** Status Breakdown & Financial Metrics Reporting
* **Description:** Aggregates purchase requests across statuses, calculating request counts and monetary volume sums. Provides Reviewers and department stakeholders with high-level summary cards, status breakdown charts, and exportable summary views to facilitate departmental budget oversight.
* **Actor:** Reviewer
* **Related Requirements:** FR-08, AC-12
* **Priority:** Should Have
* **Sprint:** Sprint 2
* **Dependencies:** `FEAT-05`, `FEAT-06`, `FEAT-10`

---

### 2.5 Group E: System Integrity, Validation & Hardening

#### FEAT-12: Enhanced Form Validation & Numeric Boundary Checking
* **Feature ID:** `FEAT-12`
* **Feature Name:** Enhanced Form Validation & Numeric Boundary Checking
* **Description:** Implements robust client-side and server-side validation schemas. Enforces currency scale constraints (`Decimal(12, 2)`), strictly positive amounts (> 0.00), character counters on text inputs, and sanitized string trimming. Replaces generic error responses with structured, accessible field-level validation messages.
* **Actor:** Both (Requester & Reviewer)
* **Related Requirements:** FR-02, FR-04, NFR-02, NFR-04
* **Priority:** Should Have
* **Sprint:** Sprint 2
* **Dependencies:** `FEAT-03`, `FEAT-07`, `FEAT-08`

#### FEAT-13: System Performance & Security Hardening
* **Feature ID:** `FEAT-13`
* **Feature Name:** System Performance & Security Hardening
* **Description:** Cross-cutting security, reliability, and performance optimization. Enforces HTTP-only and SameSite cookie policies, database connection pooling, query indexing on frequently filtered columns (`requesterId`, `reviewerId`, `status`, `createdAt`), sub-3-second API response times (NFR-03), and defense against common vulnerabilities (OWASP top 10).
* **Actor:** Both (Requester & Reviewer)
* **Related Requirements:** NFR-01, NFR-03, NFR-04, NFR-05
* **Priority:** Should Have
* **Sprint:** Sprint 3
* **Dependencies:** `FEAT-01` through `FEAT-12`

#### FEAT-14: End-to-End System Verification & Release Packaging
* **Feature ID:** `FEAT-14`
* **Feature Name:** End-to-End System Verification & Release Packaging
* **Description:** Establishes comprehensive automated regression coverage with Playwright for cross-role browser journeys (desktop and tablet profiles), automated unit/integration test suites, containerization via Dockerfile/docker-compose, and continuous deployment readiness for Google Cloud Platform (GCP).
* **Actor:** Both (Requester & Reviewer)
* **Related Requirements:** NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, AC-01 through AC-12
* **Priority:** Must Have
* **Sprint:** Sprint 3
* **Dependencies:** `FEAT-01` through `FEAT-13`

---

## 3. Requirements-to-Feature Traceability Matrix

The table below maps every requirement, business rule, and acceptance criterion defined in `srs.md` to its implementing features:

| SRS Requirement ID | Requirement Type | Short Description | Implementing Feature ID(s) | Sprint |
| :--- | :--- | :--- | :--- | :---: |
| **FR-01** | Functional | User login, logout, and role identification | `FEAT-01`, `FEAT-02` | Sprint 1 |
| **FR-02** | Functional | Create and submit purchase requests with details | `FEAT-03`, `FEAT-04`, `FEAT-12` | Sprint 1, 2 |
| **FR-03** | Functional | View submitted requests and assigned requests | `FEAT-05`, `FEAT-06` | Sprint 1 |
| **FR-04** | Functional | Review requests (approve, reject/return with reason) | `FEAT-07`, `FEAT-12` | Sprint 1, 2 |
| **FR-05** | Functional | Edit returned requests; block edits on others | `FEAT-08` | Sprint 1 |
| **FR-06** | Functional | Record and view chronological request audit history | `FEAT-09` | Sprint 1 |
| **FR-07** | Functional | Reviewer assignment and assigned-only review enforcement | `FEAT-04`, `FEAT-06`, `FEAT-07` | Sprint 1 |
| **FR-08** | Functional | Request overview, filtering by status and date | `FEAT-10`, `FEAT-11` | Sprint 2 |
| **BR-01** | Business Rule | Requests must be submitted by authenticated Requesters | `FEAT-02`, `FEAT-03` | Sprint 1 |
| **BR-02** | Business Rule | Submitted requests must be assigned to an authorized Reviewer | `FEAT-04` | Sprint 1 |
| **BR-03** | Business Rule | Requesters cannot approve or review their own requests | `FEAT-07` | Sprint 1 |
| **BR-04** | Business Rule | Reviewers can only review requests assigned to them | `FEAT-06`, `FEAT-07` | Sprint 1 |
| **BR-05** | Business Rule | Reviewers must provide a reason when rejecting or returning | `FEAT-07` | Sprint 1 |
| **BR-06** | Business Rule | Requesters can only edit requests in Returned status | `FEAT-08` | Sprint 1 |
| **BR-07** | Business Rule | Enforce valid lifecycle status transitions | `FEAT-03`, `FEAT-07`, `FEAT-08` | Sprint 1 |
| **BR-08** | Business Rule | Record all review decisions and status transitions in history | `FEAT-09` | Sprint 1 |
| **BR-09** | Business Rule | Enforce strict permission boundaries; no cross-access | `FEAT-02`, `FEAT-05`, `FEAT-06` | Sprint 1 |
| **BR-10** | Business Rule | Single-reviewer approval workflow in initial baseline | `FEAT-04`, `FEAT-07` | Sprint 1 |
| **NFR-01** | Non-Functional | Security: Authentication, server-side RBAC, data protection | `FEAT-01`, `FEAT-02`, `FEAT-13` | Sprint 1, 3 |
| **NFR-02** | Non-Functional | Usability: Clear statuses, intuitive UI, clear error messages | `FEAT-05`, `FEAT-06`, `FEAT-12` | Sprint 1, 2 |
| **NFR-03** | Non-Functional | Performance: Response latency under 3 seconds | `FEAT-13` | Sprint 3 |
| **NFR-04** | Non-Functional | Reliability: Database persistence, transition prevention | `FEAT-07`, `FEAT-09`, `FEAT-13` | Sprint 1, 3 |
| **NFR-05** | Non-Functional | Maintainability: Modular architecture, testable layers | `FEAT-13`, `FEAT-14` | Sprint 3 |
| **AC-01** | Acceptance Criteria | Login and role-based feature access | `FEAT-01`, `FEAT-02` | Sprint 1 |
| **AC-02** | Acceptance Criteria | Create and submit purchase request | `FEAT-03`, `FEAT-04` | Sprint 1 |
| **AC-03** | Acceptance Criteria | Requester views own requests and statuses | `FEAT-05` | Sprint 1 |
| **AC-04** | Acceptance Criteria | Reviewer views assigned requests | `FEAT-06` | Sprint 1 |
| **AC-05** | Acceptance Criteria | Reviewer approves request | `FEAT-07` | Sprint 1 |
| **AC-06** | Acceptance Criteria | Reviewer rejects or returns with reason | `FEAT-07` | Sprint 1 |
| **AC-07** | Acceptance Criteria | Requester edits and resubmits returned request | `FEAT-08` | Sprint 1 |
| **AC-08** | Acceptance Criteria | Prevent self-approval by requester | `FEAT-07` | Sprint 1 |
| **AC-09** | Acceptance Criteria | Prevent reviewer reviewing unassigned requests | `FEAT-06`, `FEAT-07` | Sprint 1 |
| **AC-10** | Acceptance Criteria | Block unauthorized cross-user access | `FEAT-02`, `FEAT-05`, `FEAT-06` | Sprint 1 |
| **AC-11** | Acceptance Criteria | Chronological history records review decisions | `FEAT-09` | Sprint 1 |
| **AC-12** | Acceptance Criteria | Filter requests and view summary reports | `FEAT-10`, `FEAT-11` | Sprint 2 |

---

## 4. Assumptions and Unresolved Decisions Log

The following assumptions and unresolved decisions have been documented from the SRS and SDS analysis to ensure complete project transparency:

| Reference ID | Topic / Item | Assumption or Unresolved Decision | Impact on Feature Inventory | Recommended Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **DEC-01** | Reviewer Assignment Mechanism (FR-07) | SRS FR-07 states each request must be assigned to an authorized Reviewer, but does not specify whether assignment is automatic, round-robin, or chosen by the Requester. | In `FEAT-04`, the Requester selects an active Reviewer from a dropdown. | Maintain user-selection from active reviewer pool for Sprint 1. Re-evaluate automated routing for future releases. |
| **DEC-02** | Draft State Functionality (BR-07) | BR-07 lists `Draft -> Pending Review`, while FR-02 mentions "submit their requests for review". | `FEAT-03` incorporates a "Save as Draft" feature alongside direct "Submit for Review". | Retain Draft state as it cleanly satisfies BR-07 and allows Requesters to prepare requests incrementally. |
| **DEC-03** | Currency and Precision Limits | SRS specifies an amount field, but does not define currency symbols, decimal precision, or upper bounds. | `FEAT-12` standardizes currency to `Decimal(12, 2)` (up to 9,999,999,999.99), positive numbers only. | Formally adopt 2-decimal positive precision and display corporate currency symbol (MOP / USD). |
| **DEC-04** | File Attachments and Quotations | SRS Scope 3.1 & 3.2 do not include or exclude file attachments. | Attachments are **not included** in the feature inventory to avoid introducing unapproved requirements. | Treat attachments as an uncommitted potential extension. Only introduce if requested by course instructor/TA. |
| **DEC-05** | User Self-Registration and Password Reset | SRS FR-01 and AD-02 restrict user management to seeded accounts with pre-hashed credentials. | User registration and password reset features are omitted from the inventory. | Rely on reproducible seed accounts (`requester1@macau678.com`, `reviewer1@macau678.com`) as permitted by the course spec. |
