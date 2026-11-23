# UAT Report Retest

**Test Evidence:** [https://docs.google.com/document/d/15YZejPw8yIwcs4R5TKNnu7FhPABnV89XdWPvdhN5TMg/edit?tab=t.0#heading=h.8y5fey5hd4yf](https://docs.google.com/document/d/15YZejPw8yIwcs4R5TKNnu7FhPABnV89XdWPvdhN5TMg/edit?tab=t.0#heading=h.8y5fey5hd4yf)

**Overall: PASS.**
**Testdate:** 23-Nov-2026
**Tester Name:** Patcharak Plipat
Current release
**App:** https://approvals-389973748230.asia-southeast1.run.app/
**SHA:** 8bc9448d478464784acb48fce6bbe4c18973946d
**Cloud Run revision:** approvals-r45190529393-1

The retest for UAT6-03 confirmed the cross-requester access restriction.

## Test Results Summary

| Test ID | Test Area                                      | Result |
| ------- | ---------------------------------------------- | ------ |
| UAT6-03 | Cross-requester ownership and forbidden review | PASS   |

## Defect Report

### UAT6-03 – Cross-requester Ownership and Forbidden Review

- **Expected:** HTTP 404 (Not Found)
- **Actual:** HTTP 404 (Not Found)
- **Impact:** No unauthorized access or private data disclosure occurred. The access restriction remained enforced.

**Finding:**

No issue was observed in the retested behavior. The direct read of request #13 as requester2 returned HTTP 404 (Not Found), matching the UAT expectation and preventing private data disclosure.

## Conclusion

All test passed successfully.
