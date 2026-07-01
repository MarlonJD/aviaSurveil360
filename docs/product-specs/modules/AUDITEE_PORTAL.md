# Auditee Portal

## Purpose

Allow external organizations to view findings and respond.

## Key fields

- My Findings
- CAP Required
- Evidence Required
- Due Soon
- Overdue
- Messages
- Closed findings

## Primary actions

- View finding
- Submit CAP
- Upload evidence
- Respond to request
- Download report
- Message CAA

## Business rules

- Auditee sees only own organization
- No internal notes
- No other organizations
- Evidence is versioned

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
