# Resolution

## 1 Summary of Received Findings

Version: 0.2.1 (issue branch under retest)  
Test Date: 24 November 2026

| Finding | Category | Result |
| ------- | -------- | ------ |
| F-01 / UAT-TC-03 Part A | Draft privacy | [HIGH — FIXED IN BRANCH] An assigned Reviewer could read a Requester's unsubmitted draft. |
| F-02 / UAT-TC-01, UAT-TC-04 | Audit history | [MEDIUM — PARTIALLY FIXED] Role-specific Reviewer history is corrected. The direct-submit Requester history still lacks the separate `CREATED` event expected by the handoff. |
| F-03 | Handoff wording | [LOW — DOCUMENTATION CORRECTED] UAT field names and displayed status names did not match the website. |

**Total findings received: 3**

---

## 2 Triage Table

| Finding | Severity | Classification | Reason and disposition |
| ------- | -------- | -------------- | ---------------------- |
| F-01 | High | Product/security defect | An assigned Reviewer viewed draft purchase details before submission. This exposes non-owner information and violates the draft privacy requirement. The branch filters drafts from Reviewer lists and denies direct detail/history access. |
| F-02 | Medium | Audit-history defect | The handoff expects a direct-submit Requester timeline to include `CREATED` before `SUBMITTED`. The current direct-submit flow records `SUBMITTED` only. The branch fixes Reviewer filtering and preserves `CREATED`/`SUBMITTED` when a draft is submitted; the direct-submit event gap remains open for triage/retest. |
| F-03 | Low | Documentation defect | The handoff used field and status names not shown by the website. The UAT guide now uses the web form labels and displayed status names. |

| **Fix status** | F-01 fixed locally; F-02 partially fixed; F-03 corrected; independent partner retest pending |
| **Disposition** | Retest F-01 and role-specific timelines; confirm the F-02 direct-submit history requirement with the partner team |

---

## 3 Blocking-Defect Check

| Severity | Count | Status |
| -------- | ----- | ------ |
| HIGH | 1 | F-01 fixed in branch; release retest pending |
| MEDIUM | 1 | F-02 partially fixed; direct-submit `CREATED` event remains open |
| LOW | 1 | F-03 documentation corrected |

---

## 4 Legitimate-Defect and Correction Path

F-01 is a high-severity confidentiality defect. F-02 is medium severity because the direct-submit Requester timeline is incomplete against the handoff, although submission actor/time remain recorded. The branch also corrects role-specific Reviewer history and draft submission history. F-03 is a low-severity handoff mismatch, not a missing form field. Changes and the remaining F-02 gap are recorded in `defect_correction.md`.

1. RED: the incoming report reproduced assigned-Reviewer access to a draft and missing history expectations.
2. GREEN: the API now filters and denies Reviewer access to drafts, filters Reviewer history, and records draft submission as `SUBMITTED` with a `None → PENDING_REVIEW` transition. The queue also filters drafts before rendering. Requesters see `CREATED` followed by `SUBMITTED` for the draft-submit path.
3. Documentation: the UAT guide now uses the website labels: `Request Title`, `Description`, `Estimated Amount ($)`, `Assign Reviewer`, and `Business Justification`. Quantity belongs in the Description; there is no separate Quantity field. The visible status is `Pending Review`; `SUBMITTED` is a history event.
4. Retest: UAT-TC-03 was rerun in the automated browser suite with both the assigned and unassigned Reviewer. Independent partner UAT on the deployed release is still pending.

---

## 5 UAT Acceptance Decision

| Field | Value |
| ----- | ----- |
| **Decision** | F-01 and role-specific history fixes pass local regression; overall acceptance pending F-02 triage and independent release retest |
| **Tested code** | Branch `fix/draft-visibility-and-reviewer-timeline-correction`, Issue #60 |
| **Verification** | Server: 49 passed, 4 existing TODOs. E2E: 3 passed, 2 out-of-scope cases skipped. Production build passed. These checks cover draft submission and role filtering, not the direct-submit `CREATED` event. |
| **Conditions / limitations** | Partner team must rerun UAT-TC-03 against the deployed release and confirm whether direct submission requires a separate `CREATED` history event. The deployed revision was not verified. |
| **Reasons** | Assigned and unassigned Reviewer checks passed locally. The incoming F-02 direct-submit expectation remains unresolved. |

---

## 6 Version Table

| Item | Value |
| ---- | ----- |
| Issue | [#60](https://github.com/bravefe/Software-Engineer-2/issues/60) |
| Branch | `fix/draft-visibility-and-reviewer-timeline-correction` |
| Deployed revision | Not verified; partner retest required |

---

## 7 Contributions, AI Use, Limitations

| Area | Student 1 | Student 2 |
| ---- | --------- | --------- |
| UAT case preparation |  |  |
| Executing partner's cases |  |  |
| Triage and resolution |  |  |
| Cross-review of each other's work |  |  |

**AI-use declaration:** AI assistance was used to update and organize this document. The partner team should verify the issue disposition and deployed-release details during its retest.

**Known limitations:** The local fix does not add a separate `CREATED` event for direct submission. The automated retest used a local test environment and does not replace independent partner UAT on the deployed release.
