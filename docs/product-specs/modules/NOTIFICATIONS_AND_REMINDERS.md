# Notifications and Reminders

## Purpose

Record deterministic browser-local due-date and manager-attention events.

## Key fields

- Trigger
- Recipient
- Channel
- Subject
- Message
- Timing
- Delivery status

## Primary actions

- Record manual in-app reminder
- Configure template
- Enable rule
- View delivery

## Business rules

- 30/15/7/due/overdue reminders
- Critical Finding immediate manager-attention record
- Messages link to record
- No sensitive internal info in notifications
- Events are idempotent, organization scoped, and use `in_app` /
  `demo_recorded`
- Overdue escalation does not start enforcement
- Every history surface states `Demo in-app event; no real delivery`

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
