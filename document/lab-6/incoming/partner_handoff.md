# Cache Me If You Can - Partner UAT Handoff

## Project and Environment

| Item                        | Details                                                |
| --------------------------- | ------------------------------------------------------ |
| Project / team              | Cache Me if you can, Section 31                        |
| Repository                  | https://github.com/Lathapol/sprint-group-work          |
| UAT branch                  | `codex/lab6-uat-handoff`                               |
| Handoff folder              | `docs/labs/lab-06`                                     |
| Lab 5 source baseline       | `51b57adc1c51d57e23d047d628cf55966e268ad9`             |
| Observed Cloud Run revision | `approvals-r44500910145-1`                             |
| UAT application             | https://approvals-389973748230.asia-southeast1.run.app |

The exact source SHA and deployed revision must be confirmed through `/api/version` and `/api/health` before and after the UAT session.

## Partner Team Members

| Name                | Student ID  |
| ------------------- | ----------- |
| Lathapol Srikhiao   | 67070503475 |
| Kittakorn Poungpien | 67070503401 |

## Test Accounts

Use separate private/incognito browser profiles for different accounts and roles.

| Role      | Account      | Intended use                          |
| --------- | ------------ | ------------------------------------- |
| REQUESTER | `requester1` | Create and view own requests          |
| REQUESTER | `requester2` | Verify cross-requester ownership      |
| REVIEWER  | `reviewer1`  | Claim, approve, and reject requests   |
| REVIEWER  | `reviewer2`  | Verify assigned-reviewer restrictions |

The partner team provides synthetic passwords through a private course handoff channel. Do not copy passwords into this document, screenshots, issue reports, or shared evidence.

## UAT Materials

- [Partner UAT handoff](https://github.com/Lathapol/sprint-group-work/blob/codex/lab6-uat-handoff/docs/labs/lab-06/handoff.md)
- [Partner UAT test cases](https://github.com/Lathapol/sprint-group-work/blob/codex/lab6-uat-handoff/docs/labs/lab-06/uat-cases.md)
- [Partner execution record](https://github.com/Lathapol/sprint-group-work/blob/codex/lab6-uat-handoff/docs/labs/lab-06/execution.csv)
- [Partner findings record](https://github.com/Lathapol/sprint-group-work/blob/codex/lab6-uat-handoff/docs/labs/lab-06/findings.md)
