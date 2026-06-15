# Evidence Repository

## Purpose

Store and review evidence with versions.

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
- Preview
- Accept
- Reject
- Request more information

## Business rules

- Never delete submitted evidence
- Old evidence marked superseded
- Reject requires reason
- Internal notes separate from auditee comments

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
