# Lab 7.1 Change Request: Edit or Withdraw a Pending Request

**Parent issue:** #65  
**Branch:** `docs/lab7-change-analysis`  
**Status:** Proposed
**Change type:** Sprint 1 behavior change; documentation only in issue 7.1

## Change request

### Original behavior

The Sprint 1 baseline allows a Requester to edit a request only after a Reviewer returns it. A request in `PENDING_REVIEW` cannot be edited, and requester-generated `EDITED` history entries are hidden from Reviewers. Approved and rejected requests cannot be edited.

### Proposed behavior

The owning Requester may edit or withdraw a request while it is `PENDING_REVIEW`. An edit keeps the request pending, and its updated details and revision history are visible to both the Requester and assigned Reviewer. Withdrawal moves it to terminal `WITHDRAWN`; it can no longer be edited or reviewed. Existing edit and resubmission behavior for `RETURNED` requests remains in effect. Draft, approved, and rejected behavior remains unchanged.

“Withdraw” is used for the Requester's action on a pending request. It distinguishes the action from a Reviewer rejecting a request and from deleting a record; the request and its audit history remain stored.

## Baseline and pre-change reference

- **Lab 6 baseline commit:** `71080afe5302c4152e4895528f0a43665147ee4e` (`v0.2.3`)
- **Pre-change document snapshot:** `47bd9bec9d3cc94bc2e07e8bf58c5f987bf1b7e0` (`docs: Test Execution Summary in sts`, 2026-11-25), the `lab-7` documentation state before this change analysis.
- **Analysis branch starting commit:** `b0f4929` (`init: npm install`), layered on the pre-change document snapshot.
- **Baseline contract:** SRS FR-05, BR-06, AC-07, AD-05; SDS request edit endpoint, permission matrix, status lifecycle and role-specific history; STS TEST-INT-07 and TEST-E2E-01/02.

## Scope, reason, and acceptance criteria

**Reason:** A Requester may need to correct or stop a request after submission but before the assigned Reviewer decides it. The current contract blocks such corrections and does not define withdrawal.

**In scope:** Requester ownership and pending-status checks; pending edits; participant visibility of the latest request details; an auditable withdrawal action and terminal status; regression protection for returned, draft, approved, and rejected requests.

**Out of scope:** Reviewer edit/withdraw authority; deleting requests or history; changing approval/rejection/return rules; changing returned-request resubmission semantics; changing assignment or multi-stage approval.

**Acceptance criteria:**

1. Only the owning Requester can edit or withdraw their `PENDING_REVIEW` request.
2. A pending edit keeps status `PENDING_REVIEW`, records an edit in history, and exposes the current details and revision event to the Requester and assigned Reviewer.
3. Withdrawal records a `WITHDRAWN` event, changes the status to terminal `WITHDRAWN`, and prevents later review, edit, or repeat withdrawal.
4. Draft, approved, and rejected requests remain non-editable/non-withdrawable; returned edit and resubmit behavior remains intact.
5. All access remains authenticated and ownership/assignment scoped.

## Change impact analysis

| Area                      | Impact                                                                                                                                                                 | Required contract / verification                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Requirements (SRS)        | FR-05 and BR-06 change; AC-13 added; AD-10 supersedes original AD-05; FR-06 clarifies edit/withdraw history visibility.                                                | Define eligible statuses, unchanged status on edit, participant visibility, terminal withdrawal, and unchanged states. |
| Design (SDS)              | Request status and history action enums gain `WITHDRAWN`; edit UI/API authorization expands; withdrawal endpoint/action and role matrix added; status diagram changes. | Preserve audit trail, ownership checks, assignment visibility, and valid transitions.                                  |
| Acceptance criteria (SRS) | Existing AC-07 remains for returned requests; new AC-13 covers pending edit/withdraw and scope boundaries.                                                             | Test both new behavior and regression boundaries.                                                                      |
| Test specification (STS)  | TEST-INT-07 and TEST-E2E-06 specify pending edit/withdraw, role visibility, terminal restrictions, and returned-flow regression.                                       | Specifications only in 7.1; automated test files are added or updated in issue 7.3 (#66).                              |
| Traceability              | FR-05, BR-06, and AC-13 map to FEAT-08 and TEST-INT-07 / TEST-E2E-01.                                                                                                  | Mark new behavior implementation pending, not passed.                                                                  |
| Code/data and tests       | Request route/service guards, transition validation, status/action enums and DB constraints, UI, history filtering, and review guards will require changes.            | Implement in issue 7.2 without test-file changes; record errors and test gaps for issue 7.3 (#66).                     |

## Existing behavior that must remain unchanged

- Requester and Reviewer authentication, role checks, ownership isolation, and reviewer assignment checks.
- Draft privacy and draft submission behavior.
- Reviewer approve/reject/return decisions, mandatory reject/return reasons, and terminal approved/rejected states.
- Returned-request edits and resubmission, including existing note aggregation rules.
- Immutable chronological history and persistence; withdrawal is not deletion.
- No edit or withdrawal after a reviewer decision.
