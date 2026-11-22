# Resolution

## 1 Summary of Received Findings

Version: 0.2.1
Test Date: 21 November 2026

| Test Case | Category                      | Result                                                                       |
| --------- | ----------------------------- | ---------------------------------------------------------------------------- |
| UAT-TC-01 | Normal domain journey         | [PASS]                                                                       |
| UAT-TC-02 | Business rule / boundary      | [PASS]                                                                       |
| UAT-TC-03 | Forbidden role / ownership    | [FAIL (Low) - could not complete cross-user checks on Version 0.2] |
| UAT-TC-04 | State / history / persistence | [PASS]                                                                       |
| UAT-TC-05 | Terminal state immutability   | [PASS]                                                                       |

**Total findings received: 1**

---

## 2 Triage Table

| Field                | Details                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue ID**         | UAT-TC-03 / [#49](https://github.com/bravefe/Software-Engineer-2/issues/49)                                                                                                                                                                                                  |
| **Linked case / AC** | UAT-TC-03 / AC-10, BR-09                                                                                                                                                                                                                                                     |
| **Classification**   | Test setup defect                                                                                                                                                                                                                                                            |
| **Severity**         | Low                                                                                                                                                                                                                                                                          |
| **Reason**           | Version 0.2 had only `requester1` and `reviewer1`, so cross-requester ownership could not be tested. Version 0.2.1 adds `requester2` and `reviewer2`. |

| **Fix status** | Fixed for testability, retest pending |
| **Disposition** | Retest UAT-TC-03 on Version 0.2.1 |

---

## 3 Blocking-Defect Check

| Severity | Count | Status     |
| -------- | ----- | ---------- |
| HIGH     | 0     | N/A        |
| MEDIUM   | 0     | N/A        |
| LOW      | 1     | Retestable |

---

## 4 Legitimate-Defect and Correction Path

UAT-TC-03 is the received finding. Version 0.2 could not perform the cross-requester check because the seed contained only one requester account and one reviewer account. The correction is documented in `defect_correction.md`.

1. RED: cross-requester UAT-TC-03 could not be completed with the Version 0.2 seed.
2. GREEN: the seed was corrected by commit `8dd0dbe` and merged to `main` in `c7504ea5bedea81ce9d7ecf100e15933c918698b`.
3. Retest: the partner UAT team must rerun UAT-TC-03 using `requester2@macau678.com` and `reviewer2@macau678.com` on Version 0.2.1.

---

## 5 Independent UAT Acceptance Decision

| Field                        | Value                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decision**                 | Accepted with condition                                                                                                                                         |
| **Tested release**           | `f9d653882a40278394a1b007f98fdc5b7955ad34`, Version 0.2; retest target `c7504ea5bedea81ce9d7ecf100e15933c918698b`, Version 0.2.1                                |
| **Sprint 1 scope**           | FEAT-01 to FEAT-09, AC-01 to AC-11                                                                                                                              |
| **Out of scope**             | FR-08 / AC-12 (email), FEAT-10, FEAT-11                                                                                                                         |
| **Decision date**            | 21 November 2026                                                                                                                                                |
| **Conditions / limitations** | UAT-TC-03 must be rerun independently on Version 0.2.1 before the final retest status can be closed.                                                          |
| **Reasons**                  | Four of five original UAT cases passed; UAT-TC-03 could not be completed as originally seeded. Version 0.2.1 adds the required accounts for cross-user testing. |

---

## 6 Version Table

| Item                   | Value                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Sprint 1 baseline      | `f9d653882a40278394a1b007f98fdc5b7955ad34` (Version 0.2)                                                     |
| Defective commit       | `f9d653882a40278394a1b007f98fdc5b7955ad34` seed did not contain second requester/reviewer accounts           |
| Corrected main release | `c7504ea5bedea81ce9d7ecf100e15933c918698b` (Version 0.2.1)                                                   |
| Deployed revision      | Pending Cloud Run revision name; deployed source: `c7504ea5bedea81ce9d7ecf100e15933c918698b` (Version 0.2.1) |
| Branch                 | `hotfix/seed-more-user-for-uat-cross-testing`                                                                |

---

## 7 Contributions, AI Use, Limitations

| Area                              | Student 1 | Student 2 |
| --------------------------------- | --------- | --------- |
| UAT case preparation              | X         |           |
| Executing partner's cases         |           | X         |
| Triage and resolution             |           | X         |
| Cross-review of each other's work |           | X         |

**AI-use declaration:** AI assistance was used to draft and organize this document. Release, findings, and commit references must be verified against the repository and UAT evidence.

**Known limitations:** Version 0.2 did not provide the two distinct accounts needed to complete UAT-TC-03. The final retest result and deployed Cloud Run revision must be recorded after the partner UAT team reruns the case.
