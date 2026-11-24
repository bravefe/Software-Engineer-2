Please independently retest UAT6-03: Cross-requester ownership and forbidden review.

Issue: https://github.com/Lathapol/sprint-group-work/issues/60

Current release
App: https://approvals-389973748230.asia-southeast1.run.app/
SHA: 8bc9448d478464784acb48fce6bbe4c18973946d
Cloud Run revision: approvals-r45190529393-1

This release publishes the reviewed UAT documents; no application code fix was required by our developer checks.

Request #13 setup
Owner: requester1
State when last checked: Pending
Category: PURCHASE
Amount: THB 25.50
Assigned reviewer: none

Retest steps
Sign in as requester1, open /requests/13, and record its current fields and Pending state. Sign out.
Sign in as requester2. Verify #13 is absent from My requests.
Open /requests/13 directly. Expected: Request not found, with no private data disclosed. A 404 for this GET is correct.
Still signed in as requester2, run this in DevTools Console:

const response = await fetch('/api/requests/13/claim', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({})
});
console.log(response.status, await response.json());

Expected: 403 Forbidden for the POST claim attempt.
Sign out, then sign in as requester1 again. Verify #13 remains Pending, has no reviewer, and its business fields are unchanged.

If #13 is no longer Pending, let us know before testing so we can provide a fresh record.

Please record:
Tester’s full name and execution date/time/timezone
Tested SHA and revision
Actual results and PASS/FAIL/BLOCKED
Screenshots showing the exact POST URL/method/status, the denied private read, and before/after record state
Your conclusion for issue #60

Please omit passwords, cookies and tokens from the evidence.
