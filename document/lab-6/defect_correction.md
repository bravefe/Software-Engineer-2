# Product Defect Correction

## 1 Defect Report

| Field                 | Entry                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Issue ID              | [#49](https://github.com/bravefe/Software-Engineer-2/issues/49)                                                                |
| Product team          | Macau678                                                                                                                       |
| Tested version        | 0.2                                                                                                                            |
| Preconditions         | UAT-TC-03 requires a second requester and second reviewer for cross-user ownership and assignment checks                       |
| Expected result       | The seed provides `requester2@macau678.com`                                                                                    |
| Actual result         | Version 0.2 seeded only `requester1@macau678.com` and `reviewer1@macau678.com`, preventing a complete cross-user UAT-TC-03 run |
| Severity              | Low                                                                                                                            |
| Defect vs Enhancement | Defect: missing test users caused an authorization boundary case to be incomplete                                              |

## 2 Triage

| Classification    | Reason tied to Sprint 1 contract                                                                                                                         | Fix status             | Disposition                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| Test setup defect | AC-10 and BR-09 require access to another user's request to be denied. Version 0.2 did not contain enough accounts to exercise and verify this boundary. | Fixed in Version 0.2.1 | Retest UAT-TC-03 and retain the existing access-control implementation |

---

## 3 RED: Failing Regression Test

- Defective commit: `f9d653882a40278394a1b007f98fdc5b7955ad34`
- Test file : No automated test file was used. UAT-TC-03.

Expected Result: Beable to login to another requester account.

Actual Result: Can not login to another account since there is only one.

## 4 GREEN: Fix

```diff
  {
    email: "requester1@macau678.com",
    name: "Alice Requester",
    role: "REQUESTER" as const,
  },
+ {
+   email: "requester2@macau678.com",
+   name: "Bob Requester",
+   role: "REQUESTER" as const,
+ },
  {
    email: "reviewer1@macau678.com",
    name: "Carol Reviewer",
    role: "REVIEWER" as const,
  },
+ {
+   email: "reviewer2@macau678.com",
+   name: "Dave Reviewer",
+   role: "REVIEWER" as const,
+ },
```

Same test after fix: Can now login to account `requester2@macau678.com` and can not access `requester1@macau678.com` ticket.

Fixed commit: `8dd0dbea95c31c91d5c7617a2bdb4ee01dc06a16`

## 5 Regression Suite

| Command               | Result |
| --------------------- | ------ |
| `npm run test:server` | Pass   |
| `npm run test:server` | Pass   |
| `npm run test:e2e`    | Pass   |

Evidence: [https://github.com/bravefe/Software-Engineer-2/actions/runs/44921900504](https://github.com/bravefe/Software-Engineer-2/actions/runs/44921900504)

---

## 6 Review, CI and Release

| Step                       | Evidence                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Fix branch, linked Issue   | `hotfix/seed-more-user-for-uat-cross-testing`; Issue [#49](https://github.com/bravefe/Software-Engineer-2/issues/49) |
| PR number and link         | [PR #45](https://github.com/bravefe/Software-Engineer-2/pull/45)                                                     |
| Reviewed release to `main` | PR #45 merged as `c7504ea5bedea81ce9d7ecf100e15933c918698b`                                                          |

## 7 Independent Retest by UAT Team

| Field                               | Entry                                                          |
| ----------------------------------- | -------------------------------------------------------------- |
| Corrected version given to UAT team | 0.2.1, merge commit `c7504ea5bedea81ce9d7ecf100e15933c918698b` |
| Original case / steps re-run        | UAT-TC-03, Part B                                              |
| Actual result                       | Awaiting independent retest                                    |
| PASS / FAIL                         | Pending                                                        |
| Affected cases re-run               | -                                                              |
