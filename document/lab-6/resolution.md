# Resolution

## 1 Summary of Received Findings

Initial reported version: 0.2
Initial reported commit: `f9d653882a40278394a1b007f98fdc5b7955ad34`, macau678-migrate-5ms22
Test Date: 24 November 2026

| Finding                     | Category      | Result                                                                                                                                              |
| --------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 / UAT-TC-03 Part A     | Draft privacy | [HIGH — PASS] The 0.2.2 retest confirmed assigned and unassigned Reviewers cannot find or open a DRAFT; its Requester retains access.               |
| F-02 / UAT-TC-01, UAT-TC-04 | Audit history | [MEDIUM — PASS] The 0.2.2 retest confirmed role-specific history, direct-submit events, and combined resubmission notes for the executed scenarios. |
| F-03                        | UAT wording   | [LOW — PASS] The original UAT guide now uses website labels, displayed statuses, and corrected SRS references.                                      |

**Total findings received: 3**

---

## 2 Triage Table

| Finding | Severity | Classification                    | Reason and disposition                                                                                                                                        |
| ------- | -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01    | High     | Product/security defect           | Resolved. The 0.2.2 retest passed the assigned and unassigned Reviewer queue and direct-access checks; the owner retained access to the draft.                |
| F-02    | Medium   | Audit-history / visibility defect | Resolved. The 0.2.2 retest passed the direct-submit and return/edit/resubmit history checks, including Reviewer filtering and the combined resubmission note. |
| F-03    | Low      | Documentation defect              | Resolved. The original UAT guide now uses the website's form labels, displayed statuses, and correct SRS references.                                          |

| **Fix status** | F-01, F-02, and F-03 resolved; all reported UAT case results pass |
| **Disposition** | Accepted. The 0.2.2 retest passed UAT-TC-01, UAT-TC-03, and UAT-TC-04. UAT-TC-02 and UAT-TC-05 passed in the original run. F-03 is resolved in the canonical UAT guide and requires no separate product test. |

---

## 3 Blocking-Defect Check

| Severity | Count | Status                                 |
| -------- | ----- | -------------------------------------- |
| HIGH     | 1     | PASS — F-01 resolved and retested      |
| MEDIUM   | 1     | PASS — F-02 resolved and retested      |
| LOW      | 1     | PASS — F-03 corrected in the UAT guide |

---

## 4 Legitimate-Defect and Correction Path

F-01 is a high-severity confidentiality defect. F-02 is a medium-severity history visibility defect: Requesters see `CREATED` and `SUBMITTED` for direct submission, but Reviewers see only `SUBMITTED`; Reviewers also do not see individual Requester edit entries, and their resubmission note summarizes all saved edit notes. F-03 is a low-severity handoff wording mismatch, not a missing form field. The agreed behavior and changes are recorded in `defect_correction.md`.

1. RED: the incoming report reproduced assigned-Reviewer access to a draft and missing history expectations.
2. GREEN: the API now filters and denies Reviewer access to drafts, filters Reviewer history, and records `CREATED` for every create. Direct submission also records `SUBMITTED` with a `None → PENDING_REVIEW` transition. The queue filters drafts before rendering. Reviewers see `SUBMITTED` but not `CREATED`. On resubmission, the Reviewer-facing reason combines all edit notes since the last return in order.
3. Documentation: the original UAT guide at `document/lab-6/UAT_TEST_CASES.md` has been corrected to use the website labels: `Request Title`, `Description`, `Estimated Amount ($)`, `Assign Reviewer`, and `Business Justification`. Quantity belongs in Description; there is no separate Quantity field. The visible status is `Pending Review`; `SUBMITTED` is a history event. Its original five case IDs and core test journeys remain in place, with corrected expectations and SRS references. F-03 is therefore resolved; no additional test is required for this documentation correction.
4. Retest: the Version 0.2.2 retest passed UAT-TC-01, UAT-TC-03, and UAT-TC-04. The original run passed UAT-TC-02 and UAT-TC-05. Tested revision: `macau678-migrate-bqw67`.

---

## 5 UAT Acceptance Decision

| Field                          | Value                                                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decision**                   | PASS — F-01, F-02, and F-03 resolved; all five UAT cases have passing results                                                                                                                                             |
| **Tested code**                | Branch `fix/draft-visibility-and-reviewer-timeline-correction`, Issue #60                                                                                                                                                 |
| **Verification**               | UAT-TC-01, UAT-TC-03, and UAT-TC-04 passed on Version 0.2.2, revision `macau678-migrate-bqw67`. UAT-TC-02 and UAT-TC-05 passed in the original run. Server/E2E regression and TypeScript checks passed as recorded below. |
| **Outstanding UAT conditions** | None. All five UAT cases have passing results; F-03 required a guide correction and no separate product test.                                                                                                             |
| **Reasons**                    | Retesting confirmed draft privacy and role-specific history. The corrected UAT guide matches the website and SRS.                                                                                                         |

---

## 6 Version Table

| Item                          | Value                                                           |
| ----------------------------- | --------------------------------------------------------------- |
| Issue                         | [#60](https://github.com/bravefe/Software-Engineer-2/issues/60) |
| Branch                        | `fix/draft-visibility-and-reviewer-timeline-correction`         |
| Version 0.2.2 retest revision | `macau678-migrate-bqw67`                                        |
| Version 0.2 revision          | `macau678-migrate-5ms22`                                        |
| Version 0.2.2 source tag      | `8f21c3252e72db1a17c9976701582fd21dc73cf5`                      |
| Version 0.2 source tag        | `f9d653882a40278394a1b007f98fdc5b7955ad34`                      |

---

## 7 Contributions and AI Use

| Area                  | Contribution                                                                         |
| --------------------- | ------------------------------------------------------------------------------------ |
| UAT case preparation  | Macau678 Development Team; original UAT guide retained and corrected                 |
| Retest execution      | AI-assisted browser retest requested by Lathapol; results recorded for Version 0.2.2 |
| Triage and resolution | Macau678 Development Team with AI assistance                                         |

**AI-use declaration:** AI assistance was used to review the UAT reports, assess finding severity, and update the UAT, resolution, and defect-correction documents. The retest results are recorded against Version 0.2.2, revision `macau678-migrate-bqw67`; the local automated results are listed separately.

**Final status:** All findings are resolved and all five UAT cases have passing results.
