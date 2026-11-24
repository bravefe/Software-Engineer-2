# Resolution

## 1 Summary of Received Findings

Version: 0.2.1
Commit: `c7504ea5bedea81ce9d7ecf100e15933c918698b`
Test Date: 24 November 2026

| Finding                     | Category      | Result                                                                                                                                                                              |
| --------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 / UAT-TC-03 Part A     | Draft privacy | [HIGH — FIXED IN BRANCH] An assigned Reviewer could read a Requester's unsubmitted draft.                                                                                           |
| F-02 / UAT-TC-01, UAT-TC-04 | Audit history | [MEDIUM — FIXED IN BRANCH] Requesters see `CREATED` and `SUBMITTED`, including on direct submit. Reviewers do not see `CREATED`, and resubmission notes summarize saved edit notes. |
| F-03                        | UAT wording   | [LOW — RESOLVED] The original UAT guide now uses the website's field/status labels and corrected SRS references.                                                                    |

**Total findings received: 3**

---

## 2 Triage Table

| Finding | Severity | Classification                    | Reason and disposition                                                                                                                                                                                                                                                                                     |
| ------- | -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01    | High     | Product/security defect           | An assigned Reviewer viewed draft purchase details before submission. This exposes non-owner information and violates the draft privacy requirement. The branch filters drafts from Reviewer lists and denies direct detail/history access.                                                                |
| F-02    | Medium   | Audit-history / visibility defect | The Reviewer timeline exposed Requester-only events, and resubmission showed only the latest edit note. The branch filters Reviewer history and combines all edit notes in the `RESUBMITTED` reason. Requesters see `CREATED` for both draft saves and direct submissions; Reviewers do not see `CREATED`. |
| F-03    | Low      | Documentation defect              | The handoff used field and status names not shown by the website. The UAT guide now uses the web form labels and displayed status names.                                                                                                                                                                   |

| **Fix status** | F-01 and F-02 fixed locally; F-03 documentation correction complete |
| **Disposition** | F-01 and F-02 retain their previously stated deployed-release retest status. F-03 is resolved by correcting the canonical UAT guide; no additional product test is required for this documentation-only finding. |

---

## 3 Blocking-Defect Check

| Severity | Count | Status                                       |
| -------- | ----- | -------------------------------------------- |
| HIGH     | 1     | F-01 fixed in branch; release retest pending |
| MEDIUM   | 1     | F-02 fixed in branch; release retest pending |
| LOW      | 1     | F-03 resolved; canonical UAT guide corrected |

---

## 4 Legitimate-Defect and Correction Path

F-01 is a high-severity confidentiality defect. F-02 is a medium-severity history visibility defect: Requesters see `CREATED` and `SUBMITTED` for direct submission, but Reviewers see only `SUBMITTED`; Reviewers also do not see individual Requester edit entries, and their resubmission note summarizes all saved edit notes. F-03 is a low-severity handoff wording mismatch, not a missing form field. The agreed behavior and changes are recorded in `defect_correction.md`.

1. RED: the incoming report reproduced assigned-Reviewer access to a draft and missing history expectations.
2. GREEN: the API now filters and denies Reviewer access to drafts, filters Reviewer history, and records `CREATED` for every create. Direct submission also records `SUBMITTED` with a `None → PENDING_REVIEW` transition. The queue filters drafts before rendering. Reviewers see `SUBMITTED` but not `CREATED`. On resubmission, the Reviewer-facing reason combines all edit notes since the last return in order.
3. Documentation: the original UAT guide at `document/lab-6/UAT_TEST_CASES.md` has been corrected to use the website labels: `Request Title`, `Description`, `Estimated Amount ($)`, `Assign Reviewer`, and `Business Justification`. Quantity belongs in Description; there is no separate Quantity field. The visible status is `Pending Review`; `SUBMITTED` is a history event. Its original five case IDs and core test journeys remain in place, with corrected expectations and SRS references. F-03 is therefore resolved; no additional test is required for this documentation correction.
4. Retest: UAT-TC-03 was rerun in the automated browser suite with both the assigned and unassigned Reviewer. Independent partner UAT on the deployed release is still pending.

---

## 5 UAT Acceptance Decision

| Field                        | Value                                                                                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decision**                 | F-03 documentation issue resolved. F-01 and F-02 fixes pass local regression; independent release retest remains pending                                                                                                      |
| **Tested code**              | Branch `fix/draft-visibility-and-reviewer-timeline-correction`, Issue #60                                                                                                                                                     |
| **Verification**             | Server: 49 passed, 4 existing TODOs. E2E: 3 passed, 2 out-of-scope cases skipped. TypeScript checks passed. Tests cover draft history, Reviewer filtering, and combined resubmission notes.                                   |
| **Conditions / limitations** | F-01 and F-02: partner team retest against the deployed release remains pending; deployed revision not verified. F-03: no further test or document correction is required.                                                    |
| **Reasons**                  | Assigned and unassigned Reviewer checks passed locally. Direct submission records both events for the Requester; the Reviewer sees `SUBMITTED` without `CREATED`. The UAT wording and mappings now match the website and SRS. |

---

## 6 Version Table

| Item              | Value                                                           |
| ----------------- | --------------------------------------------------------------- |
| Issue             | [#60](https://github.com/bravefe/Software-Engineer-2/issues/60) |
| Branch            | `fix/draft-visibility-and-reviewer-timeline-correction`         |
| Deployed revision | Version 0.2.2. `8f21c3252e72db1a17c9976701582fd21dc73cf5`       |

---

## 7 Contributions, AI Use, Limitations

| Area                      | Student 1 | Student 2 |
| ------------------------- | --------- | --------- |
| UAT case preparation      | x         |           |
| Executing partner's cases |           | x         |
| Triage and resolution     |           | x         |

**AI-use declaration:** AI assistance was used to review the incoming UAT report, assess finding severity, and update the UAT, resolution, and defect-correction documents. The listed automated results reflect the earlier recorded local run; this final documentation edit was not a product-code change and required no additional product test. The partner team should still verify F-01 and F-02 against the deployed release as recorded above.

**Known limitations:** The automated retest used a local test environment and does not replace independent partner UAT on the deployed release.
