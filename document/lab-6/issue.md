# Lab 6 Draft Visibility and Reviewer Timeline Correction

- **Branch:** `fix/draft-visibility-and-reviewer-timeline-correction`
- **Issue:** #60

## Description

Reviewers must not be able to discover or open purchase requests that remain in DRAFT status.

### For F-01: Draft Visibility

- Hide DRAFT requests from the assigned reviewer's queue.
- Deny direct access to DRAFT requests for both assigned and unassigned reviewers.
- Keep DRAFT requests visible only to their owner.

### For F-02: Reviewer Timeline

- The website displays `PENDING_REVIEW` as **Pending Review**.
- After a draft is submitted, the Reviewer-facing timeline must show:
  - `SUBMITTED`
  - Status transition: `None → Pending Review`
- The Reviewer-facing timeline must not show `CREATED`.
- A Requester may continue to see their complete history, including `CREATED` followed by `SUBMITTED`.
- The Requester sees `CREATED` even when submitting immediately without saving a draft first. The assigned Reviewer does not see this `CREATED` entry; the Reviewer timeline begins with `SUBMITTED` (`None → Pending Review`).
- When a Requester edits a purchase request, the application currently records an `EDITED` timeline entry, for example:

  **EDITED Alice Requester (REQUESTER)**  
  11/24/2026, 7:39:13 PM  
  Status: **Returned → Returned**  
  Note / Reason: Request details updated by requester

- This `EDITED` record must remain available in the Requester-facing history but must not appear in the Reviewer-facing timeline, consistent with the role-specific history visibility requirements.
- If the Requester saves multiple edits before resubmitting, the Reviewer-facing `RESUBMITTED` note must combine all edit notes since the latest `RETURNED` event in chronological order. Do not duplicate the final note when the edit form sends it with both the save and resubmit requests.
- Update the SRS/SDS where needed to document role-specific DRAFT visibility and timeline behavior, including the visibility of Requester edit records.

## Task

- Filter DRAFT requests from reviewer list queries and queue rendering.
- Enforce DRAFT access denial in the request detail/API authorization check.
- Provide role-specific timeline filtering or presentation:
  - Show `CREATED` and `EDITED` records in the Requester-facing timeline.
  - Hide `CREATED` and Requester-generated `EDITED` records from the Reviewer-facing timeline.
  - Preserve the `SUBMITTED` event and correct status transition for reviewers.
  - Put the combined Requester edit notes in the Reviewer-facing `RESUBMITTED` event.
- Add server and E2E regression tests covering draft visibility, submission history, and Requester edit history.
- Update the SRS/SDS to explicitly clarify the overall role-specific visibility and timeline rules described above.
- Rerun UAT-TC-03 for assigned and unassigned reviewers.

## Acceptance Criteria

- A DRAFT never appears in Reviewer Queue.
- An assigned Reviewer receives access denied or a redirect when opening a DRAFT directly.
- An unassigned Reviewer receives access denied or a redirect when opening a DRAFT directly.
- A DRAFT remains visible to its Requester.
- After submission, the assigned Reviewer sees the status **Pending Review**.
- The Reviewer-facing timeline contains `SUBMITTED` with the transition `None → Pending Review`.
- The Reviewer-facing timeline does not contain `CREATED`.
- Requester-generated `EDITED` records do not appear in the Reviewer-facing timeline.
- The Requester-facing timeline continues to show the complete history, including DRAFT creation, submission, and subsequent edits.
- Requester edits continue to be recorded in the application with the `EDITED` event, actor, timestamp, status transition, and note/reason.
- When multiple edits are saved before resubmission, the Reviewer sees all edit notes combined in the `RESUBMITTED` reason; the Requester continues to see each separate `EDITED` entry.
- The SRS/SDS explicitly describe these role-specific visibility and timeline rules.
