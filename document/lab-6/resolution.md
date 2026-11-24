# Resolution

## 1 Summary of Received Findings

Version: 0.2.1
Test Date: 24 November 2026

| Finding                     | Category        | Result                                                                                                                                                                              |
| --------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 / UAT-TC-03 Part A     | Draft privacy   | [HIGH — FIXED IN BRANCH] An assigned Reviewer could read a Requester's unsubmitted draft.                                                                                           |
| F-02 / UAT-TC-01, UAT-TC-04 | Audit history   | [MEDIUM — FIXED IN BRANCH] Requesters see `CREATED` and `SUBMITTED`, including on direct submit. Reviewers do not see `CREATED`, and resubmission notes summarize saved edit notes. |
| F-03                        | Handoff wording | [LOW — DOCUMENTATION CORRECTED] UAT field names and displayed status names did not match the website.                                                                               |

**Total findings received: 3**

---

## 2 Triage Table

| Finding | Severity | Classification                    | Reason and disposition                                                                                                                                                                                                                                                                                     |
| ------- | -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01    | High     | Product/security defect           | An assigned Reviewer viewed draft purchase details before submission. This exposes non-owner information and violates the draft privacy requirement. The branch filters drafts from Reviewer lists and denies direct detail/history access.                                                                |
| F-02    | Medium   | Audit-history / visibility defect | The Reviewer timeline exposed Requester-only events, and resubmission showed only the latest edit note. The branch filters Reviewer history and combines all edit notes in the `RESUBMITTED` reason. Requesters see `CREATED` for both draft saves and direct submissions; Reviewers do not see `CREATED`. |
| F-03    | Low      | Documentation defect              | The handoff used field and status names not shown by the website. The UAT guide now uses the web form labels and displayed status names.                                                                                                                                                                   |

| **Fix status** | F-01 and F-02 fixed locally; F-03 corrected; independent partner retest pending |
| **Disposition** | Retest F-01 and F-02 against the deployed release using the clarified history rules |

---

## 3 Blocking-Defect Check

| Severity | Count | Status                                       |
| -------- | ----- | -------------------------------------------- |
| HIGH     | 1     | F-01 fixed in branch; release retest pending |
| MEDIUM   | 1     | F-02 fixed in branch; release retest pending |
| LOW      | 1     | F-03 documentation corrected                 |

---

## 4 Legitimate-Defect and Correction Path

F-01 is a high-severity confidentiality defect. F-02 is a medium-severity history visibility defect: Requesters see `CREATED` and `SUBMITTED` for direct submission, but Reviewers see only `SUBMITTED`; Reviewers also do not see individual Requester edit entries, and their resubmission note summarizes all saved edit notes. F-03 is a low-severity handoff wording mismatch, not a missing form field. The agreed behavior and changes are recorded in `defect_correction.md`.

1. RED: the incoming report reproduced assigned-Reviewer access to a draft and missing history expectations.
2. GREEN: the API now filters and denies Reviewer access to drafts, filters Reviewer history, and records `CREATED` for every create. Direct submission also records `SUBMITTED` with a `None → PENDING_REVIEW` transition. The queue filters drafts before rendering. Reviewers see `SUBMITTED` but not `CREATED`. On resubmission, the Reviewer-facing reason combines all edit notes since the last return in order.
3. Documentation: the UAT guide now uses the website labels: `Request Title`, `Description`, `Estimated Amount ($)`, `Assign Reviewer`, and `Business Justification`. Quantity belongs in the Description; there is no separate Quantity field. The visible status is `Pending Review`; `SUBMITTED` is a history event.
4. Retest: UAT-TC-03 was rerun in the automated browser suite with both the assigned and unassigned Reviewer. Independent partner UAT on the deployed release is still pending.

---

## 5 UAT Acceptance Decision

| Field                        | Value                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decision**                 | F-01 and F-02 fixes pass local regression; independent release retest pending                                                                                                               |
| **Tested code**              | Branch `fix/draft-visibility-and-reviewer-timeline-correction`, Issue #60                                                                                                                   |
| **Verification**             | Server: 49 passed, 4 existing TODOs. E2E: 3 passed, 2 out-of-scope cases skipped. TypeScript checks passed. Tests cover draft history, Reviewer filtering, and combined resubmission notes. |
| **Conditions / limitations** | Partner team must rerun UAT-TC-03 and UAT-TC-04 against the deployed release. The deployed revision was not verified.                                                                       |
| **Reasons**                  | Assigned and unassigned Reviewer checks passed locally. Direct submission records both events for the Requester; the Reviewer sees `SUBMITTED` without `CREATED`.                           |

---

## 6 Version Table

| Item              | Value                                                           |
| ----------------- | --------------------------------------------------------------- |
| Issue             | [#60](https://github.com/bravefe/Software-Engineer-2/issues/60) |
| Branch            | `fix/draft-visibility-and-reviewer-timeline-correction`         |
| Deployed revision | Not verified; partner retest required                           |

---

## 7 Contributions, AI Use, Limitations

| Area                              | Student 1 | Student 2 |
| --------------------------------- | --------- | --------- |
| UAT case preparation              |           |           |
| Executing partner's cases         |           |           |
| Triage and resolution             |           |           |
| Cross-review of each other's work |           |           |

**AI-use declaration:** AI assistance was used to update and organize this document. The partner team should verify the issue disposition and deployed-release details during its retest. AI assistance was also used to review the incoming UAT report and assess finding severity. Implement draft access controls and role-specific history, including direct-submit `CREATED` events and combined resubmission notes; add and update server and E2E regression tests; and revise the SRS, SDS, STS, issue, resolution, and retest documents. The listed test results reflect commands run in this session. The product team should review the changes and independently retest the deployed release.

**Known limitations:** The automated retest used a local test environment and does not replace independent partner UAT on the deployed release.
