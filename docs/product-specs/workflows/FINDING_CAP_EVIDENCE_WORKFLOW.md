# Finding CAP Evidence Workflow

## Purpose

Manage finding follow-up from issue to closure.

## Steps

1. Create finding
2. Issue to auditee
3. Service Provider submits root cause, corrective action, preventive action,
   responsible person, target completion date, and mock Evidence filenames
4. CAA reviews CAP
5. CAP is accepted or returned; acceptance leaves the Finding open
6. Service Provider uploads a new mock Evidence filename/version when required
7. Inspector or Lead Inspector reviews the latest Evidence version and records
   `Close`, `Partially Close`, or `Not Close`
8. `Close` closes the Finding; the other outcomes request remaining action or
   Evidence and keep the Finding open
9. An authorized closure, when permitted, remains a separate reason-required
   path and does not create a CAP verification result

## Rules

- CAP accepted is not closure.
- `Close` maps the Finding to `CLOSED` and records `evidence-verified` closure.
- `Partially Close` and `Not Close` map the Finding to
  `EVIDENCE_MORE_INFO`; both record `findingClosed: false`.
- Every CAP verification outcome requires a separate `Comment to Auditee` and
  `Internal CAA Note`.
- Only Inspector or Lead Inspector records CAP verification outcomes in this
  demo.
- Evidence versions and CAP verification history are append-only; an earlier
  Evidence record is never overwritten or deleted.
- Authorized closure requires separate authority and does not impersonate
  Evidence verification.
- Enforcement remains a referral for separate authorized review and does not
  apply a sanction automatically.

## UX notes

- Show current owner, due date and next action at the top of the screen.
- Keep history in timeline/tab, not as primary content.
- Use primary buttons that match the next action.
- Display the latest result, actor, timestamp, Evidence version, whether the
  Finding remains open, and the next action.
- Never expose `Internal CAA Note` to the Service Provider.
