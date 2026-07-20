# Evidence Repository

## Purpose

Record and review demo Evidence filenames with preserved versions.

## Key fields

- Evidence ID
- File name
- File type
- Version
- Uploaded by
- Upload date
- Review status
- Review comment

## Primary actions

- Upload
- Replace/supersede
- Review latest version
- Close
- Partially Close
- Not Close

## Business rules

- Never delete submitted evidence
- Old evidence marked superseded
- Reject requires reason
- Internal notes separate from auditee comments
- Close records evidence-verified Finding closure; Partially Close and Not
  Close preserve the open Finding
- The frontend-only demo stores filenames, not files

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
