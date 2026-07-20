# Findings Management

## Purpose

Create, issue, track and close findings.

## Key fields

- Finding number
- Audit
- Organization
- Title
- Description
- Reference
- Severity
- Due date
- Status
- Owner
- Next action
- CAP required
- Evidence required
- Repeat flag

## Primary actions

- Review Potential Finding
- Return, dismiss, or convert Potential Finding
- Review CAP
- Review evidence
- Request more info
- Close
- Escalate

## Business rules

- Issued findings cannot be deleted
- CAP accepted does not close finding
- Observation does not require CAP, Evidence, or a Due Date by default
- Evidence `Close` records evidence-verified closure; authorized closure is a
  separate Department Manager, reason-required path
- Internal notes separated
- Critical/overdue findings appear on manager dashboard

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
