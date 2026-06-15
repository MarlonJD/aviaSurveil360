# Notifications and Reminders

## Purpose

Send due-date and status messages.

## Key fields

- Trigger
- Recipient
- Channel
- Subject
- Message
- Timing
- Delivery status

## Primary actions

- Send notification
- Configure template
- Enable rule
- View delivery

## Business rules

- 30/15/7/due/overdue reminders
- Critical finding immediate manager alert
- Messages link to record
- No sensitive internal info in notifications

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
