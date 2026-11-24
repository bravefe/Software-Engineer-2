# Retest Request — Issue #60

Please rerun the checks below against the corrected deployed release. Before testing, record the app version, source commit, and Cloud Run revision; these were not verified during the local regression run.

## F-01 — High: Draft privacy

1. Create a DRAFT as `requester1` and assign it to `reviewer1`.
2. As the assigned Reviewer, confirm the draft is absent from the Reviewer Queue and direct detail/history access is denied.
3. Repeat as unassigned `reviewer2`.
4. Sign in as `requester1` and confirm the owner can still open the draft and see its history.

**Pass:** Neither Reviewer can discover or open the draft; the Requester can.

## F-02 — Medium: History

1. Submit the saved draft. As the Requester, confirm `CREATED` then `SUBMITTED` are shown. As the assigned Reviewer, confirm `SUBMITTED` shows `None → Pending Review` and `CREATED` is hidden.
2. Return the request. As the Requester, edit it and confirm the `EDITED` entry shows the requester, timestamp, `Returned → Returned`, and reason. As the Reviewer, confirm `EDITED` is hidden.
3. Separately create and submit a request directly. Check whether the Requester timeline shows `CREATED` before `SUBMITTED`, as the incoming UAT handoff expects. Record the result and confirm any mismatch with the Product Owner before closing F-02.

**Pass:** Role-specific draft history matches the rules above, and the direct-submit history expectation is explicitly resolved.

## F-03 — Low: UAT wording

Use the website labels: `Request Title`, `Description`, `Estimated Amount ($)`, `Assign Reviewer`, and `Business Justification`. Enter any quantity in `Description`; there is no separate Quantity field. The displayed state is `Pending Review`; `SUBMITTED` is a timeline event.

Please record the result for each finding, any evidence or request IDs used, and the tested release details. Do not reset shared test data without coordinating with the team.
