# CAP Management

## Purpose

Manage root cause and corrective/preventive actions.

## Key fields

- Root cause
- Corrective action
- Preventive action
- Responsible person
- Target date
- Submission date
- Review status
- Revision

## Primary actions

- Save draft
- Submit CAP
- Accept
- Reject
- Request more info
- Revise

## Business rules

- CAP can have revisions
- Rejected CAP needs reason
- CAP target date cannot exceed finding due date unless extension approved
- CAP accepted is not closure

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
