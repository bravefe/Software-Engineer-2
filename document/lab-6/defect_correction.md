# Product Defect Correction

## 1 Defect Report

| Field           | Entry                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue ID        | [#60](https://github.com/bravefe/Software-Engineer-2/issues/60)                                                                                                                                                                                                                                                                          |
| Product team    | Macau678                                                                                                                                                                                                                                                                                                                                 |
| Branch          | `fix/draft-visibility-and-reviewer-timeline-correction`                                                                                                                                                                                                                                                                                  |
| Findings        | F-01 draft visibility; F-02 history completeness and role filtering; F-03 UAT wording                                                                                                                                                                                                                                                    |
| Severity        | F-01 High; F-02 Medium; F-03 Low                                                                                                                                                                                                                                                                                                         |
| Expected result | Drafts are visible only to their Requester. Requesters see complete history, including `CREATED` and `SUBMITTED` on direct submit. Reviewers see `SUBMITTED` and review events without `CREATED` or individual `EDITED` entries. A `RESUBMITTED` note combines all edit notes since the latest return. The UAT labels match the website. |
| Actual result   | An assigned Reviewer could open a draft. Reviewer history needed role filtering and the resubmission note showed only the latest edit. On direct submit, `CREATED` was absent from both role timelines instead of appearing for the Requester only. UAT instructions used field and status names that do not match the website.          |
| Classification  | F-01: high-severity confidentiality defect. F-02: medium-severity audit-history defect. F-03: low-severity documentation defect.                                                                                                                                                                                                         |

## 2 Triage

| Finding | Fix                                                                                                                                                                                                                              | Status                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| F-01    | Filter `DRAFT` from Reviewer request lists and queue rendering. Deny Reviewer access to draft details and history, whether assigned or unassigned. Keep the draft visible to its owner.                                          | PASS — retested on Version 0.2.2        |
| F-02    | Write `CREATED` for every create and `SUBMITTED` for direct submit. Filter `CREATED` and individual requester-generated `EDITED` entries from Reviewer history. Combine all edit notes since the latest return in `RESUBMITTED`. | PASS — retested on Version 0.2.2        |
| F-03    | Correct the original UAT guide's field labels, displayed statuses, and SRS mappings while keeping its original case IDs and journeys. Quantity remains part of Description; no separate Quantity field is implied.               | PASS — corrected in final UAT guide    |

## 3 RED: Failing Regression Test

- **Case:** UAT-TC-03, assigned Reviewer opening a Requester draft; timeline checks in UAT-TC-01 and UAT-TC-04.
- **Observed failure:** The assigned Reviewer could read the draft details. Reviewer timeline responses could include `CREATED` and requester-generated `EDITED` records.
- **Regression coverage:** `tests/server/integration.test.ts` and `tests/e2e/purchase-approval.spec.ts` now cover assigned and unassigned Reviewer draft access, requester history, and Reviewer history.

## 4 GREEN: Fix

- Reviewer list queries exclude `DRAFT` requests; the queue also filters drafts before rendering.
- Direct Reviewer requests for draft details or history return access denied, for both assigned and unassigned Reviewers.
- The Requester continues to see the draft and complete history.
- Reviewer history omits `CREATED` and `EDITED`. After a draft is submitted, Reviewer history shows `SUBMITTED` with `fromStatus: null` and `toStatus: PENDING_REVIEW`.
- Requester history contains `CREATED` followed by `SUBMITTED` for both draft submission and direct submission. Reviewer history hides `CREATED` and begins with `SUBMITTED`.
- The `RESUBMITTED` reason combines every `EDITED` reason since the latest `RETURNED` event in chronological order. The final note from the edit form is included once, even though the form sends it with both the save and resubmit requests.
- The original UAT guide at `document/lab-6/UAT_TEST_CASES.md` now uses the live labels: `Request Title`, `Description`, `Estimated Amount ($)`, `Assign Reviewer`, and `Business Justification`. Put quantity details in `Description`; there is no separate Quantity input. The status badge reads `Pending Review`; `SUBMITTED` is a timeline event. The guide retains its original UAT-TC-01 through UAT-TC-05 case IDs and core journeys, and its SRS references now match `document/srs.md`.

## 5 Regression Suite

| Command                         | Result                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run test:server`           | Pass: 49 passed, 4 TODOs                                                                  |
| `npm run test:e2e`              | Pass: 3 passed, 2 out-of-scope cases skipped                                              |
| Server/client TypeScript checks | Pass                                                                                      |
| `npm run build`                 | Blocked during Prisma Client generation by Windows `EPERM` renaming its query-engine file |

The local integration and E2E regressions verify draft access, role-specific timelines, direct-submit `CREATED` and `SUBMITTED` events, and resubmission note aggregation. The Version 0.2.2 retest also passed UAT-TC-01, UAT-TC-03, and UAT-TC-04. UAT-TC-02 and UAT-TC-05 passed in the original run. F-03 was resolved by correcting the original UAT guide; no product test was needed for this documentation change.

The reported Version 0.2.2 retest ran on Cloud Run revision `macau678-migrate-bqw67`, source/image tag `8f21c3252e72db1a17c9976701582fd21dc73cf5`.

## 6 Review, CI and Release

| Step                     | Evidence                                                                                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fix branch, linked Issue | `fix/draft-visibility-and-reviewer-timeline-correction`; Issue [#60](https://github.com/bravefe/Software-Engineer-2/issues/60)                                                          |
| Pull request             | Not created in this work                                                                                                                                                                |
| Deployed release         | https://macau678-purchase-approval-gfn7poakkq-as.a.run.app/; Version 0.2.2; Cloud Run revision `macau678-migrate-bqw67`; image/source commit `8f21c3252e72db1a17c9976701582fd21dc73cf5` |

## 7 Deployed Retest Results

| Field                               | Entry                                                                                                                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corrected version given to UAT team | Version 0.2.2 at https://macau678-purchase-approval-gfn7poakkq-as.a.run.app/; Cloud Run revision `macau678-migrate-bqw67`; image/source commit `8f21c3252e72db1a17c9976701582fd21dc73cf5`          |
| Cases executed                     | UAT-TC-01 direct submit/approval; UAT-TC-03 draft privacy; UAT-TC-04 return/edit/resubmit. F-03 is resolved by this guide correction and is not a retest item. |
| Actual result                       | PASS for the reported Version 0.2.2 retest scenarios; UAT-TC-02 and UAT-TC-05 passed in the original run.                    |
| PASS / FAIL                         | PASS                                                                                                                          |
| Affected cases                      | UAT-TC-01, UAT-TC-03, and UAT-TC-04                                                                                           |
| Tested revision                     | `macau678-migrate-bqw67`                                                                                                      |
