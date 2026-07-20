# Reminders and Escalation Workflow

## Purpose

Represent deterministic, browser-local reminder and manager-attention events
without claiming real notification delivery or production scheduling.

## Steps

1. Derive the exact calendar-day stage: 30 days, 15 days, 7 days, due today,
   overdue, or none
2. Record one idempotent Auditee event per eligible stage and Finding
3. Record immediate manager attention for an open Level 1 Critical Finding
4. Record a manager escalation event for an overdue Finding
5. Keep a user-triggered manual reminder as a separate audit-log event
6. Show stage, recipient, date, `demo_recorded` status, and the demo boundary

## Rules

- Event IDs are deterministic and are not duplicated for the same Finding and
  stage.
- Every event is organization scoped, uses channel `in_app`, and uses delivery
  status `demo_recorded`.
- Auditee views show only Auditee-recipient events for that organization.
- Every history surface states `Demo in-app event; no real delivery`.
- Manager attention and overdue escalation never start enforcement, close a
  Finding, or imply production delivery.

## UX notes

- Show current owner, due date and next action at the top of the screen.
- Keep the reminder history readable but secondary to the Finding's next action.
- Use primary buttons that match the next action.
